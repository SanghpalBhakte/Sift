'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AnnualComparisonResult, Subscription } from '@/lib/types';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/dates';
import {
  CalendarClock,
  TrendingDown,
  AlertCircle,
  HelpCircle,
  Check,
  Edit2,
  ExternalLink,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface AnnualOptimizationReviewProps {
  items: AnnualComparisonResult[];
  currency?: string;
  showAllIfEmpty?: boolean;
}

export function AnnualOptimizationReview({
  items,
  currency = 'USD',
}: AnnualOptimizationReviewProps) {
  const { updateSubscription } = useSubscriptions();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputPrice, setInputPrice] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  if (items.length === 0) {
    return null;
  }

  const handleStartEdit = (subId: string, currentPrice: number | null) => {
    setEditingId(subId);
    setInputPrice(currentPrice ? String(currentPrice) : '');
  };

  const handleSavePrice = async (sub: Subscription) => {
    const parsed = parseFloat(inputPrice);
    if (isNaN(parsed) || parsed < 0) return;

    setIsSaving(true);
    try {
      await updateSubscription(sub.id, {
        monthly_alternative_price: parsed > 0 ? parsed : null,
      });
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update monthly alternative price:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-[hsl(var(--primary)/0.3)] shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-[hsl(var(--primary))]" />
          <div>
            <CardTitle>Annual Renewal & Plan Optimization</CardTitle>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
              Review upcoming annual commitments before they auto-renew
            </p>
          </div>
        </div>
        <Badge variant="primary" size="sm">
          {items.length} plan{items.length === 1 ? '' : 's'} nearing renewal
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        <div className="divide-y divide-[hsl(var(--border))]">
          {items.map((item) => {
            const { subscription, daysUntilRenewal, insightType } = item;
            const isEditingThis = editingId === subscription.id;

            return (
              <div
                key={subscription.id}
                className="py-3.5 first:pt-0 last:pb-0 space-y-2.5"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/subscriptions/${subscription.id}/edit`}
                        className="text-sm font-bold text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors truncate"
                      >
                        {subscription.name}
                      </Link>

                      <Badge
                        variant={
                          daysUntilRenewal <= 7
                            ? 'danger'
                            : daysUntilRenewal <= 14
                            ? 'warning'
                            : 'outline'
                        }
                        size="sm"
                      >
                        {daysUntilRenewal === 0
                          ? 'Renews Today'
                          : daysUntilRenewal === 1
                          ? 'Renews Tomorrow'
                          : `Renews in ${daysUntilRenewal} days`}
                      </Badge>
                    </div>

                    <div className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                      Annual charge on {formatDate(subscription.next_renewal_date)} ·{' '}
                      {subscription.category?.name || 'General'}
                    </div>
                  </div>

                  {/* Financials */}
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-[hsl(var(--foreground))] font-mono">
                      {formatCurrency(subscription.amount, subscription.currency)}
                      <span className="text-xs font-normal text-[hsl(var(--muted-foreground))] ml-0.5">
                        /yr
                      </span>
                    </div>
                    <div className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono">
                      ~{formatCurrency(item.effectiveMonthlyRate, subscription.currency)}/mo
                    </div>
                  </div>
                </div>

                {/* Insight & Comparison Box */}
                <div className="p-3 rounded-xl bg-[hsl(var(--surface)/0.6)] border border-[hsl(var(--border))] space-y-2 text-xs">
                  {insightType === 'annual_cheaper' &&
                  item.annualSavingsAmount !== null &&
                  item.monthlyAlternativePrice !== null ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-semibold text-[hsl(var(--success))]">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>
                            Annual plan saves {formatCurrency(item.annualSavingsAmount, subscription.currency)}/yr ({item.savingsPercent}% discount)
                          </span>
                        </div>
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                          Monthly rate: {formatCurrency(item.monthlyAlternativePrice, subscription.currency)}/mo ({formatCurrency(item.yearlyAtMonthlyRate || 0, subscription.currency)}/yr equivalent)
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(subscription.id, item.monthlyAlternativePrice)}
                          className="text-[11px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit rate
                        </button>
                      </div>
                    </div>
                  ) : insightType === 'monthly_cheaper' &&
                    item.annualSavingsAmount !== null &&
                    item.monthlyAlternativePrice !== null ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-semibold text-[hsl(var(--warning))]">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>
                            Annual plan costs {formatCurrency(Math.abs(item.annualSavingsAmount), subscription.currency)} more per year than monthly
                          </span>
                        </div>
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                          Monthly price: {formatCurrency(item.monthlyAlternativePrice, subscription.currency)}/mo
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartEdit(subscription.id, item.monthlyAlternativePrice)}
                        className="text-[11px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Edit rate
                      </button>
                    </div>
                  ) : (
                    /* Missing Monthly Alternative Price State */
                    <div className="space-y-2">
                      {!isEditingThis ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))]">
                            <HelpCircle className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                            <span>
                              Monthly alternative price not set. Add it to evaluate annual savings vs monthly flexibility.
                            </span>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartEdit(subscription.id, null)}
                            className="text-[11px] h-7 px-2.5 shrink-0 gap-1"
                          >
                            <Sparkles className="w-3 h-3 text-[hsl(var(--primary))]" />
                            Add Monthly Price
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Inline monthly price editor */}
                  {isEditingThis ? (
                    <div className="pt-2 border-t border-[hsl(var(--border))] flex items-center gap-2">
                      <div className="relative flex-1 max-w-[180px]">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 10.00"
                          value={inputPrice}
                          onChange={(e) => setInputPrice(e.target.value)}
                          className="sift-input text-xs py-1 px-2.5 h-7 w-full font-mono"
                          autoFocus
                        />
                      </div>
                      <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
                        {subscription.currency} / month
                      </span>

                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleSavePrice(subscription)}
                        isLoading={isSaving}
                        className="text-xs h-7 px-3"
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                        className="text-xs h-7 px-2"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
