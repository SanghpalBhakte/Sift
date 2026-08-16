// =============================================================================
// Sift - Annual Contract Optimization & Plan Arbitrage Engine
// Path: src/lib/utils/annualOptimization.ts
// =============================================================================

import { AnnualComparisonResult, AnnualInsightType, Subscription } from '../types';
import { getDaysUntil } from './dates';

export interface AnnualSavingsMetrics {
  annualAmount: number;
  effectiveMonthlyRate: number;
  monthlyAlternativePrice: number | null;
  yearlyAtMonthlyRate: number | null;
  annualSavingsAmount: number | null;
  savingsPercent: number | null;
  monthsFreeEquivalent: number | null;
  insightType: AnnualInsightType;
}

/**
 * Pure calculation function for annual-vs-monthly savings metrics and plan arbitrage
 */
export function computeAnnualSavings(
  annualAmount: number,
  monthlyAlternativePrice?: number | null
): AnnualSavingsMetrics {
  // Normalize & guard annual amount
  const safeAnnual =
    typeof annualAmount === 'number' && !isNaN(annualAmount) && isFinite(annualAmount)
      ? Math.max(annualAmount, 0)
      : 0;

  const effectiveMonthlyRate = Math.round((safeAnnual / 12) * 100) / 100;

  // Validate monthly alternative price
  const validMonthly =
    typeof monthlyAlternativePrice === 'number' &&
    !isNaN(monthlyAlternativePrice) &&
    isFinite(monthlyAlternativePrice) &&
    monthlyAlternativePrice > 0
      ? monthlyAlternativePrice
      : null;

  if (validMonthly !== null) {
    const yearlyAtMonthlyRate = Math.round(validMonthly * 12 * 100) / 100;
    const annualSavingsAmount = Math.round((yearlyAtMonthlyRate - safeAnnual) * 100) / 100;
    
    const savingsPercent =
      yearlyAtMonthlyRate > 0
        ? Math.round((annualSavingsAmount / yearlyAtMonthlyRate) * 100)
        : 0;

    const monthsFreeEquivalent =
      validMonthly > 0
        ? Math.round((annualSavingsAmount / validMonthly) * 10) / 10
        : 0;

    let insightType: AnnualInsightType = 'annual_cheaper';
    if (annualSavingsAmount < 0) {
      insightType = 'monthly_cheaper';
    } else if (annualSavingsAmount === 0) {
      insightType = 'equal_price';
    }

    return {
      annualAmount: safeAnnual,
      effectiveMonthlyRate,
      monthlyAlternativePrice: validMonthly,
      yearlyAtMonthlyRate,
      annualSavingsAmount,
      savingsPercent,
      monthsFreeEquivalent,
      insightType,
    };
  }

  return {
    annualAmount: safeAnnual,
    effectiveMonthlyRate,
    monthlyAlternativePrice: null,
    yearlyAtMonthlyRate: null,
    annualSavingsAmount: null,
    savingsPercent: null,
    monthsFreeEquivalent: null,
    insightType: 'missing_monthly_price',
  };
}

/**
 * Calculates annual-vs-monthly plan comparison metrics for a single subscription
 */
export function calculateAnnualComparison(
  subscription: Subscription,
  reviewWindowDays: number = 30
): AnnualComparisonResult {
  const metrics = computeAnnualSavings(
    subscription.amount,
    subscription.monthly_alternative_price
  );

  const daysUntilRenewal = getDaysUntil(subscription.next_renewal_date);
  const isWithinReviewWindow =
    daysUntilRenewal >= 0 && daysUntilRenewal <= reviewWindowDays;

  return {
    subscription,
    ...metrics,
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

// -----------------------------------------------------------------------------
// Annual Arbitrage Batch Review Candidate Models & Pure Rule Engine
// -----------------------------------------------------------------------------

export interface AnnualArbitrageCandidate {
  subscription: Subscription;
  currentMonthlyCost: number;
  yearlyAtMonthlyRate: number;
  projectedAnnualCost: number;
  projectedAnnualSavings: number;
  savingsPercent: number;
  confidence: 'high' | 'medium';
  eligibilityRule: string;
  whyExplanation: string;
}

/**
 * Pure evaluation function to identify stable, high-value monthly subscriptions
 * that qualify for grouped annual discount arbitrage review.
 */
export function getAnnualArbitrageCandidates(
  subscriptions: Subscription[],
  minAnnualSavingsThreshold: number = 15
): AnnualArbitrageCandidate[] {
  const activeMonthly = subscriptions.filter(
    (s) =>
      s.status === 'active' &&
      s.billing_cycle === 'monthly' &&
      !s.is_trial &&
      (s.value_rating === 'essential' || s.value_rating === 'useful') &&
      typeof s.amount === 'number' &&
      s.amount >= 5
  );

  const candidates: AnnualArbitrageCandidate[] = [];

  for (const sub of activeMonthly) {
    const monthlyCost = sub.amount;
    const yearlyAtMonthlyRate = Math.round(monthlyCost * 12 * 100) / 100;

    // Standard benchmark: ~16.7% annual discount (2 months free / pay for 10 months)
    // or explicit monthly alternative if configured
    let projectedAnnualCost = Math.round(monthlyCost * 10 * 100) / 100;
    let savingsPercent = 17;

    if (
      typeof sub.monthly_alternative_price === 'number' &&
      sub.monthly_alternative_price > 0 &&
      sub.monthly_alternative_price < monthlyCost
    ) {
      // If user recorded an explicit alternative rate
      projectedAnnualCost = Math.round(sub.monthly_alternative_price * 12 * 100) / 100;
      savingsPercent = Math.round(((yearlyAtMonthlyRate - projectedAnnualCost) / yearlyAtMonthlyRate) * 100);
    }

    const projectedAnnualSavings = Math.round((yearlyAtMonthlyRate - projectedAnnualCost) * 100) / 100;

    if (projectedAnnualSavings >= minAnnualSavingsThreshold) {
      const isEssential = sub.value_rating === 'essential';
      candidates.push({
        subscription: sub,
        currentMonthlyCost: monthlyCost,
        yearlyAtMonthlyRate,
        projectedAnnualCost,
        projectedAnnualSavings,
        savingsPercent,
        confidence: isEssential ? 'high' : 'medium',
        eligibilityRule: isEssential
          ? 'Rule: Declared Essential value rating with active monthly billing >= $5/mo'
          : 'Rule: Declared Useful value rating with active monthly billing >= $5/mo',
        whyExplanation: isEssential
          ? `You marked ${sub.name} as Essential. Because you plan to keep this service long-term, converting from monthly to annual typically saves ~15–20%.`
          : `Active service with useful rating. Annual billing provides immediate recurring savings for ongoing tools.`,
      });
    }
  }

  // Sort candidates by highest projected savings first
  return candidates.sort((a, b) => b.projectedAnnualSavings - a.projectedAnnualSavings);
}
