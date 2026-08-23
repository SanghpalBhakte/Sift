"use client";

import {
  useCreateSubscription,
} from "@/lib/subscriptions/hooks/useCreateSubscription";
import {
  useUpdateSubscription,
} from "@/lib/subscriptions/hooks/useUpdateSubscription";
import {
  useSubscriptionLookups,
} from "@/lib/subscriptions/hooks/useSubscriptionLookups";
import {
  useSubscriptionForm,
} from "@/lib/subscriptions/hooks/useSubscriptionForm";
import type { SubscriptionWithRelations } from "@/lib/subscriptions/types";

type Props = {
  mode: "create" | "edit";
  userId: string;
  subscription?: SubscriptionWithRelations | null;
  onSaved?: (row: SubscriptionWithRelations) => void;
  onCancelled?: () => void;
};

export function SubscriptionFormContainer({
  mode,
  userId,
  subscription,
  onSaved,
  onCancelled,
}: Props) {
  const {
    categoryOptions,
    paymentMethodOptions,
    isLoading: isLoadingLookups,
    isError: isLookupError,
    error: lookupError,
  } = useSubscriptionLookups();

  const { form, setField } = useSubscriptionForm({
    mode,
    subscription,
  });

  const createMutation = useCreateSubscription();
  const updateMutation = useUpdateSubscription();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const validCategoryIds = new Set(categoryOptions.map((option) => option.value));
  const validPaymentMethodIds = new Set(
    paymentMethodOptions.map((option) => option.value)
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) return;
    if (!form.amount.trim() || Number.isNaN(Number(form.amount))) return;
    if (!form.nextBillingDate.trim()) return;

    if (form.categoryId && !validCategoryIds.has(form.categoryId)) {
      return;
    }

    if (form.paymentMethodId && !validPaymentMethodIds.has(form.paymentMethodId)) {
      return;
    }

    const saved =
      mode === "create"
        ? await createMutation.mutateAsync({
            userId,
            values: form,
          })
        : await updateMutation.mutateAsync({
            subscriptionId: subscription!.id,
            userId,
            values: form,
          });

    onSaved?.(saved);
  }

  return (
    <form onSubmit={handleSubmit}>
      {isLookupError ? <div>{String(lookupError)}</div> : null}
      {createMutation.error ? <div>{String(createMutation.error.message)}</div> : null}
      {updateMutation.error ? <div>{String(updateMutation.error.message)}</div> : null}

      <input
        value={form.name}
        onChange={(e) => setField("name", e.target.value)}
        placeholder="Service / Tool Name"
      />

      <input
        value={form.amount}
        onChange={(e) => setField("amount", e.target.value)}
        placeholder="Cost / Amount"
      />

      <input
        value={form.currency}
        onChange={(e) => setField("currency", e.target.value)}
        placeholder="Currency"
      />

      <select
        value={form.billingCycle}
        onChange={(e) => setField("billingCycle", e.target.value as "monthly" | "yearly")}
      >
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly (Annual)</option>
      </select>

      <input
        type="date"
        value={form.nextBillingDate}
        onChange={(e) => setField("nextBillingDate", e.target.value)}
      />

      <select
        value={form.categoryId ?? ""}
        onChange={(e) => setField("categoryId", e.target.value || null)}
        disabled={isLoadingLookups || isSaving}
      >
        <option value="">None / Unassigned</option>
        {categoryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={form.paymentMethodId ?? ""}
        onChange={(e) => setField("paymentMethodId", e.target.value || null)}
        disabled={isLoadingLookups || isSaving}
      >
        <option value="">None / Unassigned</option>
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

      <button type="button" onClick={onCancelled} disabled={isSaving}>
        Cancel
      </button>

      <button type="submit" disabled={isSaving || isLoadingLookups}>
        {isSaving ? "Saving..." : mode === "create" ? "Save Subscription" : "Update Subscription"}
      </button>
    </form>
  );
}
