'use client';

import React from 'react';
import Link from 'next/link';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { MetricCard } from '@/components/ui/MetricCard';
import { SpendTrendChart } from '@/components/insights/SpendTrendChart';
import { CategoryBreakdown } from '@/components/insights/CategoryBreakdown';
import { TopSubscriptions } from '@/components/insights/TopSubscriptions';
import { UpcomingCashflowPressure } from '@/components/insights/UpcomingCashflowPressure';
import { ValueRatingAnalysis } from '@/components/insights/ValueRatingAnalysis';
import { formatCurrency } from '@/lib/utils/currency';
import {
  calculateSpendTrend,
  calculateTopSubscriptions,
  calculateUpcoming30DayCharges,
} from '@/lib/utils/analytics';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Lightbulb,
  Plus,
  Sparkles,
  Inbox,
} from 'lucide-react';

export default function InsightsPage() {
  const {
    subscriptions,
    categories,
    stats,
    profile,
    exchangeRates,
    displayCurrency,
    isLoading,
    populateStarterTemplates,
  } = useSubscriptions();

  const currency = displayCurrency || 'USD';

  const trendData = calculateSpendTrend(subscriptions, 6, currency, exchangeRates.rates);
  const topSubscriptions = calculateTopSubscriptions(subscriptions, 5, currency, exchangeRates.rates);
  const upcoming30Days = calculateUpcoming30DayCharges(
    subscriptions,
    30,
    currency,
    exchangeRates.rates
  );

  if (isLoading) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="inline-block w-6 h-6 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Analyzing your recurring finances...
        </p>
      </div>
    );
  }

  // Clean empty state when user has 0 subscriptions
  if (subscriptions.length === 0) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-6">
        <div className="text-center space-y-2 pb-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Spend Insights & Analytics
          </h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
            Once you track subscriptions, Sift computes recurring projections, category breakdowns,
            and identifies optimization opportunities.
          </p>
        </div>

        <div className="sift-card p-6 sm:p-8 text-center space-y-5 border-dashed">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[hsl(var(--surface))] flex items-center justify-center text-[hsl(var(--primary))]">
            <Inbox className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">
              No subscription data yet
            </h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-sm mx-auto">
              Add your first recurring service to generate cashflow trajectories and category distributions.
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
      {/* Header */}
      <div className="pb-2 border-b border-[hsl(var(--border))]">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          Recurring Spend Insights
        </h1>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
          Clear visibility on recurring burn, cost drivers, and optimization candidates
        </p>
      </div>

      {/* 1. Top-Level Stat Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Monthly Recurring"
          value={formatCurrency(stats.monthlyTotal, currency)}
          subtitle="Normalized run-rate"
          trend={{
            text: `${stats.activeCount} active items`,
            type: 'accent',
          }}
        />

        <MetricCard
          label="Annual Commitment"
          value={formatCurrency(stats.yearlyProjected, currency)}
          subtitle="12-month projection"
          trend={{
            text: 'Current baseline',
            type: 'neutral',
          }}
        />

        <MetricCard
          label="Average Tool Cost"
          value={formatCurrency(stats.averageMonthlySpend, currency)}
          subtitle="Per active subscription/mo"
          trend={{
            text: 'Across active tools',
            type: 'neutral',
          }}
        />

        <MetricCard
          label="Next 30 Days Due"
          value={formatCurrency(stats.upcoming30DaysTotal, currency)}
          subtitle={`${upcoming30Days.length} upcoming charges`}
          trend={{
            text: 'Near-term cashflow',
            type: upcoming30Days.some((u) => u.isUrgent) ? 'warning' : 'neutral',
          }}
        />
      </div>

      {/* 2. Calm Spend Trend Chart */}
      <section>
        <SpendTrendChart data={trendData} currency={currency} />
      </section>

      {/* 3. Category Breakdown & Top Cost Drivers (Two-Column Desktop, Stacked Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section>
          <CategoryBreakdown subscriptions={subscriptions} categories={categories} />
        </section>

        <section>
          <TopSubscriptions items={topSubscriptions} currency={currency} />
        </section>
      </div>

      {/* 4. Upcoming Payment Pressure & Utility Alignment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section>
          <UpcomingCashflowPressure
            items={upcoming30Days}
            total30Days={stats.upcoming30DaysTotal}
            currency={currency}
          />
        </section>

        <section>
          <ValueRatingAnalysis subscriptions={subscriptions} />
        </section>
      </div>

      {/* 5. Sift Financial Hygiene Recommendations */}
      <section>
        <Card className="border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.04)]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[hsl(var(--primary))]" />
              <CardTitle>Recurring Spend Hygiene</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))] mt-1.5 shrink-0" />
              <p>
                <strong className="text-[hsl(var(--foreground))]">Cost concentration:</strong> Your top{' '}
                {Math.min(topSubscriptions.length, 3)} subscriptions account for{' '}
                <strong className="text-[hsl(var(--foreground))]">
                  {topSubscriptions.slice(0, 3).reduce((acc, s) => acc + s.percentageOfTotal, 0)}%
                </strong>{' '}
                of your total recurring budget.
              </p>
            </div>

            {stats.cancelCandidateCount > 0 ? (
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--danger))] mt-1.5 shrink-0" />
                <p>
                  <strong className="text-[hsl(var(--danger))]">Cancel candidate pruning:</strong> You have{' '}
                  {stats.cancelCandidateCount} item{stats.cancelCandidateCount === 1 ? '' : 's'} marked for review.
                  Pruning them will save{' '}
                  <strong className="text-[hsl(var(--foreground))]">
                    {formatCurrency(stats.potentialMonthlySavings, currency)}/mo
                  </strong>{' '}
                  ({formatCurrency(stats.potentialMonthlySavings * 12, currency)}/year).
                </p>
              </div>
            ) : null}

            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))] mt-1.5 shrink-0" />
              <p>
                <strong className="text-[hsl(var(--foreground))]">Annual billing discount:</strong> Tools you mark as{' '}
                <em>Essential</em> frequently offer 15–25% savings if paid annually instead of monthly.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
