'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MFAChallenge } from '@/components/auth/MFAChallenge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Link from 'next/link';

function MFAChallengeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const handleSuccess = () => {
    router.push(next);
    router.refresh();
  };

  return (
    <div className="w-full space-y-6">
      {/* Header logo & theme toggle */}
      <div className="flex items-center justify-between px-1">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shadow-xs">
            S
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            Sift
          </span>
        </Link>
        <ThemeToggle />
      </div>

      <MFAChallenge onSuccess={handleSuccess} />
    </div>
  );
}

export default function MFAChallengePage() {
  return (
    <Suspense
      fallback={
        <div className="sift-card max-w-sm w-full mx-auto p-8 text-center space-y-3">
          <div className="h-8 w-8 rounded-full bg-surface-muted mx-auto animate-pulse" />
          <div className="h-4 w-32 bg-surface-muted mx-auto rounded animate-pulse" />
        </div>
      }
    >
      <MFAChallengeContent />
    </Suspense>
  );
}
