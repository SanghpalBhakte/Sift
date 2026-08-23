import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSubscription } from "@/lib/subscriptions/api";
import { subscriptionKeys } from "@/lib/subscriptions/queryKeys";
import { showSuccessToast } from "@/lib/toast/toast";

export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSubscription,
    meta: {
      entity: "subscription",
      action: "create",
    },
    onSuccess: async (created, variables) => {
      queryClient.setQueryData(
        subscriptionKeys.detail(variables.userId, created.id),
        created
      );

      queryClient.setQueryData(
        subscriptionKeys.list(variables.userId),
        (current: any[] | undefined) => {
          if (!current) return [created];
          const exists = current.some((item) => item.id === created.id);
          if (exists) {
            return current.map((item) => (item.id === created.id ? created : item));
          }
          return [...current, created].sort((a, b) =>
            String(a.next_renewal_date).localeCompare(String(b.next_renewal_date))
          );
        }
      );

      showSuccessToast("Subscription added.");

      await queryClient.invalidateQueries({
        queryKey: subscriptionKeys.list(variables.userId),
      });
    },
  });
}
