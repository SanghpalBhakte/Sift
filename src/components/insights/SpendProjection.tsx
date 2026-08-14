'use client';

import React from 'react';
import { Subscription } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency } from '@/lib/utils/currency';
import { Calendar, TrendingDown, DollarSign } from 'lucide-react';

export function SpendProjection({
  monthlyTotal,
  potentialMonthlySavings,
}: {
  monthlyTotal: number;
  potentialMonthlySavings: number;
}) {
  const yearlyCurrent = monthlyTotal * 12;
  const yearlyOptimized = (monthlyTotal - potentialMonthlySavings) * 12;
  const yearlySavings = potentialMonthlySavings * 12;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[hsl(var(--primary))]" />
          <CardTitle>Annual Projection & Optimization</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <span className="text-[11px] text-[hsl(var(--muted-foreground))]">Current Annual Pace</span>
            <div className="text-lg sm:text-xl font-bold text-[hsl(var(--foreground))] mt-1">
              {formatCurrency(yearlyCurrent, 'USD')}
            </div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
              {formatCurrency(monthlyTotal, 'USD')}/month
            </span>
          </div>

          <div className="p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <span className="text-[11px] text-[hsl(var(--muted-foreground))]">Optimized Annual Spend</span>
            <div className="text-lg sm:text-xl font-bold text-[hsl(var(--primary))] mt-1">
              {formatCurrency(yearlyOptimized, 'USD')}
            </div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
              After pruning cancel candidates
            </span>
          </div>

          <div className="p-3 rounded-lg border border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success-subtle)/0.25)]">
            <span className="text-[11px] text-[hsl(var(--success))] font-medium flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> Recoverable Annual Capital
            </span>
            <div className="text-lg sm:text-xl font-bold text-[hsl(var(--success))] mt-1">
              {formatCurrency(yearlySavings, 'USD')}
            </div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
              +{formatCurrency(potentialMonthlySavings, 'USD')}/mo freed cashflow
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
