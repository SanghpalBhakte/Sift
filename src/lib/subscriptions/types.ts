import type { Database } from "@/lib/supabase/database.types";

export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
export type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];

export type PaymentMethodRow =
  Database["public"]["Tables"]["payment_methods"]["Row"];
export type PaymentMethodInsert =
  Database["public"]["Tables"]["payment_methods"]["Insert"];
export type PaymentMethodUpdate =
  Database["public"]["Tables"]["payment_methods"]["Update"];

export type SubscriptionRow =
  Database["public"]["Tables"]["subscriptions"]["Row"];
export type SubscriptionInsert =
  Database["public"]["Tables"]["subscriptions"]["Insert"];
export type SubscriptionUpdate =
  Database["public"]["Tables"]["subscriptions"]["Update"];

export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "paused" | "canceled" | "archived";

export type SelectOption = {
  value: string;
  label: string;
};

export type SubscriptionFormValues = {
  name: string;
  amount: string;
  currency: string;
  billingCycle: BillingCycle;
  nextBillingDate: string;
  categoryId: string | null;
  paymentMethodId: string | null;
  description: string;
  notes: string;
  isActive: boolean;
  status: SubscriptionStatus;
  trialEndsOn: string | null;
  cancellationEffectiveDate: string | null;
  monthlyAlternativePrice: string;
};

export type SubscriptionWithRelations = SubscriptionRow & {
  category: Pick<CategoryRow, "id" | "name" | "slug" | "color" | "icon"> | null;
  payment_method: Pick<PaymentMethodRow, "id" | "name" | "type" | "last4" | "color" | "is_default"> | null;
};

export type SubscriptionDisplay = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  nextBillingDate: string;
  categoryId: string | null;
  categoryName: string;
  paymentMethodId: string | null;
  paymentMethodName: string;
  description: string;
  notes: string;
  isActive: boolean;
  status: SubscriptionStatus;
  trialEndsOn: string | null;
  cancellationEffectiveDate: string | null;
  monthlyAlternativePrice: number | null;
};
