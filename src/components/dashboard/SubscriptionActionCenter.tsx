'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSubscriptions } from '@/context/SubscriptionContext';
import {
  generateSubscriptionHealthActions,
  HealthActionItem,
  ActionSeverity,
} from '@/lib/utils/subscriptionHealth';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AnimatedCurrency } from '../ui/AnimatedCurrency';
import { formatCurrency } from '@/lib/utils/currency';
import {
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Scissors,
  Layers,
  ArrowRight,
  ChevronRight,
  TrendingDown,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type FilterTab = 'all' | 'urgent' | 'warning' | 'info';

export function SubscriptionActionCenter() {
  const {
    subscriptions,
    categories,
    displayCurrency,
    exchangeRates,
    toggleStatus,
  } = useSubscriptions();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  const targetCurrency = displayCurrency || 'USD';
  const summary = generateSubscriptionHealthActions(
    subscriptions,
    categories,
    targetCurrency,
    exchangeRates.rates
  );

  const {
    healthScore,
    statusLabel,
    items,
    urgentCount,
    warningCount,
    infoCount,
    potentialMonthlySavings,
    totalActiveCount,
  } = summary;

  // Filter items based on active tab
  const filteredItems = items.filter((item) => {
    if (activeTab === 'urgent') return item.severity === 'urgent';
    if (activeTab === 'warning') return item.severity === 'warning';
    if (activeTab === 'info') return item.severity === 'info';
    return true;
  });

  const handleMarkCanceled = async (subId: string) => {
    setIsProcessingId(subId);
    try {
      await toggleStatus(subId, 'canceled');
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
    } finally {
      setIsProcessingId(null);
    }
  };

  const getSeverityBadge = (severity: ActionSeverity) => {
    switch (severity) {
      case 'urgent':
        return (
          <Badge variant="danger" size="sm" className="gap-1 font-semibold">
            <ShieldAlert className="w-3 h-3" /> Urgent Action
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="warning" size="sm" className="gap-1 font-semibold">
            <Clock className="w-3 h-3" /> Review Due
          </Badge>
        );
      case 'info':
        return (
          <Badge variant="outline" size="sm" className="gap-1 text-primary border-primary/20 bg-primary/5">
            <Sparkles className="w-3 h-3 text-primary" /> Optimization
          </Badge>
        );
    }
  };

  // If no active subscriptions tracked, return null (dashboard empty state handles it)
  if (totalActiveCount === 0) {
    return null;
  }

  // PRISTINE "CALM & OPTIMIZED" STATE (0 action items)
  if (items.length === 0) {
    return (
      <Card className="border-success/30 bg-success-subtle/15">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-success-subtle flex items-center justify-center text-success shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-foreground">
                  Subscription Health: Calm & Optimized
                </h3>
                <Badge variant="success" size="sm" className="gap-1 font-mono">
                  Health Score 100/100
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                All {totalActiveCount} active subscriptions are in good standing. No upcoming trial conversions,
                pending annual renewals, or overlapping service clusters were detected.
              </p>
            </div>
          </div>

          <Link href="/subscriptions" className="shrink-0 self-start sm:self-center">
            <Button variant="outline" size="sm" className="text-xs gap-1">
              View All Subscriptions <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-xs overflow-hidden">
      {/* Header Bar */}
      <CardHeader className="border-b border-border/70 pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <ShieldAlert
                  className={cn(
                    'w-4 h-4 shrink-0',
                    urgentCount > 0
                      ? 'text-danger'
                      : warningCount > 0
                      ? 'text-warning'
                      : 'text-primary'
                  )}
                  aria-hidden="true"
                />
                <CardTitle className="text-sm sm:text-base">
                  Financial Action Center
                </CardTitle>
              </div>

              <Badge
                variant={
                  healthScore >= 80 ? 'success' : healthScore >= 60 ? 'warning' : 'danger'
                }
                size="sm"
                className="font-mono text-[11px]"
              >
                Health Score {healthScore}/100 · {statusLabel}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              {summary.statusDescription}
            </p>
          </div>

          {/* Potential Monthly Savings Indicator */}
          {potentialMonthlySavings > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-success-subtle/30 border border-success/25 shrink-0">
              <TrendingDown className="w-4 h-4 text-success shrink-0" />
              <div>
                <div className="text-xs font-bold text-foreground">
                  +<AnimatedCurrency value={potentialMonthlySavings} currency={targetCurrency} />
                  <span className="text-[10px] font-normal text-muted-foreground">/mo</span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Identified cancel savings
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 cursor-pointer',
              activeTab === 'all'
                ? 'bg-surface text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            All Actions ({items.length})
          </button>

          {urgentCount > 0 ? (
            <button
              type="button"
              onClick={() => setActiveTab('urgent')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1',
                activeTab === 'urgent'
                  ? 'bg-danger-subtle text-danger shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-danger'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-danger" />
              Urgent ({urgentCount})
            </button>
          ) : null}

          {warningCount > 0 ? (
            <button
              type="button"
              onClick={() => setActiveTab('warning')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1',
                activeTab === 'warning'
                  ? 'bg-warning-subtle text-warning shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-warning'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-warning" />
              Review Due ({warningCount})
            </button>
          ) : null}

          {infoCount > 0 ? (
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1',
                activeTab === 'info'
                  ? 'bg-primary/10 text-primary shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Optimizations ({infoCount})
            </button>
          ) : null}
        </div>
      </CardHeader>

      {/* Action Cards List */}
      <CardContent className="p-0 divide-y divide-border">
        {filteredItems.map((action) => (
          <div
            key={action.id}
            className={cn(
              'p-4 sm:p-5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4',
              action.severity === 'urgent'
                ? 'bg-danger-subtle/5 hover:bg-danger-subtle/10'
                : action.severity === 'warning'
                ? 'bg-warning-subtle/5 hover:bg-warning-subtle/10'
                : 'hover:bg-surface/40'
            )}
          >
            {/* Left Info & Explanation */}
            <div className="space-y-2 min-w-0 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                {getSeverityBadge(action.severity)}
                <h4 className="text-sm font-bold text-foreground">
                  {action.title}
                </h4>
                <span className="text-xs font-semibold font-mono text-muted-foreground">
                  {action.impactLabel}
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {action.subtitle}
              </p>

              {/* Transparent "Why this appears" reason tag */}
              <div className="inline-flex items-start gap-1.5 px-2.5 py-1 rounded-lg bg-surface/70 border border-border/80 text-[11px] text-muted-foreground leading-snug">
                <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-foreground">Why this appears: </strong>
                  <span>{action.whyExplanation}</span>{' '}
                  <span className="font-mono text-[10px] text-muted-foreground/80">({action.heuristicRule})</span>
                </div>
              </div>

              {/* Related Subscriptions (For Overlap Clusters) */}
              {action.relatedSubscriptions && action.relatedSubscriptions.length > 0 ? (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {action.relatedSubscriptions.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/subscriptions/${rel.id}/edit`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-card border border-border text-foreground hover:border-primary transition-colors"
                    >
                      <span>{rel.name}</span>
                      <span className="text-muted-foreground font-mono">
                        ({formatCurrency(rel.amount, rel.currency)})
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-start md:self-center pt-2 md:pt-0">
              {action.cancelUrl ? (
                <a
                  href={action.cancelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button variant="outline" size="sm" className="text-xs gap-1 text-danger hover:border-danger">
                    Direct Cancel <ExternalLink className="w-3 h-3" />
                  </Button>
                </a>
              ) : null}

              {action.type === 'cancel_candidate' && action.subscriptionId ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isProcessingId === action.subscriptionId}
                  onClick={() => handleMarkCanceled(action.subscriptionId!)}
                  className="text-xs gap-1 text-danger hover:bg-danger-subtle hover:border-danger"
                >
                  <Scissors className="w-3.5 h-3.5" /> Mark Canceled
                </Button>
              ) : null}

              <Link href={action.actionUrl || '/subscriptions'}>
                <Button
                  variant={action.severity === 'urgent' ? 'primary' : 'outline'}
                  size="sm"
                  className="text-xs gap-1 shadow-xs"
                >
                  {action.suggestedActionLabel} <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
