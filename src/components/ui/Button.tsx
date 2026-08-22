import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
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
    const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary:   'sweep-btn-primary',
      secondary: 'sweep-btn-secondary',
      ghost:     'sweep-btn-ghost',
      outline:   'sweep-btn-outline',
      danger:    'sweep-btn-danger',
    };

    const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
      xs:   'px-2.5 py-1 text-[11px] min-h-[1.75rem] rounded-sm gap-1',
      sm:   'px-3 py-1.5 text-xs min-h-[2rem] rounded-md gap-1.5',
      md:   'px-4 py-2 text-sm min-h-[2.5rem] rounded-btn gap-2',
      lg:   'px-5 py-2.5 text-sm min-h-[2.875rem] rounded-btn gap-2',
      icon: 'p-2 min-h-[2.25rem] min-w-[2.25rem] rounded-btn',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'sweep-btn font-medium transition-all inline-flex items-center justify-center',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
