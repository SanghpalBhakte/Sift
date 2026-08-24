import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'accent' | 'outline' | 'muted';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
    default:  'bg-surface/80 text-muted-foreground border border-border/40',
    primary:  'bg-primary/10 text-primary border border-primary/15',
    accent:   'bg-accent/80 text-accent-foreground border border-primary/12',
    success:  'bg-success/10 text-success border border-success/15',
    warning:  'bg-warning/10 text-warning border border-warning/15',
    danger:   'bg-danger/10 text-danger border border-danger/15',
    outline:  'bg-transparent text-muted-foreground border border-border/50',
    muted:    'bg-surface/60 text-muted-foreground border border-border/30',
  };

  const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
    sm: 'text-[11px] px-1.5 py-0.5 font-medium',
    md: 'text-xs px-2 py-0.5 font-medium',
  };

  return (
    <span
      className={cn(
        'sweep-badge rounded-badge',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
