'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';

interface WelcomeScreenProps {
  onRestoreClick?: () => void;
}

export function WelcomeScreen({ onRestoreClick }: WelcomeScreenProps) {
  return (
    <div className="min-h-[calc(100vh-14rem)] flex flex-col items-center justify-center text-center px-4 py-8 sm:py-12 max-w-sm mx-auto animate-in fade-in duration-300">
      {/* Sift Wordmark & Logo */}
      <div className="flex flex-col items-center mb-1">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl tracking-tight shadow-xs mb-3">
          S
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Sift
        </h1>
      </div>

      {/* Supporting Line */}
      <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-8 font-normal leading-relaxed">
        Track every subscription, privately.
      </p>

      {/* Actions */}
      <div className="w-full space-y-2.5">
        <Link href="/subscriptions/new" className="block w-full">
          <Button
            variant="primary"
            size="lg"
            className="w-full justify-center text-sm font-medium shadow-xs py-2.5"
          >
            Get Started
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
            Restore from backup
          </Button>
        ) : (
          <Link href="/settings#restore" className="block w-full">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-center text-xs text-muted-foreground hover:text-foreground font-normal py-2"
            >
              Restore from backup
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
