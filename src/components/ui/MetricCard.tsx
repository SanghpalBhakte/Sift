import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface MetricCardProps {
  label: string;
  value: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  trend?: {
    text: string;
    type?: 'neutral' | 'positive' | 'warning' | 'accent';
  };
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MetricCard({
  label,
  value,
  subtitle,
  trend,
  icon,
  className,
  onClick,
}: MetricCardProps) {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={cn(
        'sift-card p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden transition-all',
        isClickable && 'sift-card-interactive cursor-pointer',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          {label}
        </span>
        {icon ? (
          <div className="text-[hsl(var(--muted-foreground))] opacity-75">
            {icon}
          </div>
        ) : null}
      </div>

      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          {value}
        </div>
        {subtitle ? (
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{subtitle}</p>
        ) : null}
      </div>

      {trend ? (
        <div className="mt-3 pt-2.5 border-t border-[hsl(var(--border))] flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'font-medium',
              trend.type === 'accent' && 'text-[hsl(var(--primary))]',
              trend.type === 'positive' && 'text-[hsl(var(--success))]',
              trend.type === 'warning' && 'text-[hsl(var(--warning))]',
              (!trend.type || trend.type === 'neutral') && 'text-[hsl(var(--muted-foreground))]'
            )}
          >
            {trend.text}
          </span>
        </div>
      ) : null}
    </div>
  );
}
