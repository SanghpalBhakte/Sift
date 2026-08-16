'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithPassword: (email: string, password: string, redirectTo?: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>;
  signInWithOtp: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isConfigured = isSupabaseConfigured();

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
    } catch (err) {
      console.error('Error fetching auth user:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured]);

  useEffect(() => {
    refreshUser();

    if (!isConfigured) return;

    const supabase = createClient();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured, refreshUser]);

  const signInWithPassword = async (
    email: string,
    password: string,
    redirectTo: string = '/'
  ): Promise<{ error: string | null }> => {
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
    router.push(redirectTo);
    router.refresh();
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

    // If session is null, email confirmation is enabled in Supabase
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
        signUpWithPassword,
        signInWithOtp,
        signOut,
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
