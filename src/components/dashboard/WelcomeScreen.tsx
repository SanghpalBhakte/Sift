'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { SweepLogo } from '../brand/SweepLogo';
import { Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onRestoreClick?: () => void;
}

export function WelcomeScreen({ onRestoreClick }: WelcomeScreenProps) {
  return (
    <div className="min-h-[calc(100vh-14rem)] flex flex-col items-center justify-center text-center px-4 py-8 sm:py-12 max-w-sm mx-auto animate-in fade-in duration-300">
      {/* Sweep Wordmark & Icon */}
      <div className="flex flex-col items-center mb-2">
        <SweepLogo variant="icon" size="lg" className="mb-4 shadow-sm" />
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Sweep
        </h1>
      </div>

      {/* Supporting Line */}
      <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-8 font-normal leading-relaxed">
        Your recurring life, in one clear view. Nothing sneaks up on you here.
      </p>

      {/* Actions */}
      <div className="w-full space-y-2.5">
        <Link href="/subscriptions/new" className="block w-full">
          <Button
            variant="primary"
            size="lg"
            className="w-full justify-center text-sm font-medium shadow-xs py-2.5 gap-2"
          >
            Start your sweep
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>

        {onRestoreClick ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRestoreClick}
            className="w-full justify-center text-xs text-muted-foreground hover:text-foreground font-normal py-2"
          >
            Restore existing ledger
          </Button>
        ) : (
          <Link href="/settings#restore" className="block w-full">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-center text-xs text-muted-foreground hover:text-foreground font-normal py-2"
            >
              Restore existing ledger
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
