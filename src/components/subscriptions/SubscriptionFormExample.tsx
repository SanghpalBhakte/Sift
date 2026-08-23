"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BILLING_CYCLE_OPTIONS,
  EMPTY_SUBSCRIPTION_FORM,
  NONE_OPTION_VALUE,
  STATUS_OPTIONS,
} from "@/lib/subscriptions/constants";
import {
  fetchCategoryOptions,
  fetchPaymentMethodOptions,
} from "@/lib/subscriptions/options";
import {
  createSubscription,
  updateSubscription,
} from "@/lib/subscriptions/api";
import { mapSubscriptionRowToForm } from "@/lib/subscriptions/mappers";
import type {
  SelectOption,
  SubscriptionFormValues,
  SubscriptionWithRelations,
} from "@/lib/subscriptions/types";

type Props = {
  mode: "create" | "edit";
  userId: string;
  subscription?: SubscriptionWithRelations | null;
  onSaved?: (row: SubscriptionWithRelations) => void;
  onCancelled?: () => void;
};

export function SubscriptionFormExample({
  mode,
  userId,
  subscription,
  onSaved,
  onCancelled,
}: Props) {
  const [form, setForm] = useState<SubscriptionFormValues>(EMPTY_SUBSCRIPTION_FORM);
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [paymentMethodOptions, setPaymentMethodOptions] = useState<SelectOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const initializedForId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      try {
        setIsLoadingOptions(true);
        const [categories, paymentMethods] = await Promise.all([
          fetchCategoryOptions(),
          fetchPaymentMethodOptions(),
        ]);
        if (!active) return;
        setCategoryOptions(categories);
        setPaymentMethodOptions(paymentMethods);
      } catch {
        if (!active) return;
        setFormError("Could not load categories or payment methods.");
      } finally {
        if (active) setIsLoadingOptions(false);
      }
    }

    loadOptions();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (mode !== "edit") return;
    if (!subscription) return;
    if (initializedForId.current === subscription.id) return;

    setForm(mapSubscriptionRowToForm(subscription));
    initializedForId.current = subscription.id;
  }, [mode, subscription]);

  const validCategoryIds = useMemo(
    () => new Set(categoryOptions.map((option) => option.value)),
    [categoryOptions]
  );

  const validPaymentMethodIds = useMemo(
    () => new Set(paymentMethodOptions.map((option) => option.value)),
    [paymentMethodOptions]
  );

  function setField<K extends keyof SubscriptionFormValues>(
    key: K,
    value: SubscriptionFormValues[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Name is required.");
      return;
    }

    if (!form.amount.trim() || Number.isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setFormError("Amount must be a valid number greater than zero.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.nextBillingDate)) {
      setFormError("Next billing date must be YYYY-MM-DD.");
      return;
    }

    if (form.categoryId && !validCategoryIds.has(form.categoryId)) {
      setFormError("Selected category is no longer valid. Please choose again.");
      return;
    }

    if (form.paymentMethodId && !validPaymentMethodIds.has(form.paymentMethodId)) {
      setFormError("Selected payment method is no longer valid. Please choose again.");
      return;
    }

    try {
      setIsSaving(true);

      const saved =
        mode === "create"
          ? await createSubscription({
              userId,
              values: form,
            })
          : await updateSubscription({
              subscriptionId: subscription!.id,
              userId,
              values: form,
            });

      onSaved?.(saved as unknown as SubscriptionWithRelations);
    } catch (error: unknown) {
      const err = error as { message?: string };
      setFormError(
        err?.message
          ? `Could not save subscription: ${err.message}`
          : "Could not save subscription."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {formError ? <div>{formError}</div> : null}

      <input
        value={form.name}
        onChange={(e) => setField("name", e.target.value)}
        placeholder="Service name"
      />

      <input
        value={form.amount}
        onChange={(e) => setField("amount", e.target.value)}
        placeholder="Amount"
        inputMode="decimal"
      />

      <input
        value={form.currency}
        onChange={(e) => setField("currency", e.target.value)}
        placeholder="Currency"
      />

      <select
        value={form.billingCycle}
        onChange={(e) => setField("billingCycle", e.target.value as SubscriptionFormValues["billingCycle"])}
      >
        {BILLING_CYCLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={form.nextBillingDate}
        onChange={(e) => setField("nextBillingDate", e.target.value)}
      />

      <select
        value={form.categoryId ?? NONE_OPTION_VALUE}
        onChange={(e) => setField("categoryId", e.target.value || null)}
        disabled={isLoadingOptions || isSaving}
      >
        <option value={NONE_OPTION_VALUE}>None / Unassigned</option>
        {categoryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={form.paymentMethodId ?? NONE_OPTION_VALUE}
        onChange={(e) => setField("paymentMethodId", e.target.value || null)}
        disabled={isLoadingOptions || isSaving}
      >
        <option value={NONE_OPTION_VALUE}>None / Unassigned</option>
        {paymentMethodOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <textarea
        value={form.description}
        onChange={(e) => setField("description", e.target.value)}
        placeholder="Description"
      />

      <textarea
        value={form.notes}
        onChange={(e) => setField("notes", e.target.value)}
        placeholder="Notes"
      />

      <select
        value={form.status}
        onChange={(e) => setField("status", e.target.value as SubscriptionFormValues["status"])}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label>
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setField("isActive", e.target.checked)}
        />
        Active
      </label>

      <input
        type="date"
        value={form.trialEndsOn ?? ""}
        onChange={(e) => setField("trialEndsOn", e.target.value || null)}
      />

      <input
        type="date"
        value={form.cancellationEffectiveDate ?? ""}
        onChange={(e) => setField("cancellationEffectiveDate", e.target.value || null)}
      />

      <input
        value={form.monthlyAlternativePrice}
        onChange={(e) => setField("monthlyAlternativePrice", e.target.value)}
        placeholder="Monthly alternative price"
        inputMode="decimal"
      />

      <button type="button" onClick={onCancelled} disabled={isSaving}>
        Cancel
      </button>

      <button type="submit" disabled={isSaving || isLoadingOptions}>
        {isSaving ? "Saving..." : mode === "create" ? "Save Subscription" : "Update Subscription"}
      </button>
    </form>
  );
}
