import {
  Category,
  DashboardStats,
  SpendTrendPoint,
  Subscription,
  TopSubscriptionItem,
  UpcomingPaymentItem,
  ValueRating,
} from '../types';
import { normalizeMonthlyAmount } from './currency';
import { getDaysUntil, isUpcomingSoon } from './dates';
import { format, subMonths, startOfMonth, parseISO, isAfter, isBefore } from 'date-fns';

/**
 * Calculates primary dashboard and overview stats from subscription list.
 * Excludes archived and canceled items from active recurring run-rates.
 */
export function calculateDashboardStats(subscriptions: Subscription[]): DashboardStats {
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const pausedSubs = subscriptions.filter((s) => s.status === 'paused');
  const trialSubs = subscriptions.filter((s) => s.is_trial && s.status === 'active');
  const cancelCandidates = subscriptions.filter(
    (s) => s.value_rating === 'cancel_candidate' && s.status === 'active'
  );

  const monthlyTotal = activeSubs.reduce(
    (acc, sub) =>
      acc +
      (sub.monthly_amount ||
        normalizeMonthlyAmount(sub.amount, sub.billing_cycle, sub.custom_interval_days)),
    0
  );

  const averageMonthlySpend =
    activeSubs.length > 0 ? Math.round((monthlyTotal / activeSubs.length) * 100) / 100 : 0;

  const potentialMonthlySavings = cancelCandidates.reduce(
    (acc, sub) =>
      acc +
      (sub.monthly_amount ||
        normalizeMonthlyAmount(sub.amount, sub.billing_cycle, sub.custom_interval_days)),
    0
  );

  const upcomingRenewalsCount = activeSubs.filter((s) =>
    isUpcomingSoon(s.next_renewal_date, 7)
  ).length;

  // Upcoming 30-day payment pressure
  const next30DaysPayments = calculateUpcoming30DayCharges(subscriptions);
  const upcoming30DaysTotal = next30DaysPayments.reduce((acc, item) => acc + item.amount, 0);

  // Find nearest renewal among active subscriptions
  const sortedActive = [...activeSubs].sort(
    (a, b) => new Date(a.next_renewal_date).getTime() - new Date(b.next_renewal_date).getTime()
  );
  const nextUpcomingRenewal = sortedActive.length > 0 ? sortedActive[0] : null;

  return {
    monthlyTotal: Math.round(monthlyTotal * 100) / 100,
    yearlyProjected: Math.round(monthlyTotal * 12 * 100) / 100,
    averageMonthlySpend,
    activeCount: activeSubs.length,
    pausedCount: pausedSubs.length,
    trialCount: trialSubs.length,
    cancelCandidateCount: cancelCandidates.length,
    potentialMonthlySavings: Math.round(potentialMonthlySavings * 100) / 100,
    upcomingRenewalsCount,
    upcoming30DaysTotal: Math.round(upcoming30DaysTotal * 100) / 100,
    nextUpcomingRenewal,
  };
}

/**
 * Calculates upcoming billing charges occurring within the next 30 days.
 */
export function calculateUpcoming30DayCharges(
  subscriptions: Subscription[],
  daysWindow: number = 30
): UpcomingPaymentItem[] {
  const activeSubs = subscriptions.filter((s) => s.status === 'active');

  const upcoming: UpcomingPaymentItem[] = [];

  activeSubs.forEach((sub) => {
    const daysUntil = getDaysUntil(sub.next_renewal_date);
    if (daysUntil >= 0 && daysUntil <= daysWindow) {
      upcoming.push({
        subscription: sub,
        renewalDate: sub.next_renewal_date,
        amount: sub.amount,
        daysUntil,
        isUrgent: daysUntil <= 3,
      });
    }
  });

  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
}

/**
 * Returns top cost-driving subscriptions ranked by normalized monthly amount.
 */
export function calculateTopSubscriptions(
  subscriptions: Subscription[],
  limit: number = 5
): TopSubscriptionItem[] {
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const totalMonthly = activeSubs.reduce(
    (acc, sub) =>
      acc +
      (sub.monthly_amount ||
        normalizeMonthlyAmount(sub.amount, sub.billing_cycle, sub.custom_interval_days)),
    0
  );

  const sorted = [...activeSubs].sort((a, b) => {
    const amountA =
      a.monthly_amount ||
      normalizeMonthlyAmount(a.amount, a.billing_cycle, a.custom_interval_days);
    const amountB =
      b.monthly_amount ||
      normalizeMonthlyAmount(b.amount, b.billing_cycle, b.custom_interval_days);
    return amountB - amountA;
  });

  return sorted.slice(0, limit).map((sub) => {
    const monthlyAmount =
      sub.monthly_amount ||
      normalizeMonthlyAmount(sub.amount, sub.billing_cycle, sub.custom_interval_days);
    const percentageOfTotal =
      totalMonthly > 0 ? Math.round((monthlyAmount / totalMonthly) * 100) : 0;

    return {
      subscription: sub,
      monthlyAmount: Math.round(monthlyAmount * 100) / 100,
      percentageOfTotal,
    };
  });
}

