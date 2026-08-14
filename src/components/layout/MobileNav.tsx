'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CreditCard, PieChart, Settings, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSubscriptions } from '@/context/SubscriptionContext';

export function MobileNav() {
  const pathname = usePathname();
  const { stats } = useSubscriptions();

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
      badge: stats.upcomingRenewalsCount > 0 ? stats.upcomingRenewalsCount : undefined,
    },
    {
      href: '/insights',
      label: 'Insights',
      icon: PieChart,
      active: pathname === '/insights',
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
      active: pathname === '/settings',
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[hsl(var(--background)/0.92)] backdrop-blur-lg border-t border-[hsl(var(--border))] px-3 py-2">
      <nav className="flex items-center justify-around max-w-md mx-auto relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors relative min-w-[3.5rem]',
                item.active
                  ? 'text-[hsl(var(--primary))] font-semibold'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              <div className="relative mb-1">
                <Icon className="w-5 h-5" />
                {item.badge ? (
                  <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
