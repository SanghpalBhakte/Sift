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
  const variantStyles = {
    default: 'bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]',
    primary: 'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.25)]',
    accent: 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border border-[hsl(var(--primary)/0.2)]',
    success: 'bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))] border border-[hsl(var(--success)/0.25)]',
    warning: 'bg-[hsl(var(--warning-subtle))] text-[hsl(var(--warning))] border border-[hsl(var(--warning)/0.25)]',
    danger: 'bg-[hsl(var(--danger-subtle))] text-[hsl(var(--danger))] border border-[hsl(var(--danger)/0.25)]',
    outline: 'bg-transparent text-[hsl(var(--foreground))] border border-[hsl(var(--border))]',
    muted: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  return (
    <span
      className={cn(
        'sift-badge inline-flex items-center gap-1 rounded-full leading-none transition-colors',
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
