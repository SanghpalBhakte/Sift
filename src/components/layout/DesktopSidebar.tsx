'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CreditCard, PieChart, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { AnimatedCurrency } from '@/components/ui/AnimatedCurrency';

export function DesktopSidebar() {
  const pathname = usePathname();
  const { stats, profile } = useSubscriptions();

  const navItems = [
    {
      href: '/',
      label: 'Overview',
      icon: LayoutDashboard,
      active: pathname === '/',
    },
    {
      href: '/subscriptions',
      label: 'Subscriptions',
      icon: CreditCard,
      active: pathname.startsWith('/subscriptions') && pathname !== '/subscriptions/new',
      count: stats.activeCount,
    },
    {
      href: '/insights',
      label: 'Insights & Spend',
      icon: PieChart,
      active: pathname === '/insights',
    },
    {
      href: '/settings',
      label: 'Settings & Theme',
      icon: Settings,
      active: pathname === '/settings',
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-56 lg:w-64 border-r border-border min-h-[calc(100vh-3.5rem)] p-4 bg-surface/25">
      <nav className="space-y-0.5" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors',
                item.active
                  ? 'bg-card text-foreground shadow-xs border border-border'
                  : 'text-muted-foreground hover:bg-surface hover:text-foreground'
              )}
              aria-current={item.active ? 'page' : undefined}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn('w-4 h-4 shrink-0', item.active ? 'text-primary' : 'text-current')}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined ? (
                <span className="text-[10px] tabular-nums text-muted-foreground font-mono">
                  {item.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Quick Summary at Sidebar Bottom */}
      <div className="mt-auto pt-4 border-t border-border">
        <div className="p-3 rounded-lg bg-card border border-border space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
              Monthly
            </span>
            <span className="text-xs font-semibold tabular-nums text-foreground">
              <AnimatedCurrency
                value={stats.monthlyTotal}
                currency={profile?.currency_preference || 'USD'}
              />
            </span>
          </div>

          {stats.cancelCandidateCount > 0 ? (
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-[10px] text-danger flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                Review candidates
              </span>
              <span className="text-[10px] font-semibold tabular-nums text-danger">
                {stats.cancelCandidateCount}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
