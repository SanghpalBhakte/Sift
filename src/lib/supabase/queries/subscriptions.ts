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
  custom_interval_days,
  start_date,
  next_renewal_date,
  category_id,
  payment_method_id,
  status,
  is_trial,
  trial_end_date,
  reminder_offsets,
  value_rating,
  cancel_url,
  monthly_amount,
  created_at,
  updated_at,
  category:categories (
    id,
    name,
    slug,
    color,
    icon
  ),
  payment_method:payment_methods (
    id,
    name,
    type,
    last4,
    color,
    is_default
  )
`;

export const subscriptionsWithRelationsQuery = (userId: string) =>
  supabase
    .from("subscriptions")
    .select(subscriptionSelect)
    .eq("user_id", userId)
    .order("next_renewal_date", { ascending: true });

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
