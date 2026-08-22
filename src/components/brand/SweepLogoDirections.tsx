'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export type LogoDirectionId = 'ledger-arc' | 'receipt-fold' | 'cadence-notch' | 'monogram-crest';

export interface LogoDirectionInfo {
  id: LogoDirectionId;
  name: string;
  subtitle: string;
  concept: string;
  metaphor: string;
  visualHook: string;
  bestFor: string;
}

export const LOGO_DIRECTIONS: LogoDirectionInfo[] = [
  {
    id: 'ledger-arc',
    name: 'Direction 1: The Ledger Arc',
    subtitle: 'Continuous Recurring Flow & Fluid Motion',
    concept: 'A fluid, continuous calligraphy arc transitioning into an "S" cadence that mimics an open ledger page turning. Represents soft motion, cyclical renewal rhythms, and clearing clutter in one seamless stroke.',
    metaphor: 'The clean sweep across the ledger; recurring cycle turned into calm geometry.',
    visualHook: 'High-contrast tapered bezier curve with organic sweeping inertia.',
    bestFor: 'Modern editorial SaaS, fluid mobile PWA experience, distinctive silhouette at 16px–512px.',
  },
  {
    id: 'receipt-fold',
    name: 'Direction 2: The Receipt Fold',
    subtitle: 'Tactile Paper & Cataloged Clarity',
    concept: 'Drawing directly from tactile stationery, receipt folds, and index tabs. Represents organizing individual subscription slips into neat, crisp alignment.',
    metaphor: 'A crisp receipt neatly cataloged; physical tidiness translated into digital clarity.',
    visualHook: 'Clean paper square with a 45° folded corner tab in rich plum and a notched S-profile.',
    bestFor: 'Portfolio-grade tactile aesthetic, stationery-inspired dashboard, high-legibility app icon.',
  },
  {
    id: 'cadence-notch',
    name: 'Direction 3: The Cadence Notch',
    subtitle: 'Recurring Pulses & Swept Horizon',
    concept: 'Visualizes the periodic rhythm of monthly/annual renewals as a sequence of three refined vertical ledger marks swept across by a rising curved horizon line.',
    metaphor: 'Subscriptions coming into rhythm and alignment; bringing order to the calendar.',
    visualHook: 'Three harmonic vertical ink bars intersected by a dynamic parabolic sweep stroke.',
    bestFor: 'Data-driven visual identity, recurring calendar clarity, structured financial dashboards.',
  },
  {
    id: 'monogram-crest',
    name: 'Direction 4: The Monogram Crest',
    subtitle: 'Personal Stewardship & Editorial Craft',
    concept: 'A bespoke monogram combining a classical serif "S" with a stylized quill/stamp sweep stroke, housed inside a soft squircle stamp. Evokes bespoke personal accounting and quiet luxury.',
    metaphor: 'Bespoke personal stewardship; deliberate, craft-focused clarity.',
    visualHook: 'Refined serif S with high stroke contrast enclosed in a soft-edged double rule squircle.',
    bestFor: 'Quiet luxury positioning, personalized private ledger, premium craftsmanship.',
  },
];

// =============================================================================
// Direction 1: The Ledger Arc SVG
// =============================================================================
export function SweepIconLedgerArc({
  size = 28,
  className,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden="true"
      {...props}
    >
      {/* Primary Sweeping S-Curve */}
      <path
        d="M27.5 8C24.8 5.2 20.2 4.2 16 5.2C10.5 6.5 6.5 11.2 7.2 17C7.8 22 12.8 25 19 26.2C24.2 27.2 29 28.5 28.2 31.5C27.5 33.8 23.5 35 18.5 34.2C13.8 33.5 9.5 31.8 7.8 30"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dynamic Central Sweeping Cross-Arc */}
      <path
        d="M19.5 12.5C23.2 12.5 28 14 29.2 17.5C30.5 21.2 26.2 24.2 21.5 24.8C16.2 25.5 11.5 24.2 10.2 21.2"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.88"
      />
    </svg>
  );
}

