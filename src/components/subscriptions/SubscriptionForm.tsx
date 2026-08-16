'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BillingCycle,
  Category,
  PaymentMethod,
  Subscription,
  SubscriptionFormData,
  SubscriptionStatus,
  ValueRating,
} from '@/lib/types';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { SUPPORTED_CURRENCIES } from '@/lib/utils/currency';
import { Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface SubscriptionFormProps {
  initialData?: Subscription;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onSubmit: (data: SubscriptionFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isEditing?: boolean;
}

export function SubscriptionForm({
  initialData,
  categories,
  paymentMethods,
  onSubmit,
  onDelete,
  isEditing = false,
}: SubscriptionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState<string>(initialData ? String(initialData.amount) : '');
  const [currency, setCurrency] = useState(initialData?.currency || 'USD');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    initialData?.billing_cycle || 'monthly'
  );
  const [customDays, setCustomDays] = useState<string>(
    initialData?.custom_interval_days ? String(initialData.custom_interval_days) : '30'
  );
  const [monthlyAlternativePrice, setMonthlyAlternativePrice] = useState<string>(
    initialData?.monthly_alternative_price ? String(initialData.monthly_alternative_price) : ''
  );
  const [status, setStatus] = useState<SubscriptionStatus>(initialData?.status || 'active');
  const [categoryId, setCategoryId] = useState<string>(initialData?.category_id || '');
  const [paymentMethodId, setPaymentMethodId] = useState<string>(
    initialData?.payment_method_id || ''
  );
  const [startDate, setStartDate] = useState(
    initialData?.start_date || new Date().toISOString().split('T')[0]
  );
  const [nextRenewalDate, setNextRenewalDate] = useState(
    initialData?.next_renewal_date ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isTrial, setIsTrial] = useState<boolean>(initialData?.is_trial || false);
  const [trialEndDate, setTrialEndDate] = useState<string>(
    initialData?.trial_end_date ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [valueRating, setValueRating] = useState<ValueRating>(
    initialData?.value_rating || 'useful'
  );
  const [cancelUrl, setCancelUrl] = useState(initialData?.cancel_url || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [reminderDays, setReminderDays] = useState<number[]>(
    initialData?.reminder_offsets || [3, 1]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this subscription.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setError('Please enter a valid amount.');
      return;
    }

    const parsedMonthlyAlt =
      billingCycle === 'yearly' && monthlyAlternativePrice
        ? parseFloat(monthlyAlternativePrice)
        : undefined;

    setError(null);
    setIsSubmitting(true);

    try {
      let prevAmount = initialData?.previous_amount || undefined;
      let priceHikeReviewedAt = initialData?.price_hike_reviewed_at || undefined;

      if (initialData && parsedAmount !== initialData.amount) {
        prevAmount = initialData.amount;
        priceHikeReviewedAt = undefined; // Reset review state so new price hike is flagged
      }

      const payload: SubscriptionFormData = {
        name: name.trim(),
        description: description.trim() || undefined,
        amount: parsedAmount,
        currency,
        billing_cycle: billingCycle,
        custom_interval_days:
          billingCycle === 'custom' ? parseInt(customDays, 10) || 30 : undefined,
        monthly_alternative_price:
          parsedMonthlyAlt && parsedMonthlyAlt > 0 ? parsedMonthlyAlt : undefined,
        status,
        category_id: categoryId || undefined,
        payment_method_id: paymentMethodId || undefined,
        start_date: startDate,
        next_renewal_date: nextRenewalDate,
        is_trial: isTrial,
        trial_end_date: isTrial ? trialEndDate : undefined,
        reminder_offsets: reminderDays,
        value_rating: valueRating,
        cancel_url: cancelUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        previous_amount: prevAmount,
        price_hike_reviewed_at: priceHikeReviewedAt,
        cancellation_reason: initialData?.cancellation_reason,
        cancellation_effective_date: initialData?.cancellation_effective_date,
      };

      await onSubmit(payload);
      router.push('/subscriptions');
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'An error occurred while saving the subscription.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData || !onDelete) return;
    if (confirm(`Are you sure you want to delete ${initialData.name}?`)) {
      setIsDeleting(true);
      try {
        await onDelete(initialData.id);
        router.push('/subscriptions');
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to delete the subscription.';
        setError(errorMsg);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const toggleReminderDay = (day: number) => {
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter((d) => d !== day));
    } else {
      setReminderDays([...reminderDays, day].sort((a, b) => b - a));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/subscriptions"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {isEditing ? `Edit ${initialData?.name}` : 'New Subscription'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isEditing
                ? 'Update commitment details, reminder offsets, and rating.'
                : 'Add a new recurring expense or trial to your ledger.'}
            </p>
          </div>
        </div>

        {isEditing && onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
            className="text-xs text-danger hover:bg-danger-subtle gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="p-3 text-xs bg-danger-subtle border border-danger/25 text-danger rounded-lg">
          {error}
        </div>
      ) : null}

      {/* Core Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Service / Tool Name *"
            placeholder="e.g., Cursor, GitHub Copilot, Fastmail"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Short Description (Optional)"
            placeholder="e.g., AI coding assistant"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select a category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select
              label="Payment Method"
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
            >
              <option value="">Select payment method...</option>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name} {pm.last4 ? `(•••• ${pm.last4})` : ''}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Billing & Cycle Card */}
      <Card>
        <CardHeader>
          <CardTitle>Billing & Renewal Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Amount *"
                type="number"
                step="0.01"
                min="0"
                placeholder="20.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <Select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Billing Cycle"
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly (Annual)</option>
              <option value="quarterly">Quarterly (Every 3 months)</option>
              <option value="custom">Custom interval</option>
            </Select>

            {billingCycle === 'custom' ? (
              <Input
                label="Interval in Days"
                type="number"
                min="1"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                placeholder="30"
              />
            ) : (
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="canceled">Canceled</option>
                <option value="archived">Archived</option>
              </Select>
            )}
          </div>

          {/* Annual Plan Arbitrage Support */}
          {billingCycle === 'yearly' ? (
            <div className="p-3.5 rounded-xl bg-surface/50 border border-border space-y-1.5">
              <Input
                label="Monthly Plan Alternative Price (Optional)"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 10.00"
                value={monthlyAlternativePrice}
                onChange={(e) => setMonthlyAlternativePrice(e.target.value)}
                helperText="Enter the price if billed monthly to compute annual plan savings and renewal arbitrage."
              />
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              label="Next Renewal Date *"
              type="date"
              value={nextRenewalDate}
              onChange={(e) => setNextRenewalDate(e.target.value)}
              required
            />
          </div>

          {/* Free Trial Toggle */}
          <div className="pt-2 border-t border-border space-y-3">
            <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={isTrial}
                onChange={(e) => setIsTrial(e.target.checked)}
                className="w-4 h-4 rounded text-primary border-border accent-primary"
              />
              <span>This subscription is currently in a free trial period</span>
            </label>

            {isTrial ? (
              <div className="pl-6">
                <Input
                  label="Trial Expiration Date *"
                  type="date"
                  value={trialEndDate}
                  onChange={(e) => setTrialEndDate(e.target.value)}
                  required={isTrial}
                  helperText="You will receive urgent advance alerts before this date to prevent surprise card charges."
                />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Value Rating & Audit Card */}
      <Card>
        <CardHeader>
          <CardTitle>Value Audit & Optimization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="Value Tier"
            value={valueRating}
            onChange={(e) => setValueRating(e.target.value as ValueRating)}
            helperText="Categorize utility to track potential savings on rarely used tools."
          >
            <option value="essential">Essential — Core everyday tool, would replace immediately</option>
            <option value="useful">Useful — Regular utility, provides clear value</option>
            <option value="rarely_used">Rarely Used — Infrequent usage, consider pausing</option>
            <option value="cancel_candidate">Cancel Candidate — Slated for cancellation before renewal</option>
          </Select>

          <Input
            label="Direct Cancellation Link (Optional)"
            type="url"
            placeholder="https://app.service.com/account/billing"
            value={cancelUrl}
            onChange={(e) => setCancelUrl(e.target.value)}
            helperText="Link directly to the provider's billing management page for 1-click cancellation."
          />

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground block">
              Renewal Alert Offsets (Days before charge)
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {[7, 3, 1, 0].map((day) => {
                const isSelected = reminderDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleReminderDay(day)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface/80'
                    )}
                  >
                    {day === 0 ? 'On renewal date' : `${day} day${day === 1 ? '' : 's'} prior`}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground block">
              Private Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Annual discount code applied, shared with design team..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="sift-input w-full resize-none text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href="/subscriptions">
          <Button type="button" variant="outline" size="md">
            Cancel
          </Button>
        </Link>

        <Button type="submit" variant="primary" size="md" isLoading={isSubmitting} className="shadow-xs font-semibold">
          {isEditing ? 'Update Subscription' : 'Create Subscription'}
        </Button>
      </div>
    </form>
  );
}
