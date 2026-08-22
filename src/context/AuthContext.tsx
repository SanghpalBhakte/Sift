'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithPassword: (
    email: string,
    password: string,
    redirectTo?: string
  ) => Promise<{ error: string | null; needsMFA?: boolean }>;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>;
  signInWithOtp: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  unenrollMFA: (factorId: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isConfigured = isSupabaseConfigured();

  const checkAAL = useCallback(async (currentSession: Session | null) => {
    if (!currentSession || !isConfigured) return false;

    const supabase = createClient();
    if (!supabase) return false;

    try {
      const { data: aalData, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) {
        console.error('Error checking AAL:', error);
        return false;
      }

      if (aalData && aalData.nextLevel === 'aal2' && aalData.nextLevel !== aalData.currentLevel) {
        if (
          pathname &&
          !pathname.startsWith('/mfa/challenge') &&
          !pathname.startsWith('/mfa-challenge') &&
          !pathname.startsWith('/login')
        ) {
          router.push(`/mfa/challenge?next=${encodeURIComponent(pathname)}`);
        }
        return true;
      }
    } catch (err) {
      console.error('AAL check exception:', err);
    }
    return false;
  }, [isConfigured, pathname, router]);

  const refreshUser = useCallback(async () => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      setUser(currentUser);
      setSession(currentSession);

      if (currentSession) {
        await checkAAL(currentSession);
      }
    } catch (err) {
      console.error('Error fetching auth user:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, checkAAL]);

  useEffect(() => {
    refreshUser();

    if (!isConfigured) return;

    const supabase = createClient();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);

      if (newSession) {
        await checkAAL(newSession);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured, refreshUser, checkAAL]);

  const signInWithPassword = async (
    email: string,
    password: string,
    redirectTo: string = '/'
  ): Promise<{ error: string | null; needsMFA?: boolean }> => {
    if (!isConfigured) {
      return { error: 'Supabase is not configured.' };
    }

    const supabase = createClient();
    if (!supabase) return { error: 'Supabase client unavailable.' };

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    setUser(data.user);
    setSession(data.session);

    // Check MFA Assurance Level
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalData?.nextLevel === 'aal2' && aalData.nextLevel !== aalData.currentLevel) {
      router.push(`/mfa/challenge?next=${encodeURIComponent(redirectTo)}`);
      return { error: null, needsMFA: true };
    }

    router.push(redirectTo);
    router.refresh();
    return { error: null, needsMFA: false };
  };

  const signInWithGoogle = async (
    redirectTo: string = '/'
  ): Promise<{ error: string | null }> => {
    if (!isConfigured) {
      return { error: 'Supabase is not configured.' };
    }

    const supabase = createClient();
    if (!supabase) return { error: 'Supabase client unavailable.' };

    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      redirectTo
    )}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  const signUpWithPassword = async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ error: string | null; needsEmailConfirmation?: boolean }> => {
    if (!isConfigured) {
      return { error: 'Supabase is not configured.' };
    }

    const supabase = createClient();
    if (!supabase) return { error: 'Supabase client unavailable.' };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    // If session is null, email confirmation is required in Supabase
    if (data.user && !data.session) {
      return { error: null, needsEmailConfirmation: true };
    }

    setUser(data.user);
    setSession(data.session);
    router.push('/');
    router.refresh();
    return { error: null, needsEmailConfirmation: false };
  };

  const signInWithOtp = async (email: string): Promise<{ error: string | null }> => {
    if (!isConfigured) {
      return { error: 'Supabase is not configured.' };
    }

    const supabase = createClient();
    if (!supabase) return { error: 'Supabase client unavailable.' };

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  const unenrollMFA = async (factorId: string): Promise<{ error: string | null }> => {
    if (!isConfigured) return { error: 'Supabase is not configured.' };

    const supabase = createClient();
    if (!supabase) return { error: 'Supabase client unavailable.' };

    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  };

  const signOut = async () => {
    if (isConfigured) {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    }

    setUser(null);
    setSession(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured,
        signInWithPassword,
        signInWithGoogle,
        signUpWithPassword,
        signInWithOtp,
        signOut,
        unenrollMFA,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
