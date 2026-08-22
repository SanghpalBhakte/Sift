'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

function GoogleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';
  const authErrorParam = searchParams.get('error');

  const { signInWithPassword, signInWithOtp, signInWithGoogle } = useAuth();

  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(
    authErrorParam === 'auth-failed' ? 'Authentication link was invalid or expired.' : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError(null);
    setIsSubmitting(true);

    if (authMode === 'password') {
      if (!password) {
        setError('Please enter your password.');
        setIsSubmitting(false);
        return;
      }
      const res = await signInWithPassword(email, password, next);
      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
      }
    } else {
      const res = await signInWithOtp(email);
      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
      } else {
        setIsOtpSent(true);
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    const res = await signInWithGoogle(next);
    if (res.error) {
      setError(res.error);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex w-10 h-10 rounded-xl bg-primary items-center justify-center text-primary-foreground font-bold text-lg mb-1 shadow-xs">
          S
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Welcome back to Sift
        </h1>
        <p className="text-xs text-muted-foreground">
          Your calm recurring spend workspace
        </p>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-4">
          {/* Google OAuth Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            isLoading={isGoogleLoading}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium bg-surface hover:bg-surface-muted"
          >
            <GoogleIcon className="w-4 h-4" />
            <span>Continue with Google</span>
          </Button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-border w-full" />
            <span className="bg-card px-2 text-[11px] text-muted-foreground uppercase tracking-wider relative">
              or
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-surface border border-border rounded-lg text-xs">
            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                setError(null);
              }}
              className={cn(
                'py-1.5 font-medium rounded-md transition-all cursor-pointer',
                authMode === 'password'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('otp');
                setError(null);
              }}
              className={cn(
                'py-1.5 font-medium rounded-md transition-all cursor-pointer',
                authMode === 'otp'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Magic Link
            </button>
          </div>

          {isOtpSent ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
              <h3 className="text-sm font-semibold text-foreground">
                Check your inbox
              </h3>
              <p className="text-xs text-muted-foreground">
                We sent a secure magic sign-in link to <strong>{email}</strong>.
              </p>
              <button
                type="button"
                onClick={() => setIsOtpSent(false)}
                className="text-xs text-primary hover:underline pt-2 inline-block cursor-pointer"
              >
                Sign in with password instead
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <div className="p-2.5 text-xs bg-danger-subtle border border-danger/30 text-danger rounded-md">
                  {error}
                </div>
              ) : null}

              <Input
                label="Email address"
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />

              {authMode === 'password' ? (
                <>
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <div className="flex justify-end -mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('otp');
                        setError(null);
                      }}
                      className="text-[11px] text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                    >
                      Forgot password? Sign in with magic link
                    </button>
                  </div>
                </>
              ) : null}

              <Button
                type="submit"
                variant="primary"
                className="w-full shadow-xs"
                isLoading={isSubmitting}
              >
                {authMode === 'password' ? 'Sign In' : 'Send Magic Link'}
              </Button>
            </form>
          )}

          <div className="pt-2 border-t border-border text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center">
        <ThemeToggle />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-xs text-muted-foreground">
          Loading sign in...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
