'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { DesktopSidebar } from './DesktopSidebar';
import { AddSubscriptionModal } from '../subscriptions/AddSubscriptionModal';
import { ServiceWorkerManager } from '@/components/pwa/ServiceWorkerManager';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useKeyboardShortcuts({
    onOpenAddModal: () => setIsAddModalOpen(true),
    isModalOpen: isAddModalOpen,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <div className="flex-1 flex max-w-6xl w-full mx-auto">
        <DesktopSidebar />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-4xl pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-12 w-full mx-auto min-w-0">
          {children}
        </main>
      </div>
      <MobileNav />

      {/* Accessible Mobile Floating Action Button (FAB) positioned safely above MobileNav */}
      <Link
        href="/subscriptions/new"
        className="md:hidden fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-4 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
        aria-label="Add Subscription"
      >
        <Plus className="w-5 h-5" aria-hidden="true" />
      </Link>

      {/* Global Quick Add Subscription Modal (keyboard shortcut "N") */}
      <AddSubscriptionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Non-intrusive PWA update notification banner */}
      <ServiceWorkerManager />
    </div>
  );
}
