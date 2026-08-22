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
        'sweep-card p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden transition-all',
        isClickable && 'sweep-card-interactive cursor-pointer',
        className
      )}
    >
      {/* Label row */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {icon ? (
          <div className="text-muted-foreground opacity-60 shrink-0">{icon}</div>
        ) : null}
      </div>

      {/* Value */}
      <div className="space-y-0.5">
        <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground tabular-nums leading-none">
          {value}
        </div>
        {subtitle ? (
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{subtitle}</p>
        ) : null}
      </div>

      {/* Trend */}
      {trend ? (
        <div className="mt-3 pt-2.5 border-t border-border flex items-center gap-1.5 text-[11px]">
          <span
            className={cn(
              'font-medium',
              trend.type === 'accent'   && 'text-primary',
              trend.type === 'positive' && 'text-success',
              trend.type === 'warning'  && 'text-warning',
              (!trend.type || trend.type === 'neutral') && 'text-muted-foreground'
            )}
          >
            {trend.text}
          </span>
        </div>
      ) : null}
    </div>
  );
}
