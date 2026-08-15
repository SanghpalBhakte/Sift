'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CreditCard, PieChart, Settings, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { formatCurrency } from '@/lib/utils/currency';
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
    <aside className="hidden md:flex flex-col w-56 lg:w-64 border-r border-[hsl(var(--border))] min-h-[calc(100vh-3.5rem)] p-4 bg-[hsl(var(--surface)/0.3)]">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                item.active
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs border border-[hsl(var(--border))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={cn('w-4 h-4', item.active ? 'text-[hsl(var(--primary))]' : 'text-current')} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined ? (
                <span className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono">
                  {item.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Quick Summary Card at Sidebar Bottom */}
      <div className="mt-auto pt-4 border-t border-[hsl(var(--border))]">
        <div className="p-3 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[hsl(var(--muted-foreground))]">
            <span>Monthly Run-rate</span>
            <span className="font-semibold text-[hsl(var(--foreground))]">
              <AnimatedCurrency
                value={stats.monthlyTotal}
                currency={profile?.currency_preference || 'USD'}
              />
            </span>
          </div>

          {stats.cancelCandidateCount > 0 ? (
            <div className="pt-2 border-t border-[hsl(var(--border))] flex items-center justify-between text-[11px]">
              <span className="text-[hsl(var(--danger))] flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Review items
              </span>
              <span className="font-medium text-[hsl(var(--danger))]">
                {stats.cancelCandidateCount}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
