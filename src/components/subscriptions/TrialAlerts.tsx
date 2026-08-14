'use client';

import React from 'react';
import Link from 'next/link';
import { Subscription } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency } from '@/lib/utils/currency';
import { getCountdownBadge, formatDate } from '@/lib/utils/dates';
import { Badge } from '../ui/Badge';
import { AlertCircle, ExternalLink, ShieldAlert } from 'lucide-react';

export function TrialAlerts({ subscriptions }: { subscriptions: Subscription[] }) {
  const trialSubs = subscriptions.filter((s) => s.is_trial && s.status === 'active');

  if (trialSubs.length === 0) {
    return null;
  }

  return (
    <Card className="border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning-subtle)/0.3)]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[hsl(var(--warning))]" />
          <CardTitle className="text-[hsl(var(--foreground))]">
            Active Free Trials ({trialSubs.length})
          </CardTitle>
        </div>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          Decide before conversion
        </span>
      </CardHeader>

      <CardContent className="space-y-2 pt-1">
        <div className="divide-y divide-[hsl(var(--border))]">
          {trialSubs.map((sub) => {
            const countdown = sub.trial_end_date
              ? getCountdownBadge(sub.trial_end_date)
              : getCountdownBadge(sub.next_renewal_date);

            return (
              <div
                key={sub.id}
                className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/subscriptions/${sub.id}/edit`}
                      className="text-sm font-semibold text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                    >
                      {sub.name}
                    </Link>
                    <Badge variant="warning" size="sm">
                      {countdown.label}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                    Converts to {formatCurrency(sub.amount, sub.currency)}/mo on{' '}
                    {formatDate(sub.trial_end_date || sub.next_renewal_date)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {sub.cancel_url ? (
                    <a
                      href={sub.cancel_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-[hsl(var(--primary))] hover:underline flex items-center gap-1"
                    >
                      Cancel Page <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <Link
                      href={`/subscriptions/${sub.id}/edit`}
                      className="text-xs font-medium text-[hsl(var(--primary))] hover:underline"
                    >
                      Manage
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
