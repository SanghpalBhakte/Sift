'use client';

import React from 'react';
import Link from 'next/link';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { MetricCard } from '@/components/ui/MetricCard';
import { UpcomingRenewals } from '@/components/subscriptions/UpcomingRenewals';
import { TrialAlerts } from '@/components/subscriptions/TrialAlerts';
import { CancelCandidates } from '@/components/subscriptions/CancelCandidates';
import { CategoryBreakdown } from '@/components/insights/CategoryBreakdown';
import { SubscriptionCard } from '@/components/subscriptions/SubscriptionCard';
import { formatCurrency } from '@/lib/utils/currency';
import { Plus, CreditCard, Sparkles, AlertCircle, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const { subscriptions, categories, stats, profile, toggleStatus, deleteSubscription } =
    useSubscriptions();

  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');
  const recentSubscriptions = [...subscriptions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top Greeting & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[hsl(var(--border))]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Monthly Spend Overview
          </h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            {stats.activeCount} active recurring services · {stats.upcomingRenewalsCount} renewing this week
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

      {/* 1. Overview Stats (Calm Financial Blocks) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Monthly Spend"
          value={formatCurrency(stats.monthlyTotal, profile?.currency_preference || 'USD')}
          subtitle={`~${formatCurrency(stats.yearlyProjected, profile?.currency_preference || 'USD')}/year`}
          trend={{
            text: `${stats.activeCount} active items`,
            type: 'accent',
          }}
        />

        <MetricCard
          label="Cancel Candidates"
          value={stats.cancelCandidateCount}
          subtitle={`Save ${formatCurrency(stats.potentialMonthlySavings, profile?.currency_preference || 'USD')}/mo`}
          trend={
            stats.cancelCandidateCount > 0
              ? { text: 'Recoverable cashflow', type: 'warning' }
              : { text: 'All spend essential', type: 'positive' }
          }
        />

        <MetricCard
          label="Upcoming (7d)"
          value={stats.upcomingRenewalsCount}
          subtitle="Renewals next 7 days"
          trend={{
            text: 'Scanned & tracked',
            type: 'neutral',
          }}
        />

        <MetricCard
          label="Free Trials"
          value={stats.trialCount}
          subtitle={stats.trialCount > 0 ? 'Expiring soon' : 'No active trials'}
          trend={
            stats.trialCount > 0
              ? { text: 'Action needed', type: 'warning' }
              : { text: 'Zero risk', type: 'positive' }
          }
        />
      </div>

      {/* 2. Free Trial Alerts (Critical for Peace of Mind) */}
      {stats.trialCount > 0 ? (
        <section>
          <TrialAlerts subscriptions={subscriptions} />
        </section>
      ) : null}

      {/* 3. Upcoming Renewals & Cancel Candidates (Two-Column on Desktop, Stacked on Mobile) */}
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
        <CategoryBreakdown subscriptions={subscriptions} categories={categories} />
      </section>

      {/* 5. Recent / Active Subscriptions */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[hsl(var(--primary))]" />
            <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
              Active Subscriptions
            </h2>
          </div>
          <Link
            href="/subscriptions"
            className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] flex items-center gap-1 transition-colors"
          >
            View all ({subscriptions.length}) <ArrowRight className="w-3 h-3" />
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
