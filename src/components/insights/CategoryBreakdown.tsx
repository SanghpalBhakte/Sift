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
}: {
  subscriptions: Subscription[];
  categories: Category[];
}) {
  const breakdown = calculateCategoryBreakdown(subscriptions, categories);
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
          {formatCurrency(totalSpend, 'USD')}/mo total
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
            const colorClass = opacityColors[idx % opacityColors.length];

            return (
              <div
                key={item.category.id}
                style={{ width: `${Math.max(item.percentage, 2)}%` }}
                className={`${colorClass} h-full border-r border-[hsl(var(--card))] last:border-0`}
                title={`${item.category.name}: ${item.percentage}% (${formatCurrency(item.totalMonthly, 'USD')})`}
              />
            );
          })}
        </div>

        {/* Detailed Breakdown List */}
        <div className="divide-y divide-[hsl(var(--border))]">
          {breakdown.map((item) => (
            <div
              key={item.category.id}
              className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]" />
                <div>
                  <span className="font-medium text-[hsl(var(--foreground))]">
                    {item.category.name}
                  </span>
                  <span className="text-[11px] text-[hsl(var(--muted-foreground))] ml-2">
                    {item.count} {item.count === 1 ? 'service' : 'services'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono">
                  {item.percentage}%
                </span>
                <span className="font-semibold text-[hsl(var(--foreground))] min-w-[70px] text-right">
                  {formatCurrency(item.totalMonthly, 'USD')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
