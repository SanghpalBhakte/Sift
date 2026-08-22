import React from 'react';
import { Skeleton, SubscriptionCardSkeleton } from '@/components/ui/Skeleton';

export default function SubscriptionsLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 animate-in fade-in duration-150">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-3.5 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Card List Skeleton */}
      <div className="space-y-2.5 pt-2">
        <SubscriptionCardSkeleton />
        <SubscriptionCardSkeleton />
        <SubscriptionCardSkeleton />
        <SubscriptionCardSkeleton />
      </div>
    </div>
  );
}
