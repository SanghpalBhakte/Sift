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
    label: row.last4 ? `${row.name} (•••• ${row.last4})` : row.name,
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
    nextBillingDate: row.next_renewal_date,
    categoryId: row.category_id,
    categoryName: category?.name ?? "None / Unassigned",
    paymentMethodId: row.payment_method_id,
    paymentMethodName: paymentMethod
      ? paymentMethod.last4
        ? `${paymentMethod.name} (•••• ${paymentMethod.last4})`
        : paymentMethod.name
      : "None / Unassigned",
    description: row.description ?? "",
    notes: row.notes ?? "",
    isActive: row.status === "active",
    status: row.status,
    trialEndsOn: row.trial_end_date,
    cancellationEffectiveDate: null,
    monthlyAlternativePrice: null,
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
    nextBillingDate: row.next_renewal_date ?? "",
    categoryId: row.category_id ?? null,
    paymentMethodId: row.payment_method_id ?? null,
    description: row.description ?? "",
    notes: row.notes ?? "",
    isActive: row.status === "active",
    status: row.status ?? "active",
    trialEndsOn: row.trial_end_date ?? null,
    cancellationEffectiveDate: null,
    monthlyAlternativePrice: "",
  };
}

export function buildSubscriptionInsertPayload(params: {
  userId: string;
  values: SubscriptionFormValues;
}): SubscriptionInsert {
  const { userId, values } = params;
  const amount = Number(values.amount);
  const monthlyAmount =
    values.billingCycle === "yearly" ? amount / 12 : amount;

  return {
    user_id: userId,
    name: values.name.trim(),
    amount,
    currency: values.currency,
    billing_cycle: values.billingCycle,
    custom_interval_days: null,
    start_date: new Date().toISOString().split("T")[0],
    next_renewal_date: values.nextBillingDate,
    category_id: values.categoryId || null,
    payment_method_id: values.paymentMethodId || null,
    description: normalizeText(values.description),
    notes: normalizeText(values.notes),
    status: values.status,
    is_trial: Boolean(values.trialEndsOn),
    trial_end_date: normalizeDate(values.trialEndsOn),
    reminder_offsets: [3, 1],
    value_rating: "useful",
    cancel_url: null,
    monthly_amount: monthlyAmount,
  };
}

export function buildSubscriptionUpdatePayload(
  values: SubscriptionFormValues
): SubscriptionUpdate {
  const amount = Number(values.amount);
  const monthlyAmount =
    values.billingCycle === "yearly" ? amount / 12 : amount;

  return {
    name: values.name.trim(),
    amount,
    currency: values.currency,
    billing_cycle: values.billingCycle,
    custom_interval_days: null,
    start_date: undefined,
    next_renewal_date: values.nextBillingDate,
    category_id: values.categoryId || null,
    payment_method_id: values.paymentMethodId || null,
    description: normalizeText(values.description),
    notes: normalizeText(values.notes),
    status: values.status,
    is_trial: Boolean(values.trialEndsOn),
    trial_end_date: normalizeDate(values.trialEndsOn),
    reminder_offsets: [3, 1],
    value_rating: "useful",
    cancel_url: null,
    monthly_amount: monthlyAmount,
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
