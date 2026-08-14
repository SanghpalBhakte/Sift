'use client';

import React from 'react';
import Link from 'next/link';
import { Subscription } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency } from '@/lib/utils/currency';
import { Badge } from '../ui/Badge';
import { Scissors, ExternalLink, ArrowRight } from 'lucide-react';

export function CancelCandidates({ subscriptions }: { subscriptions: Subscription[] }) {
  const candidates = subscriptions.filter(
    (s) => s.value_rating === 'cancel_candidate' && s.status === 'active'
  );

  if (candidates.length === 0) {
    return null;
  }

  const monthlySavings = candidates.reduce((acc, s) => acc + s.monthly_amount, 0);

  return (
    <Card className="border-[hsl(var(--danger)/0.3)] bg-[hsl(var(--danger-subtle)/0.25)]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-[hsl(var(--danger))]" />
          <CardTitle className="text-[hsl(var(--foreground))]">
            Cancel Candidates ({candidates.length})
          </CardTitle>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-[hsl(var(--danger))]">
            Save {formatCurrency(monthlySavings, 'USD')}/mo
          </span>
          <span className="block text-[10px] text-[hsl(var(--muted-foreground))]">
            {formatCurrency(monthlySavings * 12, 'USD')}/yr
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pt-1">
        <div className="divide-y divide-[hsl(var(--border))]">
          {candidates.map((sub) => (
            <div
              key={sub.id}
              className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/subscriptions/${sub.id}/edit`}
                    className="text-sm font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors truncate"
                  >
                    {sub.name}
                  </Link>
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    {formatCurrency(sub.amount, sub.currency)}
                  </span>
                </div>
                {sub.notes ? (
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5 line-clamp-1">
                    {sub.notes}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {sub.cancel_url ? (
                  <a
                    href={sub.cancel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-[hsl(var(--danger))] hover:underline flex items-center gap-1"
                  >
                    Cancel Link <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <Link
                    href={`/subscriptions/${sub.id}/edit`}
                    className="text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  >
                    Review
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
