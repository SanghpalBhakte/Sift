'use client';

import React from 'react';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { DesktopSidebar } from './DesktopSidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))] selection:bg-[hsl(var(--primary)/0.2)]">
      <Header />
      <div className="flex-1 flex max-w-6xl w-full mx-auto">
        <DesktopSidebar />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-4xl pb-24 md:pb-12 w-full mx-auto">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
