import React from 'react';
import { Skeleton, MetricCardSkeleton } from '@/components/ui/Skeleton';

export default function InsightsLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 animate-in fade-in duration-150">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-3.5 w-60" />
        </div>
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* Metric Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      {/* Analytics Charts Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
        <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
