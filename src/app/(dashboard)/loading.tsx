import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="space-y-5 max-w-xl mx-auto pb-12 animate-in fade-in duration-100">
      {/* Hero Spend Card Skeleton with explicit dimensions */}
      <div
        className="skeleton sweep-card p-5 sm:p-6 space-y-4"
        style={{
          minHeight: '148px',
          borderRadius: '16px',
          marginBottom: '1.25rem',
        }}
      />

      {/* Category Chips Bar Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {[48, 80, 96, 112].map((w, i) => (
          <div
            key={i}
            className="skeleton rounded-full shrink-0"
            style={{ width: `${w}px`, height: '28px' }}
          />
        ))}
      </div>

      {/* Subscription Card Row Skeletons */}
      <div className="space-y-2.5 pt-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton sweep-card"
            style={{
              height: '72px',
              borderRadius: '12px',
              marginBottom: '0.625rem',
            }}
          />
        ))}
      </div>
    </div>
  );
}