// =============================================================================
// Direction 2: The Receipt Fold SVG
// =============================================================================
export function SweepIconReceiptFold({
  size = 28,
  className,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden="true"
      {...props}
    >
      {/* Paper Sheet Body with Notched Corners */}
      <path
        d="M7 6C7 4.89543 7.89543 4 9 4H23L29 10V30C29 31.1046 28.1046 32 27 32H9C7.89543 32 7 31.1046 7 30V6Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Folded Top-Right Corner Tab */}
      <path
        d="M23 4V9C23 9.55228 23.4477 10 24 10H29"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner Sweeping Ledger S Line */}
      <path
        d="M23 15.5C21.5 14 18.5 13.5 16 14.2C13.2 15 11.5 17.2 12 19.5C12.5 21.8 15.5 22.8 19 23.5C22.5 24.2 24.5 25.5 24 27.5C23.5 29.5 20.5 30 17.5 29.5C15 29 13 28 12 27"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// =============================================================================
// Direction 3: The Cadence Notch SVG
// =============================================================================
export function SweepIconCadenceNotch({
  size = 28,
  className,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden="true"
      {...props}
    >
      {/* 3 Rhythmic Vertical Renewal Bars */}
      <line x1="11" y1="12" x2="11" y2="28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="18" y1="7" x2="18" y2="31" stroke="currentColor" strokeWidth="3.25" strokeLinecap="round" />
      <line x1="25" y1="14" x2="25" y2="26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      
      {/* Rising Parabolic Sweep Arc */}
      <path
        d="M5 29C8.5 26.5 13 21 18 18C23 15 28.5 10.5 31 7"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

// =============================================================================
// Direction 4: The Monogram Crest SVG
// =============================================================================
export function SweepIconMonogramCrest({
  size = 28,
  className,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden="true"
      {...props}
    >
      {/* Squircle Outer Border */}
      <rect
        x="3.5"
        y="3.5"
        width="29"
        height="29"
        rx="9"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.08"
      />
      {/* High-Contrast Editorial Serif Monogram S */}
      <path
        d="M23.5 12C22.2 10.2 19.8 9.5 17.5 9.5C13.8 9.5 11 11.8 11 14.8C11 18.2 14.5 19.8 18.5 21C22.5 22.2 25 24 25 27.2C25 30.8 21.8 33 17.5 33C13.5 33 10.8 31 9.5 28.5"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Serif Terminal Accents */}
      <circle cx="24" cy="12" r="1.25" fill="currentColor" />
      <circle cx="9.5" cy="28.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

// =============================================================================
// Dynamic Direction Renderer Component
// =============================================================================
export function SweepLogoDirectionRenderer({
  direction = 'ledger-arc',
  size = 'md',
  showWordmark = true,
  showTagline = false,
  className,
}: {
  direction?: LogoDirectionId;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showWordmark?: boolean;
  showTagline?: boolean;
  className?: string;
}) {
  const iconPixelSizes = {
    sm: 20,
    md: 26,
    lg: 36,
    hero: 52,
  };

  const textClassSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl sm:text-3xl',
    hero: 'text-4xl sm:text-5xl',
  };

  const renderIcon = (d: LogoDirectionId, s: number) => {
    switch (d) {
      case 'ledger-arc':
        return <SweepIconLedgerArc size={s} />;
      case 'receipt-fold':
        return <SweepIconReceiptFold size={s} />;
      case 'cadence-notch':
        return <SweepIconCadenceNotch size={s} />;
      case 'monogram-crest':
        return <SweepIconMonogramCrest size={s} />;
    }
  };

  return (
    <div className={cn('inline-flex items-center gap-3 select-none', className)}>
      <div className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground p-2 shadow-xs shrink-0 transition-transform">
        {renderIcon(direction, iconPixelSizes[size])}
      </div>

      {showWordmark && (
        <div className="flex flex-col">
          <span className={cn('font-serif font-bold tracking-tight text-foreground leading-none', textClassSizes[size])}>
            Sweep
          </span>
          {showTagline && (
            <span className="text-[11px] font-sans font-medium text-muted-foreground tracking-normal mt-1">
              Your recurring life, in one clear view
            </span>
          )}
        </div>
      )}
    </div>
  );
}
