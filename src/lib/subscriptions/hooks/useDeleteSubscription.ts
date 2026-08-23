import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSubscription } from "@/lib/subscriptions/api";
import { subscriptionKeys } from "@/lib/subscriptions/queryKeys";

export function useDeleteSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubscription,
    onSuccess: async (_, variables) => {
      queryClient.setQueryData(
        subscriptionKeys.list(variables.userId),
        (current: any[] | undefined) => {
          if (!current) return [];
          return current.filter((item) => item.id !== variables.subscriptionId);
        }
      );

      queryClient.removeQueries({
        queryKey: subscriptionKeys.detail(
          variables.userId,
          variables.subscriptionId
        ),
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.list(variables.userId),
        }),
      ]);
    },
  });
}
