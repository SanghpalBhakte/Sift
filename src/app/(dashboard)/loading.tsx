import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="space-y-5 max-w-xl mx-auto pb-12 animate-in fade-in duration-100">
      {/* 1. Hero Spend Card Skeleton (exact layout geometry to prevent CLS and speed up LCP) */}
      <div className="sweep-card p-5 sm:p-6 space-y-4 min-h-[148px]">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">
            Total Spend
          </span>

          <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-lg text-xs">
            <span className="px-2.5 py-1 rounded-md font-medium text-foreground bg-card shadow-xs">
              Monthly
            </span>
            <span className="px-2.5 py-1 rounded-md font-medium text-muted-foreground">
              Yearly
            </span>
          </div>
        </div>

        {/* Hero Spend Figure Skeleton with stable typography container */}
        <div className="min-h-[58px]">
          <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground tabular-nums flex items-baseline">
            <span className="opacity-40 animate-pulse font-mono">$0.00</span>
            <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1.5 font-sans">
              /month
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 min-h-[16px]">
            <span className="opacity-50">Calculating recurring commitments...</span>
          </p>
        </div>
      </div>

      {/* 2. Category Filter Chips Skeleton */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <span className="text-xs font-semibold text-foreground">Subscriptions</span>
          <span className="text-[11px] text-muted-foreground">View ledger</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 whitespace-nowrap">
          {[56, 84, 96, 108].map((w, i) => (
            <div
              key={i}
              className="skeleton rounded-lg shrink-0"
              style={{ width: `${w}px`, height: '30px' }}
            />
          ))}
        </div>
      </div>

      {/* 3. Subscription Card Skeletons */}
      <div className="space-y-2.5 pt-0.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton sweep-card"
            style={{
              height: '72px',
              borderRadius: '12px',
            }}
          />
        ))}
      </div>
    </div>
  );
}
