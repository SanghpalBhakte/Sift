'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { WelcomeScreen } from '@/components/dashboard/WelcomeScreen';
import { SubscriptionCard } from '@/components/subscriptions/SubscriptionCard';
import { Button } from '@/components/ui/Button';
import { formatCurrency, normalizeMonthlyAmount } from '@/lib/utils/currency';
import { formatDate, getCountdownBadge, getDaysUntil } from '@/lib/utils/dates';
import {
  ArrowRight,
  Plus,
  Sparkles,
  Calendar,
  Receipt,
  Search,
  Layers,
  TrendingUp,
  ShieldAlert,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const RestoreModal = dynamic(
  () => import('@/components/backup/RestoreModal').then((m) => m.RestoreModal),
  { ssr: false }
);

export function DashboardClient() {
  const {
    subscriptions,
    categories,
    stats,
    displayCurrency,
    isLoading,
    toggleStatus,
    deleteSubscription,
  } = useSubscriptions();

  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const targetCurrency = stats.displayCurrency || displayCurrency || 'USD';

  // 1. Active subscriptions
  const activeSubscriptions = useMemo(() => {
    return subscriptions.filter((s) => s.status === 'active');
  }, [subscriptions]);

  // 2. Upcoming Renewals in Next 7 Days
  const next7DaysRenewals = useMemo(() => {
    return activeSubscriptions.filter((s) => {
      const days = getDaysUntil(s.next_renewal_date);
      return days >= 0 && days <= 7;
    });
  }, [activeSubscriptions]);

  const next7DaysTotal = useMemo(() => {
    return next7DaysRenewals.reduce((sum, s) => sum + s.amount, 0);
  }, [next7DaysRenewals]);

  // 3. Chronological Upcoming 30 Days Renewals (Top 4)
  const upcomingChronological = useMemo(() => {
    return [...activeSubscriptions]
      .filter((s) => getDaysUntil(s.next_renewal_date) >= 0)
      .sort(
        (a, b) =>
          new Date(a.next_renewal_date).getTime() - new Date(b.next_renewal_date).getTime()
      )
      .slice(0, 4);
  }, [activeSubscriptions]);

  // 4. Top Spend by Category Breakdown
  const categorySpendDistribution = useMemo(() => {
    if (stats.monthlyTotal === 0 || activeSubscriptions.length === 0) return [];
    const catMap: Record<string, { categoryName: string; color: string; monthlyAmount: number }> = {};
    for (const sub of activeSubscriptions) {
      const catId = sub.category_id || 'unassigned';
      const catName = sub.category?.name || 'Unassigned';
      const catColor = sub.category?.color || 'hsl(var(--primary))';
      const monthly =
        sub.monthly_amount ||
        normalizeMonthlyAmount(sub.amount, sub.billing_cycle, sub.custom_interval_days);
      if (!catMap[catId]) {
        catMap[catId] = { categoryName: catName, color: catColor, monthlyAmount: 0 };
      }
      catMap[catId].monthlyAmount += monthly;
    }

    return Object.entries(catMap)
      .map(([id, data]) => ({
        categoryId: id,
        categoryName: data.categoryName,
        color: data.color,
        monthlyAmount: data.monthlyAmount,
        percentage: Math.min(100, Math.round((data.monthlyAmount / stats.monthlyTotal) * 100)),
      }))
      .sort((a, b) => b.monthlyAmount - a.monthlyAmount)
      .slice(0, 4);
  }, [activeSubscriptions, stats.monthlyTotal]);

  // 5. Category filter pills
  const topCategories = useMemo(() => {
    const countMap: Record<string, number> = {};
    for (const sub of activeSubscriptions) {
      if (sub.category_id) {
        countMap[sub.category_id] = (countMap[sub.category_id] || 0) + 1;
      }
    }

    const activeCats = categories
      .filter((c) => (countMap[c.id] || 0) > 0)
      .sort((a, b) => (countMap[b.id] || 0) - (countMap[a.id] || 0));

    if (activeCats.length < 6) {
      const remaining = categories.filter((c) => !activeCats.some((ac) => ac.id === c.id));
      return [...activeCats, ...remaining].slice(0, 6);
    }

    return activeCats.slice(0, 6);
  }, [categories, activeSubscriptions]);

  // 6. Filtered subscriptions for the dashboard ledger
  const filteredSubscriptions = useMemo(() => {
    let list = activeSubscriptions;
    if (selectedCategoryId !== 'all') {
      list = list.filter((s) => s.category_id === selectedCategoryId);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.category?.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeSubscriptions, selectedCategoryId, searchQuery]);

  const nextRenewal = stats.nextUpcomingRenewal;
  const nextRenewalCountdown = nextRenewal
    ? getCountdownBadge(nextRenewal.next_renewal_date)
    : null;

  // Zero-subscription state
  if (!isLoading && subscriptions.length === 0) {
    return (
      <>
        <WelcomeScreen onRestoreClick={() => setIsRestoreModalOpen(true)} />
        <RestoreModal
          isOpen={isRestoreModalOpen}
          onClose={() => setIsRestoreModalOpen(false)}
          onSuccess={() => setIsRestoreModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* ─── 1. Desktop Command Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-foreground">
              Recurring Spend Overview
            </h1>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-surface text-muted-foreground border border-border/80">
              {activeSubscriptions.length} Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time commitments, renewal horizon, and cashflow distribution.
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Period Selector */}
          <div className="flex items-center gap-0.5 p-1 bg-surface border border-border/80 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setPeriod('monthly')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium text-xs transition-all cursor-pointer',
                period === 'monthly'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setPeriod('yearly')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium text-xs transition-all cursor-pointer',
                period === 'yearly'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Yearly
            </button>
          </div>

          <Link href="/subscriptions/new" className="hidden sm:inline-flex">
            <Button variant="primary" size="sm" className="gap-1.5 shadow-xs px-3">
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add Subscription</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── 2. Top Balanced KPI Strip (4 Columns) ───────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* KPI 1: Monthly / Yearly Commitments */}
        <div className="sweep-kpi-card min-h-[120px] bg-gradient-to-br from-card to-surface/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-sans">
              {period === 'monthly' ? 'Monthly Spend' : 'Yearly Spend'}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.2 rounded bg-surface border border-border/60">
              {period === 'monthly' ? '/mo' : '/yr'}
            </span>
          </div>

          <div className="my-1.5">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {formatCurrency(
                period === 'monthly' ? stats.monthlyTotal : stats.yearlyProjected,
                targetCurrency
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Across {activeSubscriptions.length} active service{activeSubscriptions.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Annual Run-Rate</span>
            <span className="font-mono font-semibold text-foreground">
              {formatCurrency(stats.yearlyProjected, targetCurrency)}/yr
            </span>
          </div>
        </div>

        {/* KPI 2: Next 7-Day Horizon */}
        <div className="sweep-kpi-card min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-sans flex items-center gap-1">
              <Calendar className="w-3 h-3 opacity-60" />
              <span>7-Day Renewals</span>
            </span>
            {next7DaysRenewals.length > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-warning-subtle text-warning border border-warning/30">
                {next7DaysRenewals.length} due
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">All clear</span>
            )}
          </div>

          <div className="my-1.5">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {next7DaysRenewals.length > 0 ? (
                formatCurrency(next7DaysTotal, targetCurrency)
              ) : (
                <span className="text-muted-foreground text-xl font-normal">None due</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {next7DaysRenewals.length > 0
                ? `${next7DaysRenewals.length} service${next7DaysRenewals.length === 1 ? '' : 's'} renewing soon`
                : 'No upcoming renewal charges'}
            </p>
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>30-Day Outlook</span>
            <span className="font-mono font-semibold text-foreground">
              {formatCurrency(stats.upcoming30DaysTotal, targetCurrency)}
            </span>
          </div>
        </div>

        {/* KPI 3: Next Immediate Renewal */}
        <div className="sweep-kpi-card min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-sans flex items-center gap-1">
              <Receipt className="w-3 h-3 opacity-60" />
              <span>Next Renewal</span>
            </span>
            {nextRenewalCountdown && (
              <span
                className={cn(
                  'text-[10px] font-medium px-1.5 py-0.2 rounded-full border',
                  nextRenewalCountdown.urgent
                    ? 'bg-danger-subtle text-danger border-danger/30 font-semibold'
                    : 'bg-surface text-muted-foreground border-border'
                )}
              >
                {nextRenewalCountdown.label}
              </span>
            )}
          </div>

          {nextRenewal ? (
            <div className="my-1.5 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-base sm:text-lg font-bold text-foreground truncate block">
                  {nextRenewal.name}
                </span>
                <span className="text-base font-mono font-bold text-foreground tabular-nums shrink-0">
                  {formatCurrency(nextRenewal.amount, nextRenewal.currency)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                Due {formatDate(nextRenewal.next_renewal_date)}
              </p>
            </div>
          ) : (
            <div className="my-1.5">
              <p className="text-base font-semibold text-foreground">Peace of mind</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">No renewals pending</p>
            </div>
          )}

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Billing Mode</span>
            <span className="capitalize">{nextRenewal?.billing_cycle || 'None'}</span>
          </div>
        </div>

        {/* KPI 4: Intelligence & Health */}
        <div className="sweep-kpi-card min-h-[120px] bg-gradient-to-br from-card to-surface/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-sans flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary opacity-80" />
              <span>Optimization</span>
            </span>
            <Link
              href="/insights"
              className="text-[10px] text-primary font-medium hover:underline flex items-center gap-0.5"
            >
              <span>Insights</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </Link>
          </div>

          <div className="my-1.5">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums flex items-baseline gap-2">
              <span>{stats.cancelCandidateCount + stats.trialCount}</span>
              <span className="text-xs font-normal text-muted-foreground">items flagged</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {stats.trialCount > 0
                ? `${stats.trialCount} free trial${stats.trialCount > 1 ? 's' : ''} in progress`
                : stats.cancelCandidateCount > 0
                ? `${stats.cancelCandidateCount} candidate${stats.cancelCandidateCount > 1 ? 's' : ''} to review`
                : 'Ledger in optimal health'}
            </p>
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Candidate Audit</span>
            <span
              className={cn(
                'font-semibold font-mono',
                stats.cancelCandidateCount > 0 ? 'text-danger' : 'text-success'
              )}
            >
              {stats.cancelCandidateCount > 0
                ? `${stats.cancelCandidateCount} for review`
                : 'Optimal'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 3. Two-Column Desktop Workspace (7:5 Split) ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Primary Active Subscriptions Ledger (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="sweep-table-card p-4 sm:p-5 space-y-4">
            {/* Ledger Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-serif font-bold text-foreground">
                    Active Subscriptions
                  </h2>
                  <span className="text-xs font-mono font-medium px-2 py-0.2 rounded-md bg-surface text-muted-foreground border border-border/60">
                    {filteredSubscriptions.length}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Click any subscription to view details, billing history, or cancel notes.
                </p>
              </div>

              {/* Fast Filter Search */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter active list…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sweep-input pl-8 pr-3 py-1 text-xs"
                  aria-label="Filter active subscriptions"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            {activeSubscriptions.length > 2 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('all')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0',
                    selectedCategoryId === 'all'
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'bg-surface/80 hover:bg-surface text-muted-foreground hover:text-foreground border border-border/70'
                  )}
                >
                  All ({activeSubscriptions.length})
                </button>

                {topCategories.map((category) => {
                  const count = activeSubscriptions.filter(
                    (s) => s.category_id === category.id
                  ).length;
                  const isSelected = selectedCategoryId === category.id;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(category.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 flex items-center gap-1.5',
                        isSelected
                          ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                          : 'bg-surface/80 hover:bg-surface text-muted-foreground hover:text-foreground border border-border/70'
                      )}
                    >
                      {category.color ? (
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: isSelected ? 'currentColor' : category.color,
                          }}
                        />
                      ) : null}
                      <span>{category.name}</span>
                      {count > 0 ? (
                        <span
                          className={cn(
                            'text-[10px] tabular-nums',
                            isSelected ? 'opacity-80' : 'text-muted-foreground'
                          )}
                        >
                          ({count})
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Subscription Rows List */}
            <div className="space-y-2.5 pt-1">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="skeleton sweep-card"
                    style={{ height: '72px', borderRadius: '12px' }}
                  />
                ))
              ) : filteredSubscriptions.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-surface/30 border border-border text-xs space-y-2">
                  <p className="text-muted-foreground">No subscriptions match your filter.</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategoryId('all');
                      setSearchQuery('');
                    }}
                    className="text-xs text-primary cursor-pointer"
                  >
                    Reset filters
                  </Button>
                </div>
              ) : (
                <>
                  {filteredSubscriptions.map((sub) => (
                    <SubscriptionCard
                      key={sub.id}
                      subscription={sub}
                      onToggleStatus={toggleStatus}
                      onDelete={deleteSubscription}
                      compact={true}
                    />
                  ))}
                </>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Showing {filteredSubscriptions.length} of {activeSubscriptions.length} commitments
              </span>
              <Link
                href="/subscriptions"
                className="text-primary font-medium hover:underline flex items-center gap-1"
              >
                <span>Open Full Management Table</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Companion Intelligence & Timeline Hub (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card 1: Chronological 30-Day Renewal Horizon */}
          <div className="sweep-table-card p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-serif font-bold text-foreground">
                  Upcoming Renewal Horizon
                </h3>
              </div>
              <span className="text-[10px] uppercase font-mono text-muted-foreground">
                Next 30 Days
              </span>
            </div>

            {upcomingChronological.length > 0 ? (
              <div className="divide-y divide-border/60">
                {upcomingChronological.map((sub) => {
                  const countdown = getCountdownBadge(sub.next_renewal_date);
                  return (
                    <Link
                      key={sub.id}
                      href={`/subscriptions/${sub.id}/edit`}
                      className="py-2.5 flex items-center justify-between gap-3 hover:bg-surface/50 px-2 rounded-lg transition-colors group block"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {sub.name}
                          </span>
                          {sub.is_trial ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-warning-subtle text-warning border border-warning/30">
                              Trial
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDate(sub.next_renewal_date)}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold font-mono text-foreground tabular-nums">
                          {formatCurrency(sub.amount, sub.currency)}
                        </div>
                        <span
                          className={cn(
                            'text-[10px] block mt-0.5',
                            countdown.urgent ? 'text-danger font-bold' : 'text-muted-foreground'
                          )}
                        >
                          {countdown.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No renewals in the next 30 days.
              </div>
            )}

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Total 30d projection</span>
              <span className="font-mono font-bold text-foreground">
                {formatCurrency(stats.upcoming30DaysTotal, targetCurrency)}
              </span>
            </div>
          </div>

          {/* Card 2: Spend Allocation by Top Categories */}
          <div className="sweep-table-card p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-serif font-bold text-foreground">
                  Spend by Category
                </h3>
              </div>
              <Link
                href="/insights"
                className="text-[10px] text-primary hover:underline font-medium"
              >
                Full Analytics
              </Link>
            </div>

            {categorySpendDistribution.length > 0 ? (
              <div className="space-y-3">
                {categorySpendDistribution.map((cat) => (
                  <div key={cat.categoryId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground truncate pr-2">
                        {cat.categoryName}
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums shrink-0">
                        <span className="text-muted-foreground">{cat.percentage}%</span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(cat.monthlyAmount, targetCurrency)}/mo
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color || 'hsl(var(--primary))',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No categorized recurring commitments recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
