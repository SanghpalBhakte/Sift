import { supabase } from "@/lib/supabase/client";
import { mapCategoryToOption, mapPaymentMethodToOption } from "./mappers";

export async function fetchCategoryOptions() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
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
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load payment method options:", error);
    throw error;
  }

  return (data || []).map(mapPaymentMethodToOption);
}
