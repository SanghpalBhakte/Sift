export const subscriptionKeys = {
  all: ["subscriptions"] as const,

  lookups: () => [...subscriptionKeys.all, "lookups"] as const,
  categories: (userId?: string | null) =>
    [...subscriptionKeys.lookups(), "categories", userId ?? "global"] as const,
  paymentMethods: (userId?: string | null) =>
    [...subscriptionKeys.lookups(), "payment-methods", userId ?? "anon"] as const,

  lists: () => [...subscriptionKeys.all, "list"] as const,
  list: (userId: string) => [...subscriptionKeys.lists(), userId] as const,

  details: () => [...subscriptionKeys.all, "detail"] as const,
  detail: (userId: string, subscriptionId: string) =>
    [...subscriptionKeys.details(), userId, subscriptionId] as const,
};
