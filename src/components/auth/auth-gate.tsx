'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/utils/supabase/client';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { getSafeNext } from '@/lib/utils/safe-redirect';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const [isAuthorized, setIsAuthorized] = useState(() => {
    if (typeof window !== 'undefined' && !isSupabaseConfigured()) {
      return true;
    }
    return false;
  });

  useEffect(() => {
    let isMounted = true;

    async function checkAuthAndMFA() {
      if (!isSupabaseConfigured()) {
        if (isMounted) setIsAuthorized(true);
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        if (isMounted) setIsAuthorized(true);
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          const safeNext = getSafeNext(pathnameRef.current);
          router.replace(`/login?next=${encodeURIComponent(safeNext)}`);
          return;
        }

        const { data: aalData, error: aalError } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        if (aalError) {
          console.error('Error getting MFA assurance level in AuthGate:', aalError);
        }

        if (
          aalData &&
          aalData.currentLevel === 'aal1' &&
          aalData.nextLevel === 'aal2'
        ) {
          const safeNext = getSafeNext(pathnameRef.current);
          router.replace(`/mfa/challenge?next=${encodeURIComponent(safeNext)}`);
          return;
        }

        // aal2 is satisfied or nextLevel is aal1 (no MFA enrolled)
        if (isMounted) {
          setIsAuthorized(true);
        }
      } catch (err) {
        console.error('AuthGate verification exception:', err);
        if (isMounted) {
          setIsAuthorized(true);
        }
      }
    }

    checkAuthAndMFA();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="sift-card max-w-sm w-full p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="space-y-2.5 pt-2">
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
