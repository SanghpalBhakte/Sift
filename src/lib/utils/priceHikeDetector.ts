// =============================================================================
// Sift - Price-Hike Detector & Ethical Cancellation Advisor
// Path: src/lib/utils/priceHikeDetector.ts
// =============================================================================

import { CancellationReason, PriceHikeAlert, Subscription } from '../types';
import { convertCurrency, formatCurrency, normalizeMonthlyAmount } from './currency';
import { formatDate, getDaysUntil } from './dates';
import { DEFAULT_OFFLINE_RATES } from '../services/exchangeRateService';

export interface MatchedAlternative {
  title: string;
  description: string;
  recommendedAction:
    | 'pause_review'
    | 'downgrade_review'
    | 'cadence_switch'
    | 'keep_until_renewal'
    | 'overlap_review'
    | 'confirm_cancel';
  actionButtonLabel: string;
  secondaryOptionLabel?: string;
  externalLinkText?: string;
  externalLinkUrl?: string;
}

/**
 * Returns a calm, single matched alternative based on the user's chosen cancellation reason.
 * Never attempts to guilt-trip or trap the user; keeps direct cancellation accessible.
 */
export function getCancellationMatchedAlternative(
  reason: CancellationReason,
  subscription: Subscription
): MatchedAlternative {
  const nextRenewalFormatted = formatDate(subscription.next_renewal_date);
  const daysUntil = getDaysUntil(subscription.next_renewal_date);

  switch (reason) {
    case 'too_expensive':
      return {
        title: 'Check Plan Tiers or Annual Discount',
        description: `Many services offer lower usage tiers, annual pricing discounts, or paused billing before complete cancellation.`,
        recommendedAction: 'downgrade_review',
        actionButtonLabel: 'Review / Edit Plan',
        secondaryOptionLabel: 'Set Reminder Before Renewal',
        externalLinkText: subscription.cancel_url ? `Open ${subscription.name} Account Page` : undefined,
        externalLinkUrl: subscription.cancel_url,
      };

    case 'temporary_pause':
      return {
        title: 'Pause Subscription in Sift',
        description: `Pausing in Sift will exclude this charge from your active monthly budget while keeping renewal dates and notes intact for when you return.`,
        recommendedAction: 'pause_review',
        actionButtonLabel: 'Pause in Sift',
        secondaryOptionLabel: 'Proceed with Full Cancellation',
        externalLinkText: subscription.cancel_url ? `Open ${subscription.name} Portal` : undefined,
        externalLinkUrl: subscription.cancel_url,
      };

    case 'not_using_enough':
      return {
        title: `Keep Until Next Renewal (${nextRenewalFormatted})`,
        description: `You have already paid for the current cycle (${daysUntil > 0 ? `${daysUntil} days remaining` : 'renewing soon'}). You can set a reminder to cancel right before the next charge.`,
        recommendedAction: 'keep_until_renewal',
        actionButtonLabel: `Set Reminder for ${nextRenewalFormatted}`,
        secondaryOptionLabel: 'Cancel in Sift Immediately',
        externalLinkText: subscription.cancel_url ? `Direct ${subscription.name} Cancel Page` : undefined,
        externalLinkUrl: subscription.cancel_url,
      };

    case 'duplicate_overlap':
      return {
        title: 'Compare with Other Active Subscriptions',
        description: `Review your active subscription list to ensure you keep only your preferred tool in this category.`,
        recommendedAction: 'overlap_review',
        actionButtonLabel: 'View All Subscriptions',
        secondaryOptionLabel: 'Proceed with Cancellation',
        externalLinkText: subscription.cancel_url ? `Cancel ${subscription.name}` : undefined,
        externalLinkUrl: subscription.cancel_url,
      };

    case 'switching_service':
      return {
        title: 'Confirm Replacement & Cancel',
        description: `Ensure your data is backed up or migrated before closing your ${subscription.name} account.`,
        recommendedAction: 'confirm_cancel',
        actionButtonLabel: 'Proceed with Cancellation',
        externalLinkText: subscription.cancel_url ? `Open ${subscription.name} Account Page` : undefined,
        externalLinkUrl: subscription.cancel_url,
      };

    case 'missing_value':
    case 'other':
    default:
      return {
        title: 'Confirm Official Cancellation',
        description: `Sift will mark this subscription as canceled in your personal ledger. To stop charges, remember to also cancel on ${subscription.name}'s website.`,
        recommendedAction: 'confirm_cancel',
        actionButtonLabel: 'Mark as Canceled in Sift',
        externalLinkText: subscription.cancel_url ? `Open ${subscription.name} Cancellation Link` : undefined,
        externalLinkUrl: subscription.cancel_url,
      };
  }
}

/**
 * Detects subscriptions with recorded price hikes or upcoming cost increase signals.
 */
export function detectPriceHikes(
  subscriptions: Subscription[],
  targetCurrency: string = 'USD',
  rates: Record<string, number> = DEFAULT_OFFLINE_RATES
): PriceHikeAlert[] {
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const alerts: PriceHikeAlert[] = [];

  activeSubs.forEach((sub) => {
    // Check 1: Explicitly recorded price hike where current amount > previous_amount
    if (
      typeof sub.previous_amount === 'number' &&
      sub.previous_amount > 0 &&
      sub.amount > sub.previous_amount
    ) {
      const isReviewed = Boolean(
        sub.price_hike_reviewed_at &&
          new Date(sub.price_hike_reviewed_at) >= new Date(sub.updated_at || sub.created_at)
      );

      const oldMonthly = normalizeMonthlyAmount(sub.previous_amount, sub.billing_cycle);
      const newMonthly = normalizeMonthlyAmount(sub.amount, sub.billing_cycle);
      const monthlyDelta = Math.round((newMonthly - oldMonthly) * 100) / 100;
      const percentageIncrease = Math.round(((sub.amount - sub.previous_amount) / sub.previous_amount) * 100);

      alerts.push({
        id: `hike-recorded-${sub.id}`,
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        currentAmount: sub.amount,
        previousAmount: sub.previous_amount,
        currency: sub.currency,
        billingCycle: sub.billing_cycle,
        monthlyDelta,
        percentageIncrease,
        nextRenewalDate: sub.next_renewal_date,
        whyExplanation: `Recorded price increase from ${formatCurrency(sub.previous_amount, sub.currency)} to ${formatCurrency(sub.amount, sub.currency)} (+${percentageIncrease}%).`,
        heuristicRule: 'Rule: current amount > previous recorded amount',
        isReviewed,
        reviewedAt: sub.price_hike_reviewed_at,
      });
    }
  });

  return alerts;
}
