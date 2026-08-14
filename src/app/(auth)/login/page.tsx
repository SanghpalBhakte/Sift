'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ArrowRight, Mail, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSupabase = isSupabaseConfigured();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError(null);
    setIsSubmitting(true);

    if (hasSupabase) {
      const supabase = createClient();
      if (supabase) {
        const { error: authError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        });

        if (authError) {
          setError(authError.message);
          setIsSubmitting(false);
          return;
        }
      }
    }

    setIsSubmitting(false);
    setIsSent(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex w-10 h-10 rounded-xl bg-[hsl(var(--primary))] items-center justify-center text-[hsl(var(--primary-foreground))] font-bold text-lg mb-1 shadow-xs">
          S
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          Welcome to Sift
        </h1>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Your calm recurring spend workspace
        </p>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-4">
          {isSent ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-8 h-8 text-[hsl(var(--success))] mx-auto" />
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Check your inbox
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                We sent a secure magic sign-in link to <strong>{email}</strong>.
              </p>
              <Link href="/" className="inline-block pt-2">
                <Button variant="outline" size="sm">
                  Continue to Workspace
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {error ? (
                <div className="p-2.5 text-xs bg-[hsl(var(--danger-subtle))] border border-[hsl(var(--danger)/0.3)] text-[hsl(var(--danger))] rounded-md">
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
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isSubmitting}
              >
                Send Magic Sign-In Link
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/"
                  className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  Enter demo workspace without login &rarr;
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-center">
        <ThemeToggle />
      </div>
    </div>
  );
}
