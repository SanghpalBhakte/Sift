import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { subscriptionKeys } from "@/lib/subscriptions/queryKeys";
import { subscriptionSelect } from "@/lib/supabase/queries/subscriptions";

async function fetchSubscriptions(userId: string) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(subscriptionSelect)
    .eq("user_id", userId)
    .order("next_renewal_date", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export function useSubscriptions(userId: string | null | undefined) {
  return useQuery({
    queryKey: userId ? subscriptionKeys.list(userId) : subscriptionKeys.lists(),
    queryFn: () => fetchSubscriptions(userId as string),
    enabled: Boolean(userId),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
  });
}
