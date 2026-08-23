'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { SweepLogo } from '@/components/brand/SweepLogo';
import { getSafeNext } from '@/lib/utils/safe-redirect';

interface AuthGateProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGate({ children, requireAuth = true }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isLoading, isConfigured } = useAuth();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Reset redirect guard if session appears
    if (session) {
      hasRedirectedRef.current = false;
      return;
    }

    // Only evaluate redirect when auth loading has settled
    if (isLoading) return;

    // If Supabase is not configured, offline local mode is active
    if (!isConfigured) return;

    if (requireAuth && !session && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      const safeNext = getSafeNext(pathnameRef.current);
      router.replace(`/login?next=${encodeURIComponent(safeNext)}`);
    }
  }, [session, isLoading, isConfigured, requireAuth, router]);

  // Show a stable branded loading shell while auth state is resolving
  if (isLoading && isConfigured) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 space-y-3 animate-in fade-in duration-150">
        <SweepLogo variant="icon" size="sm" className="shadow-xs animate-pulse" />
        <span className="font-serif text-sm font-semibold text-foreground/80">
          Loading your workspace...
        </span>
        <div className="w-20 h-1 rounded-full skeleton" />
      </div>
    );
  }

  // If auth is required but session is missing, render nothing while redirect occurs
  if (requireAuth && isConfigured && !session) {
    return null;
  }

  return <>{children}</>;
}
