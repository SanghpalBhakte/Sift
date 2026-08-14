'use client';

import React from 'react';
import Link from 'next/link';
import { Subscription } from '@/lib/types';
import { Card } from '../ui/Card';
import { ValueRatingTag } from '../ui/ValueRatingTag';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatCycle } from '@/lib/utils/currency';
import { getCountdownBadge, formatDate } from '@/lib/utils/dates';
import { ExternalLink, MoreVertical, Pause, Play, Calendar, AlertCircle, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SubscriptionCardProps {
  subscription: Subscription;
  onToggleStatus?: (id: string, currentStatus: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function SubscriptionCard({
  subscription,
  onToggleStatus,
  compact = false,
}: SubscriptionCardProps) {
  const countdown = getCountdownBadge(subscription.next_renewal_date);
  const trialCountdown = subscription.trial_end_date
    ? getCountdownBadge(subscription.trial_end_date)
    : null;

  return (
    <div className="sift-card p-3.5 sm:p-4 transition-all hover:border-[hsl(var(--muted-foreground)/0.3)]">
      <div className="flex items-start justify-between gap-3">
        {/* Left Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/subscriptions/${subscription.id}/edit`}
              className="text-sm sm:text-base font-semibold text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors truncate"
            >
              {subscription.name}
            </Link>

            {subscription.status === 'paused' ? (
              <Badge variant="muted" size="sm">
                Paused
              </Badge>
            ) : null}

            {subscription.is_trial ? (
              <Badge variant="warning" size="sm">
                Trial {trialCountdown ? `· ${trialCountdown.label}` : ''}
              </Badge>
            ) : null}

            <ValueRatingTag rating={subscription.value_rating} size="sm" />
          </div>

          {subscription.description ? (
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 line-clamp-1">
              {subscription.description}
            </p>
          ) : null}

          {/* Metadata chips */}
          <div className="flex items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-[hsl(var(--muted-foreground))] flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 opacity-70" />
              Renews {formatDate(subscription.next_renewal_date)}
            </span>

            {subscription.category ? (
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary)/0.6)]" />
                {subscription.category.name}
              </span>
            ) : null}

            {subscription.payment_method ? (
              <span>
                via {subscription.payment_method.name}
                {subscription.payment_method.last4 ? ` (•••• ${subscription.payment_method.last4})` : ''}
              </span>
            ) : null}
          </div>
        </div>

        {/* Right Financials & Status */}
        <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
          <div>
            <div className="text-base sm:text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">
              {formatCurrency(subscription.amount, subscription.currency)}
              <span className="text-xs font-normal text-[hsl(var(--muted-foreground))] ml-0.5">
                {formatCycle(subscription.billing_cycle, subscription.custom_interval_days)}
              </span>
            </div>
            {subscription.billing_cycle !== 'monthly' ? (
              <div className="text-[11px] text-[hsl(var(--muted-foreground))]">
                ~{formatCurrency(subscription.monthly_amount, subscription.currency)}/mo
              </div>
            ) : null}
          </div>

          {/* Renewal timing tag */}
          {subscription.status === 'active' ? (
            <Badge
              variant={
                countdown.urgent
                  ? 'danger'
                  : countdown.warning
                  ? 'warning'
                  : 'outline'
              }
              size="sm"
            >
              {countdown.label}
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="mt-3 pt-2.5 border-t border-[hsl(var(--border))] flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {subscription.cancel_url ? (
            <a
              href={subscription.cancel_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              Cancel Link <ExternalLink className="w-2.5 h-2.5" />
            </a>
          ) : null}
          {subscription.notes ? (
            <span className="text-[11px] text-[hsl(var(--muted-foreground))] truncate max-w-[200px]" title={subscription.notes}>
              Note: {subscription.notes}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {onToggleStatus ? (
            <button
              type="button"
              onClick={() => onToggleStatus(subscription.id, subscription.status)}
              className="inline-flex items-center gap-1 text-[11px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] px-1.5 py-0.5 rounded transition-colors"
            >
              {subscription.status === 'active' ? (
                <>
                  <Pause className="w-3 h-3" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" /> Resume
                </>
              )}
            </button>
          ) : null}

          <Link
            href={`/subscriptions/${subscription.id}/edit`}
            className="inline-flex items-center gap-1 text-[11px] text-[hsl(var(--primary))] hover:underline px-1.5 py-0.5"
          >
            <Edit3 className="w-3 h-3" /> Edit
          </Link>
        </div>
      </div>
    </div>
  );
}
