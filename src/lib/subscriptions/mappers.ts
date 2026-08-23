import type {
  CategoryRow,
  PaymentMethodRow,
  SelectOption,
  SubscriptionDisplay,
  SubscriptionFormValues,
  SubscriptionInsert,
  SubscriptionRow,
  SubscriptionUpdate,
  SubscriptionWithRelations,
} from "./types";
import { DEFAULT_CURRENCY } from "./constants";

export function mapCategoryToOption(row: CategoryRow): SelectOption {
  return {
    value: row.id,
    label: row.name,
  };
}

export function mapPaymentMethodToOption(row: PaymentMethodRow): SelectOption {
  return {
    value: row.id,
    label: row.name,
  };
}

export function mapSubscriptionRowToDisplay(
  row: SubscriptionRow | SubscriptionWithRelations
): SubscriptionDisplay {
  const category = "category" in row ? row.category : null;
  const paymentMethod = "payment_method" in row ? row.payment_method : null;

  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    currency: row.currency,
    billingCycle: row.billing_cycle,
    nextBillingDate: row.next_billing_date,
    categoryId: row.category_id,
    categoryName: category?.name ?? "None / Unassigned",
    paymentMethodId: row.payment_method_id,
    paymentMethodName: paymentMethod?.name ?? "None / Unassigned",
    description: row.description ?? "",
    notes: row.notes ?? "",
    isActive: row.is_active,
    status: row.status,
    trialEndsOn: row.trial_ends_on,
    cancellationEffectiveDate: row.cancellation_effective_date,
    monthlyAlternativePrice:
      row.monthly_alternative_price == null
        ? null
        : Number(row.monthly_alternative_price),
  };
}

export function mapSubscriptionRowToForm(
  row: SubscriptionRow | SubscriptionWithRelations
): SubscriptionFormValues {
  return {
    name: row.name ?? "",
    amount: row.amount != null ? String(row.amount) : "",
    currency: row.currency ?? DEFAULT_CURRENCY,
    billingCycle: row.billing_cycle ?? "monthly",
    nextBillingDate: row.next_billing_date ?? "",
    categoryId: row.category_id ?? null,
    paymentMethodId: row.payment_method_id ?? null,
    description: row.description ?? "",
    notes: row.notes ?? "",
    isActive: row.is_active ?? true,
    status: row.status ?? "active",
    trialEndsOn: row.trial_ends_on ?? null,
    cancellationEffectiveDate: row.cancellation_effective_date ?? null,
    monthlyAlternativePrice:
      row.monthly_alternative_price != null
        ? String(row.monthly_alternative_price)
        : "",
  };
}

export function buildSubscriptionInsertPayload(params: {
  userId: string;
  values: SubscriptionFormValues;
}): SubscriptionInsert {
  const { userId, values } = params;

  return {
    user_id: userId,
    name: values.name.trim(),
    amount: Number(values.amount),
    currency: values.currency,
    billing_cycle: values.billingCycle,
    next_billing_date: values.nextBillingDate,
    category_id: values.categoryId || null,
    payment_method_id: values.paymentMethodId || null,
    description: normalizeText(values.description),
    notes: normalizeText(values.notes),
    is_active: values.isActive,
    status: values.status,
    trial_ends_on: normalizeDate(values.trialEndsOn),
    cancellation_effective_date: normalizeDate(values.cancellationEffectiveDate),
    monthly_alternative_price: normalizeOptionalNumber(values.monthlyAlternativePrice),
  };
}

export function buildSubscriptionUpdatePayload(
  values: SubscriptionFormValues
): SubscriptionUpdate {
  return {
    name: values.name.trim(),
    amount: Number(values.amount),
    currency: values.currency,
    billing_cycle: values.billingCycle,
    next_billing_date: values.nextBillingDate,
    category_id: values.categoryId || null,
    payment_method_id: values.paymentMethodId || null,
    description: normalizeText(values.description),
    notes: normalizeText(values.notes),
    is_active: values.isActive,
    status: values.status,
    trial_ends_on: normalizeDate(values.trialEndsOn),
    cancellation_effective_date: normalizeDate(values.cancellationEffectiveDate),
    monthly_alternative_price: normalizeOptionalNumber(values.monthlyAlternativePrice),
    updated_at: new Date().toISOString(),
  };
}

function normalizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeOptionalNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return Number(trimmed);
}
