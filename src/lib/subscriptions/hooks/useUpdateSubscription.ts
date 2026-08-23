import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSubscription } from "@/lib/subscriptions/api";
import { subscriptionKeys } from "@/lib/subscriptions/queryKeys";
import { showSuccessToast } from "@/lib/toast/toast";

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSubscription,
    meta: {
      entity: "subscription",
      action: "update",
    },
    onSuccess: async (updated, variables) => {
      queryClient.setQueryData(
        subscriptionKeys.detail(variables.userId, variables.subscriptionId),
        updated
      );

      queryClient.setQueryData(
        subscriptionKeys.list(variables.userId),
        (current: any[] | undefined) => {
          if (!current) return [updated];
          return current
            .map((item) => (item.id === updated.id ? updated : item))
            .sort((a, b) =>
              String(a.next_renewal_date).localeCompare(String(b.next_renewal_date))
            );
        }
      );

      showSuccessToast("Subscription updated.");

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.detail(
            variables.userId,
            variables.subscriptionId
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.list(variables.userId),
        }),
      ]);
    },
  });
}
