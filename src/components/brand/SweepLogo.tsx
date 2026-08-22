'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface SweepIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  opticalSize?: 'favicon' | 'standard' | 'large';
  variant?: 'outline' | 'solid';
}

/**
 * Sweep Receipt Fold Mark
 * 
 * An intentional geometric paper / receipt slip silhouette with a clean
 * 45° corner fold and a subtle flowing 'S' curve carved in negative space.
 * 
 * - Standard/Large: Shows the full tactile folded tab + sweeping S-curve.
 * - Favicon (16px/32px): Optimizes stroke thickness and optical counter-space
 *   for razor-sharp legibility at micro scales.
 */
export function SweepIcon({
  size = 24,
  opticalSize = 'standard',
  variant = 'outline',
  className,
  ...props
}: SweepIconProps) {
  const numericSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 24;
  const isFavicon = opticalSize === 'favicon' || numericSize <= 18;

  if (isFavicon) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('shrink-0 select-none', className)}
        aria-label="Sweep logo"
        {...props}
      >
        {/* Simplified high-contrast 16px paper slip */}
        <path
          d="M2.5 1.5C1.95 1.5 1.5 1.95 1.5 2.5V13.5C1.5 14.05 1.95 14.5 2.5 14.5H13.5C14.05 14.5 14.5 14.05 14.5 13.5V6L10 1.5H2.5Z"
          fill="currentColor"
          fillOpacity="0.16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Bold 16px corner fold */}
        <path
          d="M10 1.5V5.5C10 5.78 10.22 6 10.5 6H14.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Bold high-clarity 16px S spine */}
        <path
          d="M11 7.5C10 6.8 8.8 6.5 7.5 7C6.2 7.5 5.5 8.8 5.8 10C6.2 11.2 7.8 11.8 9.5 12.2C11.2 12.6 12 13.2 11.8 14.2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none', className)}
      aria-label="Sweep logo"
      {...props}
    >
      {/* Tactile Receipt Paper Silhouette */}
      <path
        d="M6 3.5C4.62 3.5 3.5 4.62 3.5 6V26C3.5 27.38 4.62 28.5 6 28.5H26C27.38 28.5 28.5 27.38 28.5 26V11.5L20.5 3.5H6Z"
        fill="currentColor"
        fillOpacity={variant === 'solid' ? '0.22' : '0.12'}
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinejoin="round"
      />

      {/* Distinct 45° Corner Fold Notch */}
      <path
        d="M20.5 3.5V10.5C20.5 11.05 20.95 11.5 21.5 11.5H28.5"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Internal Flowing 'S' Curve Negative Space / Crease */}
      <path
        d="M22 14.5C20.2 13 17.2 12.5 14.5 13.2C11.5 14 9.8 16.5 10.2 19C10.8 21.5 14.2 22.6 17.8 23.2C21.5 23.8 23.5 25.2 23 27.2C22.2 29.5 19 30 15.8 29.2C12.8 28.5 10.8 27 9.8 25.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface SweepLogoProps {
  variant?: 'full' | 'icon' | 'wordmark' | 'compact' | 'reversed' | 'monochrome';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  showTagline?: boolean;
}

/**
 * Sweep Brand Logo Component
 * 
 * Complete logo system for Sweep:
 * - 'full': Icon mark + Fraunces title-case serif wordmark (Desktop headers, marketing)
 * - 'compact': Icon + bold title wordmark without tagline
 * - 'icon': Isolated app mark inside a soft rounded plum/cream container
 * - 'wordmark': Typography-only editorial serif
 * - 'reversed': Ivory on rich plum background
 * - 'monochrome': Flat single-color version
 */
export function SweepLogo({
  variant = 'full',
  size = 'md',
  className,
  showTagline = false,
}: SweepLogoProps) {
  const iconSizes = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    hero: 44,
  };

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl sm:text-3xl',
    hero: 'text-4xl sm:text-5xl',
  };

  // 1. Icon Only
  if (variant === 'icon') {
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground p-2 shadow-xs shrink-0 transition-transform active:scale-95',
          className
        )}
      >
        <SweepIcon size={iconSizes[size]} />
      </div>
    );
  }

  // 2. Wordmark Only
  if (variant === 'wordmark') {
    return (
      <span
        className={cn(
          'font-serif font-bold tracking-tight text-foreground select-none leading-none',
          textSizes[size],
          className
        )}
      >
        Sweep
      </span>
    );
  }

  // 3. Reversed Mark (for dark/plum containers)
  if (variant === 'reversed') {
    return (
      <div className={cn('inline-flex items-center gap-2.5 select-none text-[#FCF9F3]', className)}>
        <div className="inline-flex items-center justify-center rounded-xl bg-[#FCF9F3]/15 text-[#FCF9F3] p-1.5 shadow-xs shrink-0">
          <SweepIcon size={iconSizes[size]} />
        </div>
        <span className={cn('font-serif font-bold tracking-tight text-[#FCF9F3] leading-none', textSizes[size])}>
          Sweep
        </span>
      </div>
    );
  }

  // 4. Monochrome Mark
  if (variant === 'monochrome') {
    return (
      <div className={cn('inline-flex items-center gap-2.5 select-none text-current', className)}>
        <SweepIcon size={iconSizes[size]} />
        <span className={cn('font-serif font-bold tracking-tight text-current leading-none', textSizes[size])}>
          Sweep
        </span>
      </div>
    );
  }

  // 5. Full & Compact Lockups (Default)
  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground p-1.5 shadow-xs shrink-0 transition-transform active:scale-95'
        )}
      >
        <SweepIcon size={iconSizes[size]} />
      </div>

      <div className="flex flex-col justify-center">
        <span
          className={cn(
            'font-serif font-bold tracking-tight text-foreground leading-none',
            textSizes[size]
          )}
        >
          Sweep
        </span>
        {showTagline && (
          <span className="text-[11px] font-sans font-medium text-muted-foreground tracking-normal mt-0.5">
            Your recurring life, in one clear view
          </span>
        )}
      </div>
    </div>
  );
}
