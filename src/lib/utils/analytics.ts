import { Category, DashboardStats, Subscription, ValueRating } from '../types';
import { normalizeMonthlyAmount } from './currency';
import { isUpcomingSoon } from './dates';

export function calculateDashboardStats(subscriptions: Subscription[]): DashboardStats {
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const trialSubs = subscriptions.filter((s) => s.is_trial && s.status === 'active');
  const cancelCandidates = subscriptions.filter(
    (s) => s.value_rating === 'cancel_candidate' && s.status === 'active'
  );

  const monthlyTotal = activeSubs.reduce(
    (acc, sub) => acc + (sub.monthly_amount || normalizeMonthlyAmount(sub.amount, sub.billing_cycle, sub.custom_interval_days)),
    0
  );

  const potentialMonthlySavings = cancelCandidates.reduce(
    (acc, sub) => acc + (sub.monthly_amount || normalizeMonthlyAmount(sub.amount, sub.billing_cycle, sub.custom_interval_days)),
    0
  );

  const upcomingRenewalsCount = activeSubs.filter((s) =>
    isUpcomingSoon(s.next_renewal_date, 7)
  ).length;

  return {
    monthlyTotal: Math.round(monthlyTotal * 100) / 100,
    yearlyProjected: Math.round(monthlyTotal * 12 * 100) / 100,
    activeCount: activeSubs.length,
    trialCount: trialSubs.length,
    cancelCandidateCount: cancelCandidates.length,
    potentialMonthlySavings: Math.round(potentialMonthlySavings * 100) / 100,
    upcomingRenewalsCount,
  };
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
    (acc, sub) => acc + (sub.monthly_amount || normalizeMonthlyAmount(sub.amount, sub.billing_cycle, sub.custom_interval_days)),
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
    const monthly = sub.monthly_amount || normalizeMonthlyAmount(sub.amount, sub.billing_cycle, sub.custom_interval_days);
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
    (acc, sub) => acc + (sub.monthly_amount || normalizeMonthlyAmount(sub.amount, sub.billing_cycle, sub.custom_interval_days)),
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
      (acc, s) => acc + (s.monthly_amount || normalizeMonthlyAmount(s.amount, s.billing_cycle, s.custom_interval_days)),
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
