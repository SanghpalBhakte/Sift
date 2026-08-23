import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { subscriptionKeys } from "@/lib/subscriptions/queryKeys";
import {
  mapCategoryToOption,
  mapPaymentMethodToOption,
} from "@/lib/subscriptions/mappers";
import type { CategoryRow, PaymentMethodRow } from "@/lib/subscriptions/types";

async function fetchCategories(userId?: string | null): Promise<CategoryRow[]> {
  let query = supabase
    .from("categories")
    .select("id, slug, name, color, icon, created_at, user_id");

  if (userId) {
    query = query.or(`user_id.is.null,user_id.eq.${userId}`);
  } else {
    query = query.is("user_id", null);
  }

  const { data, error } = await query.order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as unknown as CategoryRow[]) ?? [];
}

async function fetchPaymentMethods(userId?: string | null): Promise<PaymentMethodRow[]> {
  let query = supabase
    .from("payment_methods")
    .select("id, user_id, name, type, last4, color, is_default, created_at")
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data as unknown as PaymentMethodRow[]) ?? [];
}

export function useSubscriptionLookups(userId?: string | null) {
  const categoriesQuery = useQuery({
    queryKey: subscriptionKeys.categories(userId),
    queryFn: () => fetchCategories(userId),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  const paymentMethodsQuery = useQuery({
    queryKey: subscriptionKeys.paymentMethods(userId),
    queryFn: () => fetchPaymentMethods(userId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const categoryOptions = useMemo(
    () => (categoriesQuery.data ?? []).map(mapCategoryToOption),
    [categoriesQuery.data]
  );

  const paymentMethodOptions = useMemo(
    () => (paymentMethodsQuery.data ?? []).map(mapPaymentMethodToOption),
    [paymentMethodsQuery.data]
  );

  return {
    categories: categoriesQuery.data ?? [],
    paymentMethods: paymentMethodsQuery.data ?? [],
    categoryOptions,
    paymentMethodOptions,
    hasPaymentMethods: (paymentMethodsQuery.data ?? []).length > 0,
    isLoading: categoriesQuery.isLoading || paymentMethodsQuery.isLoading,
    isFetching: categoriesQuery.isFetching || paymentMethodsQuery.isFetching,
    isError: categoriesQuery.isError || paymentMethodsQuery.isError,
    error: categoriesQuery.error ?? paymentMethodsQuery.error ?? null,
    refetchAll: async () => {
      await Promise.all([
        categoriesQuery.refetch(),
        paymentMethodsQuery.refetch(),
      ]);
    },
  };
}
