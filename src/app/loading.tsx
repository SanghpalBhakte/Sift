import React from 'react';
import { SweepLogo } from '@/components/brand/SweepLogo';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 transition-colors animate-in fade-in duration-200">
      <div className="flex flex-col items-center space-y-3 text-center">
        <SweepLogo variant="icon" size="md" className="shadow-xs animate-pulse" />
        <span className="font-serif text-lg font-bold tracking-tight text-foreground/80">
          Sweep
        </span>
        <div className="w-24 h-1 rounded-full skeleton" />
      </div>
    </div>
  );
}
