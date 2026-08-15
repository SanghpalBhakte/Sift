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
    default:  'bg-surface text-muted-foreground border border-border',
    primary:  'bg-primary/10 text-primary border border-primary/20',
    accent:   'bg-accent text-accent-foreground border border-primary/15',
    success:  'bg-success-subtle text-success border border-success/20',
    warning:  'bg-warning-subtle text-warning border border-warning/20',
    danger:   'bg-danger-subtle text-danger border border-danger/20',
    outline:  'bg-transparent text-foreground border border-border',
    muted:    'bg-muted text-muted-foreground border border-transparent',
  };

  const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-[11px] px-2 py-0.5',
  };

  return (
    <span
      className={cn(
        'sift-badge rounded-badge',
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
