import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { subscriptionService } from '@/lib/services/subscriptionService';
import { deriveAppAlerts } from '@/lib/utils/reminders';
import { formatCurrency } from '@/lib/utils/currency';
import { sendWebPushToUser } from '@/lib/services/serverPushService';
import { getServerEnv } from '@/lib/env';

// ---------------------------------------------------------------------------
// Shared dispatch logic
// ---------------------------------------------------------------------------
async function runDispatch(targetUser: { id: string; email: string }) {
  const serverEnv = getServerEnv();
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 500 });
  }

  const resendApiKey = serverEnv.RESEND_API_KEY;
  const resendFromEmail = serverEnv.RESEND_FROM_EMAIL;

  const profile = await subscriptionService.getProfile();
  const subscriptions = await subscriptionService.getSubscriptions();

  const alerts = deriveAppAlerts(subscriptions, {
    enabled: profile?.notifications_enabled !== false,
    notifyRenewals: profile?.notify_renewals !== false,
    notifyTrials: profile?.notify_trials !== false,
    offsets: profile?.default_reminder_days || [7, 3, 1],
  });

  const results = {
    userEmail: targetUser.email,
    totalDueAlerts: alerts.length,
    sent: 0,
    pushSent: 0,
    skipped: 0,
    failed: 0,
    dispatches: [] as any[],
  };

  for (const alert of alerts) {
    const { data: existingLog } = await (supabase.from('reminder_dispatch_logs') as any)
      .select('id')
      .eq('subscription_id', alert.subscriptionId)
      .eq('reminder_type', alert.isTrial ? 'trial_expiry' : 'renewal')
      .eq('target_date', alert.targetDate)
      .eq('offset_days', alert.daysUntil)
      .eq('status', 'sent')
      .maybeSingle();

    if (!existingLog) {
      let emailDispatched = false;
      let pushDispatched = false;
      let dispatchError: string | null = null;

      // 1. Send Transactional Email via Resend
      if (resendApiKey) {
        try {
          const subject =
            alert.daysUntil === 0
              ? `[Sift] ${alert.subscriptionName} Renews Today (${formatCurrency(alert.amount, alert.currency)})`
              : alert.isTrial
              ? `[Sift] Action Needed: ${alert.subscriptionName} Trial Ends in ${alert.daysUntil} Days`
              : `[Sift] Upcoming Renewal: ${alert.subscriptionName} in ${alert.daysUntil} Days`;

          const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; color: #1c1c1a; background: #faf9f5; border-radius: 12px; border: 1px solid #e5e4de;">
              <div style="margin-bottom: 20px; font-size: 14px; font-weight: 700; color: #2d5a43; letter-spacing: -0.01em;">
                SIFT · SUBSCRIPTION LEDGER
              </div>
              <h2 style="font-size: 18px; margin: 0 0 12px 0; color: #1c1c1a;">${alert.title}</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #55544d; margin: 0 0 20px 0;">${alert.message}</p>
              <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e5e4de; margin-bottom: 24px;">
                <table style="width: 100%; font-size: 13px;">
                  <tr>
                    <td style="color: #78776f; padding-bottom: 6px;">Service:</td>
                    <td style="font-weight: 600; text-align: right; padding-bottom: 6px;">${alert.subscriptionName}</td>
                  </tr>
                  <tr>
                    <td style="color: #78776f; padding-bottom: 6px;">Charge Amount:</td>
                    <td style="font-weight: 600; text-align: right; padding-bottom: 6px; font-family: monospace;">${formatCurrency(alert.amount, alert.currency)}</td>
                  </tr>
                  <tr>
                    <td style="color: #78776f;">Charge Date:</td>
                    <td style="font-weight: 600; text-align: right;">${alert.targetDate}</td>
                  </tr>
                </table>
              </div>
              ${
                alert.cancelUrl
                  ? `<div style="text-align: center; margin-bottom: 20px;">
                      <a href="${alert.cancelUrl}" style="display: inline-block; background: #2d5a43; color: #ffffff; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none;">Manage or Cancel Service</a>
                     </div>`
                  : ''
              }
              <div style="font-size: 11px; color: #a1a098; text-align: center; border-top: 1px solid #e5e4de; padding-top: 16px;">
                Sent quietly by Sift · Personal Recurring Spend Workspace
              </div>
            </div>
          `;

          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: resendFromEmail,
              to: targetUser.email,
              subject,
              html,
            }),
          });

          if (res.ok) {
            emailDispatched = true;
          } else {
            const errBody = await res.json();
            dispatchError = `Resend error: ${errBody.message || res.statusText}`;
          }
        } catch (err: any) {
          dispatchError = `Email network error: ${err.message}`;
        }
      }

      // 2. Dispatch Native Web Push Alert
      try {
        const pushRes = await sendWebPushToUser(targetUser.id, {
          title: alert.title,
          body: `${alert.subscriptionName}: ${formatCurrency(alert.amount, alert.currency)} due on ${alert.targetDate}`,
          url: `/subscriptions/${alert.subscriptionId}/edit`,
          tag: `renewal-${alert.subscriptionId}`,
          subscriptionId: alert.subscriptionId,
        });
        if (pushRes.sent > 0) {
          pushDispatched = true;
        }
      } catch (err: any) {
        console.warn('Web push dispatch error:', err);
      }

      // 3. Record dispatch log
      const status = emailDispatched || pushDispatched ? 'sent' : 'failed';
      await (supabase.from('reminder_dispatch_logs') as any).insert({
        user_id: targetUser.id,
        subscription_id: alert.subscriptionId,
        reminder_type: alert.isTrial ? 'trial_expiry' : 'renewal',
        target_date: alert.targetDate,
        offset_days: alert.daysUntil,
        recipient_email: targetUser.email,
        status,
        error_message: dispatchError,
      });

      if (emailDispatched) results.sent++;
      if (pushDispatched) results.pushSent++;
      if (!emailDispatched && !pushDispatched) results.failed++;

      results.dispatches.push({
        subscriptionName: alert.subscriptionName,
        emailDispatched,
        pushDispatched,
        error: dispatchError,
      });
    } else {
      results.skipped++;
    }
  }

  return NextResponse.json({ success: true, results });
}

// ---------------------------------------------------------------------------
// GET — Vercel Cron entrypoint
// Vercel injects: Authorization: Bearer <CRON_SECRET>
// This handler HARD-REJECTS if the secret is absent or mismatched.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const serverEnv = getServerEnv();

    if (!serverEnv.RESEND_API_KEY) {
      return NextResponse.json(
        {
          error: 'Email dispatch service unavailable: RESEND_API_KEY is not configured.',
          code: 'MISSING_EMAIL_CONFIGURATION',
          service: 'resend',
        },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 500 });
    }

    // In cron mode, iterate over ALL users with active profiles
    const { data: profiles } = await (supabase.from('profiles') as any)
      .select('id, email')
      .not('email', 'is', null);

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ success: true, message: 'No active profiles found' });
    }

    const allResults = [];
    for (const profile of profiles) {
      const res = await runDispatch({ id: profile.id, email: profile.email });
      const body = await res.json();
      allResults.push(body);
    }

    return NextResponse.json({ success: true, allResults });
  } catch (err: any) {
    console.error('Cron reminder dispatch error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Interactive / manual trigger from authenticated user session
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const serverEnv = getServerEnv();

    if (!serverEnv.RESEND_API_KEY) {
      return NextResponse.json(
        {
          error: 'Email dispatch service unavailable: RESEND_API_KEY is not configured in server environment.',
          code: 'MISSING_EMAIL_CONFIGURATION',
          service: 'resend',
        },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized request or session' }, { status: 401 });
    }

    return runDispatch({ id: user.id, email: user.email });
  } catch (err: any) {
    console.error('Reminder dispatch error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
