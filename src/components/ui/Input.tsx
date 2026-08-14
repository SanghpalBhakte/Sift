import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-[hsl(var(--foreground))]"
          >
            {label}
          </label>
        ) : null}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'sift-input',
            error && 'border-[hsl(var(--danger))] focus:border-[hsl(var(--danger))] focus:ring-[hsl(var(--danger)/0.2)]',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-[11px] text-[hsl(var(--danger))]">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
