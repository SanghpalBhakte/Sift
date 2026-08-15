'use client';

import React from 'react';
import Link from 'next/link';
import { Subscription } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency } from '@/lib/utils/currency';
import { getCountdownBadge, formatDate } from '@/lib/utils/dates';
import { Badge } from '../ui/Badge';
import { ExternalLink, ShieldAlert } from 'lucide-react';

export function TrialAlerts({ subscriptions }: { subscriptions: Subscription[] }) {
  const trialSubs = subscriptions.filter((s) => s.is_trial && s.status === 'active');

  if (trialSubs.length === 0) {
    return null;
  }

  return (
    <Card className="border-warning/25 bg-warning-subtle/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-warning shrink-0" aria-hidden="true" />
          <CardTitle>Active Free Trials ({trialSubs.length})</CardTitle>
        </div>
        <span className="text-xs text-muted-foreground">Decide before conversion</span>
      </CardHeader>

      <CardContent className="space-y-0 pt-1">
        <div className="divide-y divide-border">
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
                      className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate"
                    >
                      {sub.name}
                    </Link>
                    <Badge variant="warning" size="sm">
                      {countdown.label}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Converts to{' '}
                    <span className="tabular-nums">{formatCurrency(sub.amount, sub.currency)}/mo</span>{' '}
                    on {formatDate(sub.trial_end_date || sub.next_renewal_date)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {sub.cancel_url ? (
                    <a
                      href={sub.cancel_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      Cancel Page <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  ) : (
                    <Link
                      href={`/subscriptions/${sub.id}/edit`}
                      className="text-xs font-medium text-primary hover:underline"
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
