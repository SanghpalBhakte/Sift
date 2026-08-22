import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
}

export function Alert({
  className,
  variant = 'default',
  children,
  ...props
}: AlertProps) {
  const variantStyles = {
    default: 'bg-surface text-foreground border-border',
    destructive: 'bg-danger-subtle text-danger border-danger/30 [&>svg]:text-danger',
    success: 'bg-success-subtle text-success border-success/30 [&>svg]:text-success',
    warning: 'bg-warning-subtle text-warning border-warning/30 [&>svg]:text-warning',
    info: 'bg-primary/5 text-primary border-primary/20 [&>svg]:text-primary',
  };

  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-xl border p-3.5 text-xs leading-relaxed flex items-start gap-2.5 shadow-xs',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={cn('font-semibold text-xs leading-none tracking-tight mb-1', className)}
      {...props}
    >
      {children}
    </h5>
  );
}

export function AlertDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn('text-xs opacity-90 leading-normal', className)}
      {...props}
    >
      {children}
    </div>
  );
}
