import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { subscriptionService } from '@/lib/services/subscriptionService';
import { deriveAppAlerts } from '@/lib/utils/reminders';
import { formatCurrency } from '@/lib/utils/currency';
import { sendWebPushToUser } from '@/lib/services/serverPushService';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    // Fetch user profile and preferences
    const profile = await subscriptionService.getProfile();
    const subscriptions = await subscriptionService.getSubscriptions();

    const alerts = deriveAppAlerts(subscriptions, {
      enabled: profile?.notifications_enabled !== false,
      notifyRenewals: profile?.notify_renewals !== false,
      notifyTrials: profile?.notify_trials !== false,
      offsets: profile?.default_reminder_days || [7, 3, 1],
    });

    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail =
      process.env.RESEND_FROM_EMAIL || 'Sift Reminders <onboarding@resend.dev>';

    const results = {
      userEmail: user.email,
      totalDueAlerts: alerts.length,
      sent: 0,
      pushSent: 0,
      skipped: 0,
      failed: 0,
      dispatches: [] as any[],
    };

    for (const alert of alerts) {
      // Check deduplication
      const { data: existingLog } = await (supabase.from('reminder_dispatch_logs') as any)
        .select('id')
        .eq('subscription_id', alert.subscriptionId)
        .eq('reminder_type', alert.isTrial ? 'trial_expiry' : 'renewal')
        .eq('target_date', alert.targetDate)
        .eq('offset_days', alert.daysUntil)
        .eq('status', 'sent')
        .maybeSingle();

      if (!existingLog) {
        let emailSuccess = false;

        // 1. Dispatch Email Alert (if Resend is configured)
        if (resendApiKey) {
          try {
            const subject = alert.isTrial
              ? `Action Needed: ${alert.subscriptionName} free trial ends in ${alert.daysUntil} days`
              : `Reminder: ${alert.subscriptionName} renews for ${formatCurrency(alert.amount, alert.currency)}`;

            const resendRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: resendFromEmail,
                to: [user.email],
                subject,
                html: `
                  <div style="font-family: sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e6e4dd; border-radius: 8px; background-color: #ffffff;">
                    <h2 style="color: #1e2322; margin-top: 0;">${alert.title}</h2>
                    <p style="color: #4a5553; line-height: 1.5;">${alert.message}</p>
                    <p style="font-size: 16px; font-weight: bold; color: #265f56;">Amount: ${formatCurrency(alert.amount, alert.currency)}</p>
                    <p style="font-size: 12px; color: #768280; margin-top: 24px; border-top: 1px solid #e6e4dd; padding-top: 12px;">
                      Sent by Sift recurring spend workspace.
                    </p>
                  </div>
                `,
              }),
            });

            const resendData = await resendRes.json();

            if (resendRes.ok && resendData.id) {
              emailSuccess = true;
              await (supabase.from('reminder_dispatch_logs') as any).insert({
                user_id: user.id,
                subscription_id: alert.subscriptionId,
                reminder_type: alert.isTrial ? 'trial_expiry' : 'renewal',
                target_date: alert.targetDate,
                offset_days: alert.daysUntil,
                delivery_channel: 'email',
                recipient_email: user.email,
                status: 'sent',
                external_id: resendData.id,
              });

              results.sent++;
              results.dispatches.push({
                subscription: alert.subscriptionName,
                channel: 'email',
                status: 'sent',
                id: resendData.id,
              });
            }
          } catch (err: any) {
            console.warn('Email dispatch failed:', err);
          }
        }

        // 2. Dispatch Web Push Alert to subscribed browsers
        try {
          const pushRes = await sendWebPushToUser(user.id, {
            title: alert.title,
            body: `${alert.subscriptionName} · ${formatCurrency(alert.amount, alert.currency)} (${alert.daysUntil === 0 ? 'Today' : `in ${alert.daysUntil} days`})`,
            url: `/subscriptions/${alert.subscriptionId}/edit`,
            tag: `sift-${alert.subscriptionId}-${alert.daysUntil}`,
            subscriptionId: alert.subscriptionId,
          });

          if (pushRes.sent > 0) {
            results.pushSent += pushRes.sent;
            results.dispatches.push({
              subscription: alert.subscriptionName,
              channel: 'web_push',
              status: 'sent',
              devices: pushRes.sent,
            });
          }
        } catch (err: any) {
          console.warn('Web push dispatch error:', err);
        }

        if (!emailSuccess && !resendApiKey) {
          results.sent++;
          results.dispatches.push({
            subscription: alert.subscriptionName,
            status: 'dry_run_simulated',
          });
        }
      } else {
        results.skipped++;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error('Error triggering reminder dispatch:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
