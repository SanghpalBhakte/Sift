'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { SubscriptionFormData, BillingCycle, ValueRating } from '@/lib/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { SUPPORTED_CURRENCIES } from '@/lib/utils/currency';
import { X, Plus, Sparkles, CheckCircle2 } from 'lucide-react';

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddSubscriptionModal({ isOpen, onClose }: AddSubscriptionModalProps) {
  const { categories, profile, addSubscription } = useSubscriptions();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(profile?.currency_preference || 'USD');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [categoryId, setCategoryId] = useState('');
  const [nextRenewalDate, setNextRenewalDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isTrial, setIsTrial] = useState(false);
  const [trialEndDate, setTrialEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [valueRating, setValueRating] = useState<ValueRating>('useful');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus trapping and management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Small delay to allow DOM render before focusing
      const timer = setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
          return;
        }

        if (e.key === 'Tab' && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length === 0) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a service name.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setError('Please enter a valid price amount.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addSubscription({
        name: name.trim(),
        amount: parsedAmount,
        currency,
        billing_cycle: billingCycle,
        status: 'active',
        category_id: categoryId || null,
        start_date: new Date().toISOString().split('T')[0],
        next_renewal_date: isTrial ? trialEndDate : nextRenewalDate,
        is_trial: isTrial,
        trial_end_date: isTrial ? trialEndDate : null,
        reminder_offsets: profile?.default_reminder_days || [7, 3, 1],
        value_rating: valueRating,
      });

      // Reset fields
      setName('');
      setAmount('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/45 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-sub-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[hsl(var(--border))] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[hsl(var(--primary))]">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 id="quick-add-sub-title" className="text-base font-bold text-[hsl(var(--foreground))]">
                Add Subscription
              </h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Quick entry into your recurring payments ledger
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface))] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {error ? (
            <div className="p-3 text-xs bg-[hsl(var(--danger-subtle))] border border-[hsl(var(--danger)/0.3)] text-[hsl(var(--danger))] rounded-lg">
              {error}
            </div>
          ) : null}

          <div className="space-y-3">
            {/* Service Name */}
            <Input
              ref={firstInputRef}
              label="Service or Tool Name *"
              placeholder="e.g. GitHub Copilot, Spotify, Figma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {/* Price and Currency */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Price Amount *"
                type="number"
                step="0.01"
                min="0"
                placeholder="9.99"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />

              <Select
                label="Billing Currency"
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

            {/* Cadence & Category */}
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Billing Cadence"
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="quarterly">Quarterly</option>
                <option value="weekly">Weekly</option>
              </Select>

              <Select
                label="Category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">General / Uncategorized</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Next Renewal Date */}
            <Input
              label="Next Renewal Date"
              type="date"
              value={isTrial ? trialEndDate : nextRenewalDate}
              onChange={(e) => {
                if (isTrial) setTrialEndDate(e.target.value);
                else setNextRenewalDate(e.target.value);
              }}
            />

            {/* Free Trial Toggle */}
            <div className="pt-1 flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--surface)/0.5)] border border-[hsl(var(--border))]">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
                  This is a Free Trial
                </span>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  Receive advance warning before automatic billing conversion
                </p>
              </div>
              <input
                type="checkbox"
                checked={isTrial}
                onChange={(e) => setIsTrial(e.target.checked)}
                className="w-4 h-4 rounded text-[hsl(var(--primary))] border-[hsl(var(--border))] accent-[hsl(var(--primary))] cursor-pointer"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[hsl(var(--border))]">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="gap-1.5 shadow-xs font-semibold"
            >
              <Plus className="w-4 h-4" /> Save to Ledger
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
