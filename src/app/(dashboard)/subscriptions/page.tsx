'use client';

import React from 'react';
import Link from 'next/link';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { SubscriptionList } from '@/components/subscriptions/SubscriptionList';
import { Button } from '@/components/ui/Button';
import { Plus, UploadCloud } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';

export default function SubscriptionsPage() {
  const { subscriptions, stats, profile, toggleStatus, deleteSubscription } = useSubscriptions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[hsl(var(--border))]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Subscriptions & Services
          </h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            {subscriptions.length} total tracked · Total run-rate{' '}
            <span className="font-semibold text-[hsl(var(--foreground))]">
              {formatCurrency(stats.monthlyTotal, profile?.currency_preference || 'USD')}/mo
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/subscriptions/import">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <UploadCloud className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              Import Statement
            </Button>
          </Link>

          <Link href="/subscriptions/new">
            <Button variant="primary" size="sm" className="gap-1.5 shadow-xs">
              <Plus className="w-3.5 h-3.5" />
              Add Subscription
            </Button>
          </Link>
        </div>
      </div>

      {/* Subscription List with full interactive filters */}
      <SubscriptionList
        subscriptions={subscriptions}
        onToggleStatus={toggleStatus}
        onDelete={deleteSubscription}
      />
    </div>
  );
}
