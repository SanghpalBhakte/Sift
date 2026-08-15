// =============================================================================
// Sift - Server-Side Web Push Dispatch Engine
// Path: src/lib/services/serverPushService.ts
// =============================================================================

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BAsj-iwSBbkgA_BRK6C3hboIlYqRMOPnpZwzlNSBhIqkmEstnxLJW5_zwEtpay_ve-XYKLnwduVpWNRCNfBBYcQ';

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || '8rTyG0h_YAUaWXX17EeTZKvrUQ3OXD34D5b0kU3bvMk';

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@sift.app';

// Configure Web Push with VAPID credentials
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  subscriptionId?: string;
}

export async function sendWebPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number; cleaned: number }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    return { sent: 0, failed: 0, cleaned: 0 };
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Fetch active push subscriptions for this user
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (error || !subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0, cleaned: 0 };
  }

  let sent = 0;
  let failed = 0;
  let cleaned = 0;

  const notificationString = JSON.stringify(payload);

  for (const sub of subscriptions) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      await webpush.sendNotification(pushSubscription, notificationString);
      sent++;
    } catch (err: any) {
      console.warn(`Web push delivery failed for endpoint (${err.statusCode}):`, err.message);
      failed++;

      // If subscription is 404 (Not Found) or 410 (Gone / Expired), delete it permanently
      if (err.statusCode === 404 || err.statusCode === 410) {
        try {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          cleaned++;
          console.info(`Cleaned up dead push subscription id: ${sub.id}`);
        } catch {
          // ignore cleanup error
        }
      }
    }
  }

  return { sent, failed, cleaned };
}
