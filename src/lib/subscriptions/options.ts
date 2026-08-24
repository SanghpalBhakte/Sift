import { supabase } from "@/lib/supabase/client";
import { mapCategoryToOption, mapPaymentMethodToOption } from "./mappers";

export async function fetchCategoryOptions() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, user_id, name, slug, color, icon, created_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load category options:", error);
    throw error;
  }

  return (data || []).map(mapCategoryToOption);
}

export async function fetchPaymentMethodOptions() {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("id, user_id, name, type, last4, color, is_default, created_at")
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load payment method options:", error);
    throw error;
  }

  return (data || []).map(mapPaymentMethodToOption);
}
