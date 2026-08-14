'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const { signUpWithPassword } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex w-10 h-10 rounded-xl bg-[hsl(var(--primary))] items-center justify-center text-[hsl(var(--primary-foreground))] font-bold text-lg mb-1 shadow-xs">
          S
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          Create your Sift workspace
        </h1>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Peaceful recurring spend and subscription management
        </p>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-4">
          {needsConfirmation ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-8 h-8 text-[hsl(var(--success))] mx-auto" />
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Confirm your email
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
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
                <div className="p-2.5 text-xs bg-[hsl(var(--danger-subtle))] border border-[hsl(var(--danger)/0.3)] text-[hsl(var(--danger))] rounded-md">
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

          <div className="pt-2 border-t border-[hsl(var(--border))] text-center text-xs text-[hsl(var(--muted-foreground))]">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-[hsl(var(--primary))] hover:underline"
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