/**
 * Calculates a clean, calm monthly spend timeline for the past N months.
 * Determines how recurring commitments stacked up over time based on start_date.
 */
export function calculateSpendTrend(
  subscriptions: Subscription[],
  monthsCount: number = 6
): SpendTrendPoint[] {
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const points: SpendTrendPoint[] = [];
  const now = new Date();

  for (let i = monthsCount - 1; i >= 0; i--) {
    const targetMonthDate = subMonths(now, i);
    const targetMonthStart = startOfMonth(targetMonthDate);
    const monthLabel = format(targetMonthDate, 'MMM');
    const yearMonth = format(targetMonthDate, 'yyyy-MM');

    // Filter subscriptions that were active on or before this month
    const subsInMonth = activeSubs.filter((sub) => {
      try {
        const startDate = parseISO(sub.start_date);
        return isBefore(startDate, targetMonthStart) || format(startDate, 'yyyy-MM') === yearMonth;
      } catch {
        return true;
      }
    });

    const totalMonthly = subsInMonth.reduce(
      (acc, sub) =>
        acc +
        (sub.monthly_amount ||
          normalizeMonthlyAmount(sub.amount, sub.billing_cycle, sub.custom_interval_days)),
      0
    );

    points.push({
      monthLabel,
      yearMonth,
      totalMonthly: Math.round(totalMonthly * 100) / 100,
      activeCount: subsInMonth.length,
    });
  }

  return points;
}

export interface CategorySpendItem {
  category: Category;
  totalMonthly: number;
  percentage: number;
  count: number;
}

export function calculateCategoryBreakdown(
  subscriptions: Subscription[],
  categories: Category[]
): CategorySpendItem[] {
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const totalMonthly = activeSubs.reduce(
    (acc, sub) =>
      acc +
      (sub.monthly_amount ||
        normalizeMonthlyAmount(sub.amount, sub.billing_cycle, sub.custom_interval_days)),
    0
  );

  if (totalMonthly === 0) return [];

  const categoryMap = new Map<string, { total: number; count: number }>();

  // Map of uncategorized fallback
  const uncategorizedCat: Category = {
    id: 'uncategorized',
    name: 'General & Other',
    slug: 'general-other',
    color: 'stone',
    icon: 'folder',
    created_at: new Date().toISOString(),
  };

  activeSubs.forEach((sub) => {
    const catId = sub.category_id || 'uncategorized';
    const monthly =
      sub.monthly_amount ||
      normalizeMonthlyAmount(sub.amount, sub.billing_cycle, sub.custom_interval_days);
    const existing = categoryMap.get(catId) || { total: 0, count: 0 };
    categoryMap.set(catId, {
      total: existing.total + monthly,
      count: existing.count + 1,
    });
  });

  const results: CategorySpendItem[] = [];

  categoryMap.forEach((data, catId) => {
    const category =
      catId === 'uncategorized'
        ? uncategorizedCat
        : categories.find((c) => c.id === catId) || uncategorizedCat;

    results.push({
      category,
      totalMonthly: Math.round(data.total * 100) / 100,
      percentage: Math.round((data.total / totalMonthly) * 100),
      count: data.count,
    });
  });

  return results.sort((a, b) => b.totalMonthly - a.totalMonthly);
}

export interface ValueRatingBreakdown {
  rating: ValueRating;
  label: string;
  totalMonthly: number;
  count: number;
  percentage: number;
}

export function calculateValueRatingBreakdown(
  subscriptions: Subscription[]
): ValueRatingBreakdown[] {
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const totalMonthly = activeSubs.reduce(
    (acc, sub) =>
      acc +
      (sub.monthly_amount ||
        normalizeMonthlyAmount(sub.amount, sub.billing_cycle, sub.custom_interval_days)),
    0
  );

  const ratings: { rating: ValueRating; label: string }[] = [
    { rating: 'essential', label: 'Essential' },
    { rating: 'useful', label: 'Useful' },
    { rating: 'rarely_used', label: 'Rarely Used' },
    { rating: 'cancel_candidate', label: 'Cancel Candidates' },
  ];

  return ratings.map((r) => {
    const subs = activeSubs.filter((s) => s.value_rating === r.rating);
    const monthly = subs.reduce(
      (acc, s) =>
        acc +
        (s.monthly_amount ||
          normalizeMonthlyAmount(s.amount, s.billing_cycle, s.custom_interval_days)),
      0
    );

    return {
      rating: r.rating,
      label: r.label,
      totalMonthly: Math.round(monthly * 100) / 100,
      count: subs.length,
      percentage: totalMonthly > 0 ? Math.round((monthly / totalMonthly) * 100) : 0,
    };
  });
}
