import React from 'react';
import { Skeleton, MetricCardSkeleton, SubscriptionCardSkeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-xl mx-auto py-2 animate-in fade-in duration-150">
      {/* Hero Spend Card Skeleton */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-3 w-64" />
      </div>

      {/* Category Chips Bar Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <Skeleton className="h-8 w-14 rounded-md shrink-0" />
        <Skeleton className="h-8 w-24 rounded-md shrink-0" />
        <Skeleton className="h-8 w-20 rounded-md shrink-0" />
        <Skeleton className="h-8 w-28 rounded-md shrink-0" />
      </div>

      {/* Subscription Cards Skeleton List */}
      <div className="space-y-2.5 pt-1">
        <SubscriptionCardSkeleton />
        <SubscriptionCardSkeleton />
        <SubscriptionCardSkeleton />
      </div>
    </div>
  );
}
