'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, LogOut, Bell } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { AlertsSlideOver } from '../reminders/AlertsSlideOver';

import { SweepLogo } from '../brand/SweepLogo';

export function Header() {
  const { user, signOut, isConfigured } = useAuth();
  const { totalAlertsCount, urgentAlertsCount, toggleAlertPanel } = useNotifications();

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-background/85 backdrop-blur-md border-b border-border transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group" aria-label="Sweep home">
              <SweepLogo size="sm" />
            </Link>
            <span className="hidden sm:inline-block text-[11px] font-sans text-muted-foreground border-l border-border pl-3 tracking-normal">
              A calmer view of what renews
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* Reminders bell */}
            <button
              type="button"
              onClick={toggleAlertPanel}
              title={
                totalAlertsCount > 0
                  ? `${totalAlertsCount} upcoming alerts`
                  : 'Upcoming reminders & alerts'
              }
              className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-surface rounded-lg transition-colors"
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
              {totalAlertsCount > 0 ? (
                <span
                  className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    urgentAlertsCount > 0
                      ? 'bg-danger text-danger-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                  aria-label={`${totalAlertsCount} alerts`}
                >
                  {totalAlertsCount}
                </span>
              ) : null}
            </button>

            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            <Link href="/subscriptions/new">
              <Button variant="primary" size="sm" className="gap-1.5 shadow-xs">
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden xs:inline">Add Subscription</span>
                <span className="xs:hidden">Add</span>
                <kbd className="hidden sm:inline-flex text-[10px] bg-primary-foreground/20 border border-primary-foreground/20 rounded px-1 font-mono font-normal">
                  N
                </kbd>
              </Button>
            </Link>

            {user ? (
              <button
                type="button"
                onClick={() => signOut()}
                title={`Sign out (${user.email})`}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
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

      {/* Slide-over Reminders Drawer */}
      <AlertsSlideOver />
    </>
  );
}
