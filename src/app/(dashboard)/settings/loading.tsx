import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-xl mx-auto py-2 animate-in fade-in duration-150">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3.5 w-52" />
        </div>
      </div>

      {/* Settings Sections Skeleton */}
      <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-2.5 pb-2">
          <Skeleton className="w-5 h-5 rounded-md" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-2.5 pb-2">
          <Skeleton className="w-5 h-5 rounded-md" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
