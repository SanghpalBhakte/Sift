import React from 'react';
import { Skeleton, MetricCardSkeleton, SubscriptionCardSkeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-5 max-w-xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Hero Spend Card Skeleton */}
      <div className="sweep-card p-5 sm:p-6 space-y-4 min-h-[148px]">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-24 rounded-md" />
          <Skeleton className="h-7 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-48 rounded-md" />
        <Skeleton className="h-3.5 w-60 rounded-md" />
      </div>

      {/* Category Chips Bar Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <Skeleton className="h-7 w-12 rounded-full shrink-0" />
        <Skeleton className="h-7 w-20 rounded-full shrink-0" />
        <Skeleton className="h-7 w-24 rounded-full shrink-0" />
        <Skeleton className="h-7 w-28 rounded-full shrink-0" />
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
