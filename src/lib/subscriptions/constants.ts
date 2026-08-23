import type { BillingCycle, SubscriptionStatus } from "./types";

export const DEFAULT_CURRENCY = "INR";
export const NONE_OPTION_VALUE = "";

export const BILLING_CYCLE_OPTIONS: Array<{ value: BillingCycle; label: string }> = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly (Annual)" },
];

export const STATUS_OPTIONS: Array<{ value: SubscriptionStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "cancelled", label: "Cancelled" },
  { value: "trial", label: "Trial" },
];

export const EMPTY_SUBSCRIPTION_FORM: import("./types").SubscriptionFormValues = {
  name: "",
  amount: "",
  currency: DEFAULT_CURRENCY,
  billingCycle: "monthly",
  nextBillingDate: "",
  categoryId: null,
  paymentMethodId: null,
  description: "",
  notes: "",
  isActive: true,
  status: "active",
  trialEndsOn: null,
  cancellationEffectiveDate: null,
  monthlyAlternativePrice: "",
};
