import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary: 'sift-btn-primary',
      secondary: 'sift-btn-secondary',
      ghost: 'sift-btn-ghost',
      danger: 'sift-btn-danger',
      outline: 'bg-transparent border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface))]',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs min-h-[2rem] rounded-md',
      md: 'px-4 py-2 text-sm min-h-[2.5rem] rounded-lg',
      lg: 'px-5 py-2.5 text-base min-h-[3rem] rounded-lg',
      icon: 'p-2 min-h-[2.25rem] min-w-[2.25rem] rounded-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'sift-btn font-medium transition-all inline-flex items-center justify-center gap-2',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
