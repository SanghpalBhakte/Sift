'use client';

import React from 'react';
import { Category, Subscription } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { calculateCategoryBreakdown } from '@/lib/utils/analytics';
import { formatCurrency } from '@/lib/utils/currency';
import { PieChart, Layers } from 'lucide-react';

export function CategoryBreakdown({
  subscriptions,
  categories,
  currency = 'USD',
  rates,
}: {
  subscriptions: Subscription[];
  categories: Category[];
  currency?: string;
  rates?: Record<string, number>;
}) {
  const breakdown = calculateCategoryBreakdown(subscriptions, categories, currency, rates);
  const totalSpend = breakdown.reduce((acc, b) => acc + b.totalMonthly, 0);

  if (breakdown.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[hsl(var(--primary))]" />
            <CardTitle>Category Distribution</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            No active subscriptions found to categorize.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-[hsl(var(--primary))]" />
          <CardTitle>Monthly Spend by Category</CardTitle>
        </div>
        <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
          {formatCurrency(totalSpend, currency)}/mo total
        </span>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Visual Multi-segment Bar */}
        <div className="h-3 w-full rounded-full bg-[hsl(var(--surface-muted))] overflow-hidden flex">
          {breakdown.map((item, idx) => {
            const opacityColors = [
              'bg-[hsl(var(--primary))]',
              'bg-[hsl(var(--primary)/0.75)]',
              'bg-[hsl(var(--primary)/0.55)]',
              'bg-[hsl(var(--primary)/0.40)]',
              'bg-[hsl(var(--primary)/0.25)]',
              'bg-[hsl(var(--muted-foreground)/0.3)]',
            ];
            const barColor = opacityColors[idx % opacityColors.length];

            return (
              <div
                key={item.category.id}
                style={{ width: `${Math.max(item.percentage, 2)}%` }}
                className={`${barColor} h-full transition-all`}
                title={`${item.category.name}: ${item.percentage}% (${formatCurrency(item.totalMonthly, currency)}/mo)`}
              />
            );
          })}
        </div>

        {/* Detailed Category Rows */}
        <div className="space-y-2.5 pt-1">
          {breakdown.map((item) => (
            <div
              key={item.category.id}
              className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-[hsl(var(--surface)/0.5)] transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]" />
                <span className="font-medium text-[hsl(var(--foreground))] truncate">
                  {item.category.name}
                </span>
                <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  ({item.count} service{item.count === 1 ? '' : 's'})
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-right">
                <span className="font-semibold text-[hsl(var(--foreground))] font-mono">
                  {formatCurrency(item.totalMonthly, currency)}/mo
                </span>
                <span className="text-[11px] text-[hsl(var(--muted-foreground))] w-9 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
