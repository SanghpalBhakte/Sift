// =============================================================================
// Sift - Annual Contract Optimization & Plan Arbitrage Engine
// Path: src/lib/utils/annualOptimization.ts
// =============================================================================

import { AnnualComparisonResult, Subscription } from '../types';
import { getDaysUntil } from './dates';

/**
 * Calculates annual-vs-monthly plan comparison metrics for a single subscription
 */
export function calculateAnnualComparison(
  subscription: Subscription,
  reviewWindowDays: number = 30
): AnnualComparisonResult {
  const annualAmount = subscription.amount;
  const effectiveMonthlyRate = Math.round((annualAmount / 12) * 100) / 100;
  const daysUntilRenewal = getDaysUntil(subscription.next_renewal_date);
  const isWithinReviewWindow = daysUntilRenewal >= 0 && daysUntilRenewal <= reviewWindowDays;

  const monthlyPrice = subscription.monthly_alternative_price;

  if (monthlyPrice && monthlyPrice > 0) {
    const yearlyAtMonthlyRate = Math.round(monthlyPrice * 12 * 100) / 100;
    const annualSavingsAmount = Math.round((yearlyAtMonthlyRate - annualAmount) * 100) / 100;
    const savingsPercent =
      yearlyAtMonthlyRate > 0
        ? Math.round((annualSavingsAmount / yearlyAtMonthlyRate) * 100)
        : 0;
    const monthsFreeEquivalent =
      monthlyPrice > 0
        ? Math.round((annualSavingsAmount / monthlyPrice) * 10) / 10
        : 0;

    let insightType: AnnualComparisonResult['insightType'] = 'annual_cheaper';
    if (annualSavingsAmount < 0) {
      insightType = 'monthly_cheaper';
    } else if (annualSavingsAmount === 0) {
      insightType = 'equal_price';
    }

    return {
      subscription,
      annualAmount,
      effectiveMonthlyRate,
      monthlyAlternativePrice: monthlyPrice,
      yearlyAtMonthlyRate,
      annualSavingsAmount,
      savingsPercent,
      monthsFreeEquivalent,
      insightType,
      daysUntilRenewal,
      isWithinReviewWindow,
    };
  }

  return {
    subscription,
    annualAmount,
    effectiveMonthlyRate,
    monthlyAlternativePrice: null,
    yearlyAtMonthlyRate: null,
    annualSavingsAmount: null,
    savingsPercent: null,
    monthsFreeEquivalent: null,
    insightType: 'missing_monthly_price',
    daysUntilRenewal,
    isWithinReviewWindow,
  };
}

/**
 * Returns annual subscriptions nearing renewal within the specified review window (default: 30 days)
 */
export function getUpcomingAnnualRenewals(
  subscriptions: Subscription[],
  reviewWindowDays: number = 30
): AnnualComparisonResult[] {
  const activeYearly = subscriptions.filter(
    (s) => s.status === 'active' && s.billing_cycle === 'yearly'
  );

  return activeYearly
    .map((sub) => calculateAnnualComparison(sub, reviewWindowDays))
    .filter((res) => res.isWithinReviewWindow)
    .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);
}

/**
 * Returns all active annual subscriptions with comparison metrics
 */
export function getAllAnnualSubscriptions(
  subscriptions: Subscription[]
): AnnualComparisonResult[] {
  const activeYearly = subscriptions.filter(
    (s) => s.status === 'active' && s.billing_cycle === 'yearly'
  );

  return activeYearly
    .map((sub) => calculateAnnualComparison(sub))
    .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);
}
