import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, helperText, id, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label ? (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-foreground"
          >
            {label}
          </label>
        ) : null}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'sweep-input appearance-none pr-8 cursor-pointer bg-card',
              error && 'border-danger',
              className
            )}
            aria-invalid={error ? 'true' : undefined}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          {/* Chevron icon */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
        {error ? (
          <p className="text-[11px] text-danger leading-snug">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-muted-foreground leading-snug">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
