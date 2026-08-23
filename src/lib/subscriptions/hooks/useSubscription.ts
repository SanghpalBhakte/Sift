import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { subscriptionKeys } from "@/lib/subscriptions/queryKeys";
import { subscriptionSelect } from "@/lib/supabase/queries/subscriptions";

async function fetchSubscription(userId: string, subscriptionId: string) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(subscriptionSelect)
    .eq("user_id", userId)
    .eq("id", subscriptionId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function useSubscription(
  userId: string | null | undefined,
  subscriptionId: string | null | undefined
) {
  return useQuery({
    queryKey:
      userId && subscriptionId
        ? subscriptionKeys.detail(userId, subscriptionId)
        : subscriptionKeys.details(),
    queryFn: () => fetchSubscription(userId as string, subscriptionId as string),
    enabled: Boolean(userId && subscriptionId),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
  });
}
