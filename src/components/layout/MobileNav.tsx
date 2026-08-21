'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CreditCard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSubscriptions } from '@/context/SubscriptionContext';

export function MobileNav() {
  const pathname = usePathname();
  const { stats } = useSubscriptions();

  // 3 crisp, single-word tabs for clean mobile navigation
  const navItems = [
    {
      href: '/',
      label: 'Home',
      icon: LayoutDashboard,
      active: pathname === '/',
    },
    {
      href: '/subscriptions',
      label: 'Subscriptions',
      icon: CreditCard,
      active: pathname.startsWith('/subscriptions') && pathname !== '/subscriptions/new',
      badge: stats.upcomingRenewalsCount > 0 ? stats.upcomingRenewalsCount : undefined,
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
      active: pathname === '/settings',
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/92 backdrop-blur-lg border-t border-border px-2 py-2">
      <nav
        className="flex items-center justify-around max-w-sm mx-auto"
        aria-label="Mobile navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-4 rounded-xl text-[10px] font-medium transition-colors relative min-w-[4rem]',
                item.active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative mb-1">
                <Icon className="w-5 h-5" aria-hidden="true" />
                {item.badge ? (
                  <span
                    className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-1 tabular-nums"
                    aria-label={`${item.badge} upcoming renewals`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </div>
              {item.active ? (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
              ) : null}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
