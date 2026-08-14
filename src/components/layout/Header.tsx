'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, LogOut, User } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/Button';
import { useAuth } from '@/context/AuthContext';

export function Header() {
  const { user, signOut, isConfigured } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full bg-[hsl(var(--background)/0.85)] backdrop-blur-md border-b border-[hsl(var(--border))] transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center text-[hsl(var(--primary-foreground))] font-bold text-sm tracking-tight shadow-xs">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-semibold tracking-tight text-sm text-[hsl(var(--foreground))]">
                Sift
              </span>
            </div>
          </Link>
          <span className="hidden sm:inline-block text-[11px] text-[hsl(var(--muted-foreground))] border-l border-[hsl(var(--border))] pl-3">
            Recurring spend workspace
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          <Link href="/subscriptions/new">
            <Button variant="primary" size="sm" className="gap-1.5 shadow-xs">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Add Subscription</span>
              <span className="xs:hidden">Add</span>
            </Button>
          </Link>

          {user ? (
            <button
              type="button"
              onClick={() => signOut()}
              title={`Sign out (${user.email})`}
              className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface))] rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : isConfigured ? (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs">
                Sign In
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
