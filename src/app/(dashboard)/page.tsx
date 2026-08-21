'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { useAuth } from '@/context/AuthContext';
import { MetricCard } from '@/components/ui/MetricCard';
import { AlertsBanner } from '@/components/reminders/AlertsBanner';
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';
import { WelcomeScreen } from '@/components/dashboard/WelcomeScreen';
import { RestoreModal } from '@/components/backup/RestoreModal';
import { SubscriptionActionCenter } from '@/components/dashboard/SubscriptionActionCenter';
import { UpcomingRenewals } from '@/components/subscriptions/UpcomingRenewals';
import { CategoryBreakdown } from '@/components/insights/CategoryBreakdown';
import { SubscriptionCard } from '@/components/subscriptions/SubscriptionCard';
import { MetricCardSkeleton, SubscriptionCardSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils/currency';
import { getCountdownBadge, formatDate } from '@/lib/utils/dates';
import {
  Plus,
  CreditCard,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnimatedCurrency } from '@/components/ui/AnimatedCurrency';
import { CurrencySwitcher } from '@/components/ui/CurrencySwitcher';

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    subscriptions,
    categories,
    stats,
    exchangeRates,
    displayCurrency,
    isLoading,
    toggleStatus,
    deleteSubscription,
    populateStarterTemplates,
  } = useSubscriptions();

  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');
  const recentSubscriptions = [...subscriptions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const nextRenewal = stats.nextUpcomingRenewal;
  const nextRenewalCountdown = nextRenewal
    ? getCountdownBadge(nextRenewal.next_renewal_date)
    : null;

  const targetCurrency = stats.displayCurrency || displayCurrency || 'USD';

  // Skeleton loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="pb-2 border-b border-border space-y-2">
          <div className="h-6 w-48 bg-surface-muted rounded-md animate-pulse" />
          <div className="h-3 w-72 bg-surface-muted rounded-md animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
        <div className="space-y-3 pt-2">
          <SubscriptionCardSkeleton />
          <SubscriptionCardSkeleton />
        </div>
      </div>
    );
  }

  // First-run minimal welcome screen
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Recurring Spend Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stats.activeCount} active recurring services
            {stats.pausedCount > 0 ? ` · ${stats.pausedCount} paused` : ''} ·{' '}
            {stats.upcomingRenewalsCount} renewing within 7 days
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block">
            <CurrencySwitcher />
          </div>
          <Link href="/subscriptions/new">
            <Button variant="primary" size="sm" className="gap-1.5 shadow-xs">
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Add Subscription
            </Button>
          </Link>
        </div>
      </div>

      {/* Onboarding Checklist (dismissible) */}
      <OnboardingChecklist />

      {/* Alerts Banner (Quiet system notifications) */}
      <AlertsBanner />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Active Subscriptions"
          value={stats.activeCount}
          subtitle={
            stats.pausedCount > 0
              ? `${stats.pausedCount} paused`
              : `${subscriptions.length} total tracked`
          }
          trend={{ text: 'Tracked in ledger', type: 'neutral' }}
        />

        <MetricCard
          label="Monthly Recurring"
          value={<AnimatedCurrency value={stats.monthlyTotal} currency={targetCurrency} />}
          subtitle={`Converted to ${targetCurrency}`}
          trend={{ text: `Across ${stats.activeCount} active items`, type: 'accent' }}
        />

        <MetricCard
          label="Yearly Projected"
          value={<AnimatedCurrency value={stats.yearlyProjected} currency={targetCurrency} />}
          subtitle={`~${formatCurrency(stats.monthlyTotal, targetCurrency)}/month`}
          trend={{ text: 'Annual commitment', type: 'neutral' }}
        />

        <MetricCard
          label="Next Renewal"
          value={
            nextRenewal ? (
              <AnimatedCurrency value={nextRenewal.amount} currency={nextRenewal.currency} />
            ) : (
              'None'
            )
          }
          subtitle={
            nextRenewal ? (
              <span className="truncate block" title={nextRenewal.name}>
                {nextRenewal.name} ({formatDate(nextRenewal.next_renewal_date)})
              </span>
            ) : (
              'No active renewals'
            )
          }
          trend={
            nextRenewalCountdown
              ? {
                  text: nextRenewalCountdown.label,
                  type:
                    nextRenewalCountdown.urgent || nextRenewalCountdown.warning
                      ? 'warning'
                      : 'accent',
                }
              : undefined
          }
        />
      </div>

      {/* Subscription Health & Financial Action Center */}
      <section>
        <SubscriptionActionCenter />
      </section>

      {/* Upcoming Renewals & Spend Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section>
          <UpcomingRenewals subscriptions={subscriptions} />
        </section>
        <section>
          <CategoryBreakdown
            subscriptions={subscriptions}
            categories={categories}
            currency={targetCurrency}
            rates={exchangeRates.rates}
          />
        </section>
      </div>

      {/* Active Subscriptions List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-foreground">
              Active Subscriptions ({activeSubscriptions.length})
            </h2>
          </div>
          <Link
            href="/subscriptions"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
          >
            Manage all ({subscriptions.length}) <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </Link>
        </div>

        <div className="space-y-3">
          {recentSubscriptions.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              onToggleStatus={toggleStatus}
              onDelete={deleteSubscription}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
