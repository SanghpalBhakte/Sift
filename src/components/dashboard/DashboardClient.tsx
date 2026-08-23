'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { WelcomeScreen } from '@/components/dashboard/WelcomeScreen';
import { SubscriptionCard } from '@/components/subscriptions/SubscriptionCard';
import { Button } from '@/components/ui/Button';
import { formatCurrency, normalizeMonthlyAmount } from '@/lib/utils/currency';
import { formatDate, getCountdownBadge } from '@/lib/utils/dates';
import { ArrowRight, Plus, Sparkles } from 'lucide-react';
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

  const targetCurrency = stats.displayCurrency || displayCurrency || 'USD';

  // Active subscriptions
  const activeSubscriptions = useMemo(() => {
    return subscriptions.filter((s) => s.status === 'active');
  }, [subscriptions]);

  // Largest single recurring commitment
  const largestSubscription = useMemo(() => {
    if (activeSubscriptions.length === 0) return null;
    return [...activeSubscriptions].sort((a, b) => {
      const aMonthly =
        a.monthly_amount ||
        normalizeMonthlyAmount(a.amount, a.billing_cycle, a.custom_interval_days);
      const bMonthly =
        b.monthly_amount ||
        normalizeMonthlyAmount(b.amount, b.billing_cycle, b.custom_interval_days);
      return bMonthly - aMonthly;
    })[0];
  }, [activeSubscriptions]);

  // Top categories for filter bar
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

    if (activeCats.length < 5) {
      const remaining = categories.filter((c) => !activeCats.some((ac) => ac.id === c.id));
      return [...activeCats, ...remaining].slice(0, 5);
    }

    return activeCats.slice(0, 5);
  }, [categories, activeSubscriptions]);

  // Filtered subscriptions based on category chip selection
  const filteredSubscriptions = useMemo(() => {
    if (selectedCategoryId === 'all') {
      return activeSubscriptions;
    }
    return activeSubscriptions.filter((s) => s.category_id === selectedCategoryId);
  }, [activeSubscriptions, selectedCategoryId]);

  const nextRenewal = stats.nextUpcomingRenewal;
  const nextRenewalCountdown = nextRenewal
    ? getCountdownBadge(nextRenewal.next_renewal_date)
    : null;

  // First-run zero-subscription empty state
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
    <div className="space-y-6 max-w-2xl mx-auto pb-16 animate-in fade-in duration-150">
      {/* 1. Asymmetric Hero Composition */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 sm:gap-4 items-stretch">
        {/* Primary Spend Card (Dominant: 7 Columns) */}
        <div className="sm:col-span-7 sweep-card p-5 sm:p-6 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-sans">
              Recurring Spend
            </span>

            {/* Period Toggle */}
            <div className="flex items-center gap-0.5 p-0.5 bg-surface border border-border/80 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setPeriod('monthly')}
                className={cn(
                  'px-2 py-0.5 rounded-md font-medium text-[11px] transition-all cursor-pointer',
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
                  'px-2 py-0.5 rounded-md font-medium text-[11px] transition-all cursor-pointer',
                  period === 'yearly'
                    ? 'bg-card text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Yearly
              </button>
            </div>
          </div>

          {/* LCP Target Spend Figure (Permanent frame-0 text structure) */}
          <div className="min-h-[58px] my-auto py-2">
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground tabular-nums flex items-baseline">
              <span
                className={cn(
                  isLoading && subscriptions.length === 0 && 'opacity-40 animate-pulse font-mono'
                )}
              >
                {formatCurrency(
                  period === 'monthly' ? stats.monthlyTotal : stats.yearlyProjected,
                  targetCurrency
                )}
              </span>
              <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1.5 font-sans">
                /{period === 'monthly' ? 'mo' : 'yr'}
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground mt-1 min-h-[16px]">
              {isLoading && subscriptions.length === 0 ? (
                <span className="opacity-50">Calculating recurring commitments...</span>
              ) : (
                <>
                  {activeSubscriptions.length}{' '}
                  {activeSubscriptions.length === 1 ? 'active commitment' : 'active commitments'}
                  {period === 'monthly' && stats.yearlyProjected > 0
                    ? ` · ${formatCurrency(stats.yearlyProjected, targetCurrency)}/yr run rate`
                    : ''}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Secondary Companion Card: Next Renewal (5 Columns) */}
        <div className="sm:col-span-5 sweep-card p-5 flex flex-col justify-between min-h-[160px] bg-card/60">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-sans">
              Next Renewal
            </span>
            {nextRenewalCountdown && (
              <span
                className={cn(
                  'text-[10px] font-medium px-2 py-0.5 rounded-full border',
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
            <div className="my-auto py-1">
              <div className="flex items-center gap-2.5 mb-1">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                  style={{
                    backgroundColor: nextRenewal.category?.color
                      ? `${nextRenewal.category.color}20`
                      : 'hsl(var(--surface-muted))',
                    color: nextRenewal.category?.color || 'hsl(var(--primary))',
                  }}
                >
                  {nextRenewal.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-foreground truncate block">
                  {nextRenewal.name}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2 mt-2">
                <span className="text-xs text-muted-foreground">
                  {formatDate(nextRenewal.next_renewal_date)}
                </span>
                <span className="text-sm font-bold text-foreground tabular-nums">
                  {formatCurrency(nextRenewal.amount, nextRenewal.currency)}
                </span>
              </div>
            </div>
          ) : (
            <div className="my-auto py-2">
              <p className="text-xs text-foreground font-medium">All caught up</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                No recurring charges due in the next 30 days
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{nextRenewal?.is_trial ? 'Free Trial' : 'Auto-renews'}</span>
            <Link
              href="/subscriptions"
              className="hover:text-primary transition-colors flex items-center gap-0.5 text-foreground/80 hover:underline"
            >
              <span>Ledger</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Restrained Supporting Ledger Notes (2 quiet, compact items) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Note 1: Top single commitment */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-surface/50 border border-border/70 flex items-center justify-between gap-3 text-xs">
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block font-sans">
              Top Commitment
            </span>
            <span className="font-medium text-foreground truncate block mt-0.5">
              {largestSubscription ? largestSubscription.name : 'None recorded'}
            </span>
          </div>
          <div className="text-right shrink-0">
            {largestSubscription ? (
              <span className="font-mono font-semibold text-foreground tabular-nums">
                {formatCurrency(largestSubscription.amount, largestSubscription.currency)}
                <span className="text-[10px] text-muted-foreground font-normal ml-0.5 font-sans">
                  /{largestSubscription.billing_cycle === 'yearly' ? 'yr' : 'mo'}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </div>

        {/* Note 2: 7-day upcoming window or Active trials */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-surface/50 border border-border/70 flex items-center justify-between gap-3 text-xs">
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block font-sans">
              {stats.trialCount > 0 ? 'Active Free Trials' : 'Due Next 7 Days'}
            </span>
            <span className="font-medium text-foreground truncate block mt-0.5">
              {stats.trialCount > 0
                ? `${stats.trialCount} trial${stats.trialCount > 1 ? 's' : ''} in progress`
                : stats.upcomingRenewalsCount > 0
                ? `${stats.upcomingRenewalsCount} renewal${
                    stats.upcomingRenewalsCount > 1 ? 's' : ''
                  } scheduled`
                : 'No charges scheduled'}
            </span>
          </div>
          <div className="text-right shrink-0">
            {stats.upcoming30DaysTotal > 0 ? (
              <span className="text-[11px] text-muted-foreground">
                30d est:{' '}
                <strong className="text-foreground font-mono font-semibold">
                  {formatCurrency(stats.upcoming30DaysTotal, targetCurrency)}
                </strong>
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">Peace of mind</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Core Content: Recurring Spend Ledger Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-serif font-bold text-foreground">Active Ledger</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-surface text-muted-foreground border border-border/60 font-mono">
              {activeSubscriptions.length}
            </span>
          </div>
          <Link
            href="/subscriptions"
            className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <span>Full ledger</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Category Filter Pills (Single scrollable row) */}
        {activeSubscriptions.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 whitespace-nowrap flex-nowrap">
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

        {/* Subscription Rows */}
        <div className="space-y-2">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton sweep-card"
                style={{
                  height: '70px',
                  borderRadius: '12px',
                }}
              />
            ))
          ) : filteredSubscriptions.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-surface/30 border border-border text-xs space-y-2">
              <p className="text-muted-foreground">No subscriptions in this category.</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategoryId('all')}
                className="text-xs text-primary cursor-pointer"
              >
                Clear filter
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

              {/* Graceful single-item prompt */}
              {activeSubscriptions.length === 1 && (
                <div className="p-4 rounded-xl border border-dashed border-border/80 bg-surface/20 flex items-center justify-between gap-3 text-xs mt-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Your recurring commitments will appear here as you add them.</span>
                  </div>
                  <Link href="/subscriptions/new">
                    <Button variant="outline" size="sm" className="text-xs shrink-0 gap-1">
                      <Plus className="w-3 h-3" />
                      <span>Add another</span>
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
