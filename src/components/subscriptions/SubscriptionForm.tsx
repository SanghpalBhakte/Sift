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

    setError(null);
    setIsSubmitting(true);

    try {
      const payload: SubscriptionFormData = {
        name: name.trim(),
        description: description.trim() || undefined,
        amount: parsedAmount,
        currency,
        billing_cycle: billingCycle,
        custom_interval_days:
          billingCycle === 'custom' ? parseInt(customDays, 10) || 30 : undefined,
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
      };

      await onSubmit(payload);
      router.push('/subscriptions');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred saving subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData || !onDelete) return;
    if (!window.confirm(`Are you sure you want to remove "${initialData.name}"?`)) return;

    setIsDeleting(true);
    try {
      await onDelete(initialData.id);
      router.push('/subscriptions');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete subscription.');
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-3">
          <Link
            href="/subscriptions"
            className="p-1.5 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-[hsl(var(--foreground))]">
              {isEditing ? 'Edit Subscription' : 'Add Subscription'}
            </h1>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {isEditing
                ? 'Update billing terms, value ratings, or notes'
                : 'Track a new recurring service, tool, or trial'}
            </p>
          </div>
        </div>

        {isEditing && onDelete ? (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
            className="gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="p-3 text-xs bg-[hsl(var(--danger-subtle))] border border-[hsl(var(--danger)/0.3)] text-[hsl(var(--danger))] rounded-lg">
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

      {/* Billing & Schedule Card */}
      <Card>
        <CardHeader>
          <CardTitle>Billing & Renewal</CardTitle>
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

          {/* Trial Toggle */}
          <div className="pt-2 border-t border-[hsl(var(--border))] space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isTrial}
                onChange={(e) => setIsTrial(e.target.checked)}
                className="w-4 h-4 rounded text-[hsl(var(--primary))] border-[hsl(var(--border))] focus:ring-[hsl(var(--primary))]"
              />
              <span className="text-xs font-medium text-[hsl(var(--foreground))]">
                Currently on a Free Trial
              </span>
            </label>

            {isTrial ? (
              <div className="pl-6 pt-1">
                <Input
                  label="Trial Expiration Date"
                  type="date"
                  value={trialEndDate}
                  onChange={(e) => setTrialEndDate(e.target.value)}
                  helperText="Sift will alert you prior to this date so you can decide before conversion."
                />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Decision & Value Rating Card */}
      <Card>
        <CardHeader>
          <CardTitle>Value Rating & Decision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="Value Rating (How essential is this subscription?)"
            value={valueRating}
            onChange={(e) => setValueRating(e.target.value as ValueRating)}
          >
            <option value="essential">Essential — High daily/weekly utility</option>
            <option value="useful">Useful — Worth keeping for now</option>
            <option value="rarely_used">Rarely Used — Candidate for review</option>
            <option value="cancel_candidate">Cancel Candidate — Plan to cancel before next cycle</option>
          </Select>

          <Input
            label="Direct Cancellation URL"
            type="url"
            placeholder="https://service.com/account/billing"
            value={cancelUrl}
            onChange={(e) => setCancelUrl(e.target.value)}
            helperText="Direct link to cancel or downgrade when you want to act quickly."
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[hsl(var(--foreground))]">
              Personal Notes
            </label>
            <textarea
              className="sift-input min-h-[80px] resize-y"
              placeholder="e.g. Shared with team member; reconsider next quarter."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href="/subscriptions">
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </Link>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isEditing ? 'Save Changes' : 'Create Subscription'}
        </Button>
      </div>
    </form>
  );
}
