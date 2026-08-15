'use client';

import React from 'react';
import Link from 'next/link';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { useAuth } from '@/context/AuthContext';
import { MetricCard } from '@/components/ui/MetricCard';
import { AlertsBanner } from '@/components/reminders/AlertsBanner';
import { UpcomingRenewals } from '@/components/subscriptions/UpcomingRenewals';
import { TrialAlerts } from '@/components/subscriptions/TrialAlerts';
import { CancelCandidates } from '@/components/subscriptions/CancelCandidates';
import { CategoryBreakdown } from '@/components/insights/CategoryBreakdown';
import { SubscriptionCard } from '@/components/subscriptions/SubscriptionCard';
import { formatCurrency } from '@/lib/utils/currency';
import { getCountdownBadge, formatDate } from '@/lib/utils/dates';
import {
  Plus,
  CreditCard,
  Sparkles,
  ArrowRight,
  Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    subscriptions,
    categories,
    stats,
    profile,
    exchangeRates,
    displayCurrency,
    isLoading,
    toggleStatus,
    deleteSubscription,
    populateStarterTemplates,
  } = useSubscriptions();

  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');
  const recentSubscriptions = [...subscriptions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const nextRenewal = stats.nextUpcomingRenewal;
  const nextRenewalCountdown = nextRenewal
    ? getCountdownBadge(nextRenewal.next_renewal_date)
    : null;

  const targetCurrency = stats.displayCurrency || displayCurrency || 'USD';

  if (isLoading) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="inline-block w-6 h-6 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Loading your subscriptions ledger...
        </p>
      </div>
    );
  }

  // Real Empty State when user has 0 subscriptions
  if (subscriptions.length === 0) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-6">
        <div className="text-center space-y-2 pb-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Welcome to your Ledger{user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
            Sift is your calm, private workspace to track recurring subscriptions, eliminate unused
            tools, and protect yourself from surprise trial conversions.
          </p>
        </div>

        <div className="sift-card p-6 sm:p-8 text-center space-y-5 border-dashed">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[hsl(var(--surface))] flex items-center justify-center text-[hsl(var(--primary))]">
            <Inbox className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">
              No subscriptions tracked yet
            </h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-sm mx-auto">
              Start by adding a recurring tool, streaming service, or an active free trial you want to
              keep an eye on.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/subscriptions/new" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full sm:w-auto gap-1.5 shadow-xs">
                <Plus className="w-4 h-4" />
                Add First Subscription
              </Button>
            </Link>

            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => populateStarterTemplates()}
              className="w-full sm:w-auto gap-1.5 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              Load Sample Templates
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Greeting & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[hsl(var(--border))]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Recurring Spend Overview
          </h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            {stats.activeCount} active recurring services
            {stats.pausedCount > 0 ? ` · ${stats.pausedCount} paused` : ''} ·{' '}
            {stats.upcomingRenewalsCount} renewing within 7 days
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/subscriptions/new">
            <Button variant="primary" size="sm" className="gap-1.5 shadow-xs">
              <Plus className="w-3.5 h-3.5" />
              Add Subscription
            </Button>
          </Link>
        </div>
      </div>

      {/* 0. In-App Urgent Alerts Banner */}
      <AlertsBanner />

      {/* 1. Top Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Subscriptions */}
        <MetricCard
          label="Active Subscriptions"
          value={stats.activeCount}
          subtitle={
            stats.pausedCount > 0
              ? `${stats.pausedCount} paused`
              : `${subscriptions.length} total tracked`
          }
          trend={{
            text: 'Tracked in ledger',
            type: 'neutral',
          }}
        />

        {/* Monthly Recurring Total */}
        <MetricCard
          label="Monthly Recurring"
          value={formatCurrency(stats.monthlyTotal, targetCurrency)}
          subtitle={`Converted to ${targetCurrency}`}
          trend={{
            text: `Across ${stats.activeCount} active items`,
            type: 'accent',
          }}
        />

        {/* Yearly Recurring Total */}
        <MetricCard
          label="Yearly Projected"
          value={formatCurrency(stats.yearlyProjected, targetCurrency)}
          subtitle={`~${formatCurrency(stats.monthlyTotal, targetCurrency)}/month`}
          trend={{
            text: 'Annual commitment',
            type: 'neutral',
          }}
        />

        {/* Next Upcoming Renewal */}
        <MetricCard
          label="Next Renewal"
          value={
            nextRenewal
              ? formatCurrency(nextRenewal.amount, nextRenewal.currency)
              : 'None'
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
                  type: nextRenewalCountdown.urgent
                    ? 'warning'
                    : nextRenewalCountdown.warning
                    ? 'warning'
                    : 'accent',
                }
              : undefined
          }
        />
      </div>

      {/* 2. Free Trial Alerts (Critical for Peace of Mind) */}
      {stats.trialCount > 0 ? (
        <section>
          <TrialAlerts subscriptions={subscriptions} />
        </section>
      ) : null}

      {/* 3. Upcoming Renewals & Cancel Candidates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section>
          <UpcomingRenewals subscriptions={subscriptions} />
        </section>

        <section>
          <CancelCandidates subscriptions={subscriptions} />
        </section>
      </div>

      {/* 4. Category Spend Distribution */}
      <section>
        <CategoryBreakdown
          subscriptions={subscriptions}
          categories={categories}
          currency={targetCurrency}
          rates={exchangeRates.rates}
        />
      </section>

      {/* 5. Active Subscriptions List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[hsl(var(--primary))]" />
            <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
              Active Subscriptions ({activeSubscriptions.length})
            </h2>
          </div>
          <Link
            href="/subscriptions"
            className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] flex items-center gap-1 transition-colors"
          >
            Manage all ({subscriptions.length}) <ArrowRight className="w-3 h-3" />
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
