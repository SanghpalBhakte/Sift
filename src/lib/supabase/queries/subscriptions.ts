import type { QueryData } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export const subscriptionSelect = `
  id,
  user_id,
  name,
  description,
  notes,
  amount,
  currency,
  billing_cycle,
  next_billing_date,
  category_id,
  payment_method_id,
  is_active,
  status,
  trial_ends_on,
  cancellation_effective_date,
  monthly_alternative_price,
  created_at,
  updated_at,
  category:categories (
    id,
    name,
    slug
  ),
  payment_method:payment_methods (
    id,
    name,
    slug
  )
`;

export const subscriptionsWithRelationsQuery = (userId: string) =>
  supabase
    .from("subscriptions")
    .select(subscriptionSelect)
    .eq("user_id", userId)
    .order("next_billing_date", { ascending: true });

export const subscriptionByIdQuery = (userId: string, subscriptionId: string) =>
  supabase
    .from("subscriptions")
    .select(subscriptionSelect)
    .eq("user_id", userId)
    .eq("id", subscriptionId)
    .single();

export type SubscriptionsWithRelations = QueryData<
  ReturnType<typeof subscriptionsWithRelationsQuery>
>;
