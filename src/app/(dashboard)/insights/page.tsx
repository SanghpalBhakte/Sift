'use client';

import React from 'react';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { SpendProjection } from '@/components/insights/SpendProjection';
import { CategoryBreakdown } from '@/components/insights/CategoryBreakdown';
import { ValueRatingAnalysis } from '@/components/insights/ValueRatingAnalysis';
import { formatCurrency } from '@/lib/utils/currency';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PieChart, Lightbulb, Wallet, Calendar, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function InsightsPage() {
  const { subscriptions, categories, stats, profile } = useSubscriptions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-[hsl(var(--border))]">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          Spend Insights & Optimization
        </h1>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
          Clarity on recurring cashflow, service utility, and potential waste
        </p>
      </div>

      {/* 1. Annual Spend Projections */}
      <section>
        <SpendProjection
          monthlyTotal={stats.monthlyTotal}
          potentialMonthlySavings={stats.potentialMonthlySavings}
        />
      </section>

      {/* 2. Value Rating & Decision Analysis */}
      <section>
        <ValueRatingAnalysis subscriptions={subscriptions} />
      </section>

      {/* 3. Category Breakdown */}
      <section>
        <CategoryBreakdown subscriptions={subscriptions} categories={categories} />
      </section>

      {/* 4. Actionable Recommendations */}
      <section>
        <Card className="border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.04)]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[hsl(var(--primary))]" />
              <CardTitle>Sift Financial Hygiene Tips</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))] mt-1.5 shrink-0" />
              <p>
                <strong className="text-[hsl(var(--foreground))]">Annual billing discount:</strong>{' '}
                Services you mark as <em>Essential</em> (like email, password managers, core editors) often offer 15–20% discounts when paid annually.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))] mt-1.5 shrink-0" />
              <p>
                <strong className="text-[hsl(var(--foreground))]">Zero-conversion rule:</strong>{' '}
                Always add direct cancellation links to <em>Free Trials</em> so you can cancel in one click if the tool doesn't earn a daily spot in your workflow.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))] mt-1.5 shrink-0" />
              <p>
                <strong className="text-[hsl(var(--foreground))]">Quarterly prune:</strong> Review{' '}
                <Link href="/subscriptions" className="text-[hsl(var(--primary))] hover:underline">
                  Cancel Candidates
                </Link>{' '}
                every 90 days. Pruning {stats.cancelCandidateCount} candidate{stats.cancelCandidateCount === 1 ? '' : 's'} today recovers{' '}
                <strong className="text-[hsl(var(--foreground))]">
                  {formatCurrency(stats.potentialMonthlySavings * 12, profile?.currency_preference || 'USD')}/year
                </strong>.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
