import React from 'react';
import { cn } from '@/lib/utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-surface-muted',
        className
      )}
      {...props}
    />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="sweep-card p-4 sm:p-5 space-y-3">
      <Skeleton className="h-2.5 w-20" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-2 w-32" />
    </div>
  );
}

export function SubscriptionCardSkeleton() {
  return (
    <div className="sweep-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-12 rounded-badge" />
          </div>
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-2.5 w-36" />
        </div>
        <div className="space-y-2 flex flex-col items-end">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
    </div>
  );
}
