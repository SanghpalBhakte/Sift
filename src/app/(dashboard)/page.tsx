'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import { WelcomeScreen } from '@/components/dashboard/WelcomeScreen';
import { SubscriptionCard } from '@/components/subscriptions/SubscriptionCard';
import { MetricCardSkeleton, SubscriptionCardSkeleton } from '@/components/ui/Skeleton';

const RestoreModal = dynamic(
  () => import('@/components/backup/RestoreModal').then((m) => m.RestoreModal),
  { ssr: false }
);
import { formatCurrency } from '@/lib/utils/currency';
import { Plus, Sparkles, ArrowRight, CreditCard, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnimatedCurrency } from '@/components/ui/AnimatedCurrency';
import { CurrencySwitcher } from '@/components/ui/CurrencySwitcher';
import { cn } from '@/lib/utils/cn';

export default function DashboardPage() {
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

  // Top 5 categories for horizontal chip bar
  const topCategories = useMemo(() => {
    // Count subscriptions per category
    const countMap: Record<string, number> = {};
    for (const sub of activeSubscriptions) {
      if (sub.category_id) {
        countMap[sub.category_id] = (countMap[sub.category_id] || 0) + 1;
      }
    }

    // Sort categories having active items first, then take at most 5
    const activeCats = categories
      .filter((c) => (countMap[c.id] || 0) > 0)
      .sort((a, b) => (countMap[b.id] || 0) - (countMap[a.id] || 0));

    // If fewer than 5 active, backfill with remaining categories up to 5
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

  // Next renewal info
  const nextRenewal = stats.nextUpcomingRenewal;

  // Skeleton loading state
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-xl mx-auto py-2">
        <div className="p-6 rounded-2xl bg-card border border-border space-y-3 animate-pulse">
          <div className="h-4 w-28 bg-surface-muted rounded-md" />
          <div className="h-10 w-48 bg-surface-muted rounded-md" />
          <div className="h-3 w-64 bg-surface-muted rounded-md" />
        </div>
        <div className="space-y-2.5 pt-2">
          <SubscriptionCardSkeleton />
          <SubscriptionCardSkeleton />
          <SubscriptionCardSkeleton />
        </div>
      </div>
    );
  }

  // First-run zero-subscription empty state
  if (subscriptions.length === 0) {
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
    <div className="space-y-5 max-w-xl mx-auto pb-12">
      {/* 1. Primary Hero Spend Card with Period Toggle */}
      <div className="sift-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Spend
          </span>

          {/* Period Toggle (Monthly vs Yearly) */}
          <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setPeriod('monthly')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer',
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
                'px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer',
                period === 'yearly'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Hero Figure */}
        <div>
          <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground tabular-nums">
            <AnimatedCurrency
              value={period === 'monthly' ? stats.monthlyTotal : stats.yearlyProjected}
              currency={targetCurrency}
            />
            <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1.5">
              /{period === 'monthly' ? 'month' : 'year'}
            </span>
          </div>

          <p className="text-xs text-muted-foreground mt-1.5">
            {activeSubscriptions.length}{' '}
            {activeSubscriptions.length === 1 ? 'active subscription' : 'active subscriptions'}
            {nextRenewal ? ` · Next renews ${nextRenewal.name}` : ''}
          </p>
        </div>
      </div>

      {/* 2. Single-Row Category Filter Chips (Strictly max 5 visible, horizontal scroll) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <span className="text-xs font-semibold text-foreground">Subscriptions</span>
          <Link
            href="/subscriptions"
            className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <span>View ledger ({subscriptions.length})</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 whitespace-nowrap flex-nowrap">
          {/* All Chip */}
          <button
            type="button"
            onClick={() => setSelectedCategoryId('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0',
              selectedCategoryId === 'all'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'bg-surface/80 hover:bg-surface text-muted-foreground hover:text-foreground border border-border/70'
            )}
          >
            All ({activeSubscriptions.length})
          </button>

          {/* Top Categories (up to 5) */}
          {topCategories.map((category) => {
            const count = activeSubscriptions.filter((s) => s.category_id === category.id).length;
            const isSelected = selectedCategoryId === category.id;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategoryId(category.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 flex items-center gap-1.5',
                  isSelected
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'bg-surface/80 hover:bg-surface text-muted-foreground hover:text-foreground border border-border/70'
                )}
              >
                {category.color ? (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
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
      </div>

      {/* 3. Core Content: Streamlined Subscription Cards */}
      <div className="space-y-2.5">
        {filteredSubscriptions.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-surface/30 border border-border text-xs space-y-2">
            <p className="text-muted-foreground">No subscriptions in this category.</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategoryId('all')}
              className="text-xs text-primary"
            >
              Clear filter
            </Button>
          </div>
        ) : (
          filteredSubscriptions.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              onToggleStatus={toggleStatus}
              onDelete={deleteSubscription}
              compact={true}
            />
          ))
        )}
      </div>
    </div>
  );
}
