export const subscriptionKeys = {
  all: ["subscriptions"] as const,

  lookups: () => [...subscriptionKeys.all, "lookups"] as const,
  categories: () => [...subscriptionKeys.lookups(), "categories"] as const,
  paymentMethods: () => [...subscriptionKeys.lookups(), "payment-methods"] as const,

  lists: () => [...subscriptionKeys.all, "list"] as const,
  list: (userId: string) => [...subscriptionKeys.lists(), userId] as const,

  details: () => [...subscriptionKeys.all, "detail"] as const,
  detail: (userId: string, subscriptionId: string) =>
    [...subscriptionKeys.details(), userId, subscriptionId] as const,
};
