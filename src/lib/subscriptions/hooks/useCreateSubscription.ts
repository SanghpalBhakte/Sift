import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSubscription } from "@/lib/subscriptions/api";
import { subscriptionKeys } from "@/lib/subscriptions/queryKeys";

export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSubscription,
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
            String(a.next_billing_date).localeCompare(String(b.next_billing_date))
          );
        }
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.list(variables.userId),
        }),
      ]);
    },
  });
}
