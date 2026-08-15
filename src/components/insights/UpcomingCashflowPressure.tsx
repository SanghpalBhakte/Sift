'use client';

import React from 'react';
import Link from 'next/link';
import { UpcomingPaymentItem } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/dates';
import { Badge } from '../ui/Badge';
import { Calendar } from 'lucide-react';

interface UpcomingCashflowPressureProps {
  items: UpcomingPaymentItem[];
  total30Days: number;
  currency?: string;
}

export function UpcomingCashflowPressure({
  items,
  total30Days,
  currency = 'USD',
}: UpcomingCashflowPressureProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[hsl(var(--primary))]" />
            <CardTitle>Next 30-Day Payment Pressure</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            No payments scheduled in the next 30 days.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[hsl(var(--primary))]" />
          <div>
            <CardTitle>Next 30-Day Cashflow Demand</CardTitle>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
              Scheduled recurring debits converted to {currency}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-bold text-[hsl(var(--foreground))] font-mono">
            {formatCurrency(total30Days, currency)}
          </div>
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
            {items.length} charge{items.length === 1 ? '' : 's'} upcoming
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pt-1">
        <div className="divide-y divide-[hsl(var(--border))]">
          {items.map(
            ({ subscription, renewalDate, amount, convertedAmount, daysUntil, isUrgent }) => {
              const isDifferentCurrency =
                subscription.currency.toUpperCase() !== currency.toUpperCase();

              return (
                <div
                  key={subscription.id}
                  className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/subscriptions/${subscription.id}/edit`}
                        className="text-sm font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors truncate"
                      >
                        {subscription.name}
                      </Link>

                      <Badge
                        variant={isUrgent ? 'danger' : daysUntil <= 7 ? 'warning' : 'outline'}
                        size="sm"
                      >
                        {daysUntil === 0
                          ? 'Today'
                          : daysUntil === 1
                          ? 'Tomorrow'
                          : `In ${daysUntil} days`}
                      </Badge>
                    </div>

                    <div className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                      {formatDate(renewalDate)} · {subscription.payment_method?.name || 'Default Card'}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-[hsl(var(--foreground))] font-mono">
                      {formatCurrency(amount, subscription.currency)}
                    </div>
                    {isDifferentCurrency ? (
                      <div className="text-[10px] text-[hsl(var(--primary))] font-mono">
                        ≈ {formatCurrency(convertedAmount, currency)}
                      </div>
                    ) : (
                      <div className="text-[10px] text-[hsl(var(--muted-foreground))] capitalize">
                        {subscription.billing_cycle}
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </CardContent>
    </Card>
  );
}
