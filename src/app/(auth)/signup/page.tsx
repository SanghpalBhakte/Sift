'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { CheckCircle2 } from 'lucide-react';

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

export default function SignUpPage() {
  const router = useRouter();
  const { signUpWithPassword, signInWithGoogle } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const res = await signUpWithPassword(email, password, fullName);

    if (res.error) {
      setError(res.error);
      setIsSubmitting(false);
    } else if (res.needsEmailConfirmation) {
      setNeedsConfirmation(true);
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setIsGoogleLoading(true);
    const res = await signInWithGoogle('/');
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
          Create your Sift workspace
        </h1>
        <p className="text-xs text-muted-foreground">
          Peaceful recurring spend and subscription management
        </p>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-4">
          {/* Google OAuth Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignUp}
            isLoading={isGoogleLoading}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium bg-surface hover:bg-surface-muted"
          >
            <GoogleIcon className="w-4 h-4" />
            <span>Sign up with Google</span>
          </Button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-border w-full" />
            <span className="bg-card px-2 text-[11px] text-muted-foreground uppercase tracking-wider relative">
              or
            </span>
          </div>

          {needsConfirmation ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
              <h3 className="text-sm font-semibold text-foreground">
                Confirm your email
              </h3>
              <p className="text-xs text-muted-foreground">
                We sent a confirmation link to <strong>{email}</strong>. Please check your inbox
                to activate your account.
              </p>
              <Link href="/login" className="inline-block pt-2">
                <Button variant="outline" size="sm">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <div className="p-2.5 text-xs bg-danger-subtle border border-danger/30 text-danger rounded-md">
                  {error}
                </div>
              ) : null}

              <Input
                label="Full Name / Display Name"
                placeholder="Alex Mercer"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />

              <Input
                label="Email address *"
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Input
                label="Password *"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                helperText="Minimum 6 characters"
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full shadow-xs"
                isLoading={isSubmitting}
              >
                Create Account
              </Button>
            </form>
          )}

          <div className="pt-2 border-t border-border text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
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
