'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Subscription } from '@/lib/types';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { ValueRatingTag } from '../ui/ValueRatingTag';
import { Badge } from '../ui/Badge';
import { CancellationReviewModal } from './CancellationReviewModal';
import { PriceHikeReviewModal } from './PriceHikeReviewModal';
import { formatCurrency, formatCycle, convertCurrency } from '@/lib/utils/currency';
import { getCountdownBadge, formatDate } from '@/lib/utils/dates';
import {
  ExternalLink,
  Pause,
  Play,
  Calendar,
  Edit3,
  Scissors,
  TrendingUp,
} from 'lucide-react';
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
  const { displayCurrency, exchangeRates } = useSubscriptions();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isPriceHikeModalOpen, setIsPriceHikeModalOpen] = useState(false);

  const countdown = getCountdownBadge(subscription.next_renewal_date);
  const trialCountdown = subscription.trial_end_date
    ? getCountdownBadge(subscription.trial_end_date)
    : null;

  const hasUnreviewedPriceHike =
    typeof subscription.previous_amount === 'number' &&
    subscription.previous_amount > 0 &&
    subscription.amount > subscription.previous_amount &&
    !subscription.price_hike_reviewed_at;

  const isDifferentCurrency =
    subscription.currency.toUpperCase() !== displayCurrency.toUpperCase();

  const convertedMonthly = isDifferentCurrency
    ? convertCurrency(
        subscription.monthly_amount,
        subscription.currency,
        displayCurrency,
        exchangeRates.rates
      )
    : null;

  return (
    <>
      <div
        className={cn(
          'sift-card p-3.5 sm:p-4 transition-all',
          subscription.status === 'paused' && 'opacity-60',
          subscription.status === 'canceled' && 'opacity-50 border-dashed'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/subscriptions/${subscription.id}/edit`}
                className="text-sm sm:text-base font-semibold text-foreground hover:text-primary transition-colors truncate"
              >
                {subscription.name}
              </Link>

              {subscription.status === 'paused' ? (
                <Badge variant="muted" size="sm">Paused</Badge>
              ) : subscription.status === 'canceled' ? (
                <Badge variant="danger" size="sm">Canceled in Sift</Badge>
              ) : null}

              {subscription.is_trial ? (
                <Badge variant="warning" size="sm">
                  Trial {trialCountdown ? `· ${trialCountdown.label}` : ''}
                </Badge>
              ) : null}

              {hasUnreviewedPriceHike ? (
                <button
                  type="button"
                  onClick={() => setIsPriceHikeModalOpen(true)}
                  className="cursor-pointer"
                >
                  <Badge variant="warning" size="sm" className="gap-1 hover:opacity-85 transition-opacity">
                    <TrendingUp className="w-3 h-3" /> Price Increased · Review
                  </Badge>
                </button>
              ) : null}

              <ValueRatingTag rating={subscription.value_rating} size="sm" />
            </div>

            {subscription.description ? (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {subscription.description}
              </p>
            ) : null}

            {/* Metadata chips */}
            <div className="flex items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 opacity-60" aria-hidden="true" />
                Renews {formatDate(subscription.next_renewal_date)}
              </span>

              {subscription.category ? (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                  {subscription.category.name}
                </span>
              ) : null}

              {subscription.payment_method ? (
                <span>
                  via {subscription.payment_method.name}
                  {subscription.payment_method.last4 ? ` (···· ${subscription.payment_method.last4})` : ''}
                </span>
              ) : null}
            </div>
          </div>

          {/* Right: Financials & Status */}
          <div className="flex flex-col items-end gap-1 shrink-0 text-right">
            <div>
              <div className="text-base sm:text-lg font-semibold tracking-tight text-foreground tabular-nums">
                {formatCurrency(subscription.amount, subscription.currency)}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">
                  {formatCycle(subscription.billing_cycle, subscription.custom_interval_days)}
                </span>
              </div>

              {isDifferentCurrency && convertedMonthly !== null ? (
                <div className="text-[11px] text-primary font-medium tabular-nums">
                  ≈ {formatCurrency(convertedMonthly, displayCurrency)}/mo
                </div>
              ) : subscription.billing_cycle !== 'monthly' ? (
                <div className="text-[11px] text-muted-foreground tabular-nums">
                  ~{formatCurrency(subscription.monthly_amount, subscription.currency)}/mo
                </div>
              ) : null}
            </div>

            {subscription.status === 'active' ? (
              <Badge
                variant={
                  countdown.urgent ? 'danger' : countdown.warning ? 'warning' : 'outline'
                }
                size="sm"
              >
                {countdown.label}
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Card Footer */}
        <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {subscription.cancel_url ? (
              <a
                href={subscription.cancel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
                Cancel page
              </a>
            ) : null}
          </div>

          <div className="flex items-center gap-1">
            {subscription.status === 'active' ? (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-muted-foreground hover:text-danger hover:bg-danger-subtle/30 transition-colors cursor-pointer"
              >
                <Scissors className="w-3 h-3" aria-hidden="true" /> Cancel
              </button>
            ) : null}

            {onToggleStatus && subscription.status !== 'canceled' ? (
              <button
                type="button"
                onClick={() => onToggleStatus(subscription.id, subscription.status)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
              >
                {subscription.status === 'active' ? (
                  <><Pause className="w-3 h-3" aria-hidden="true" /> Pause</>
                ) : (
                  <><Play className="w-3 h-3 text-primary" aria-hidden="true" /> Resume</>
                )}
              </button>
            ) : null}

            <Link
              href={`/subscriptions/${subscription.id}/edit`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
            >
              <Edit3 className="w-3 h-3" aria-hidden="true" /> Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Cancellation Review Modal */}
      <CancellationReviewModal
        subscription={subscription}
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
      />

      {/* Price Hike Review Modal */}
      <PriceHikeReviewModal
        subscription={subscription}
        isOpen={isPriceHikeModalOpen}
        onClose={() => setIsPriceHikeModalOpen(false)}
        onOpenCancelModal={() => setIsCancelModalOpen(true)}
      />
    </>
  );
}
