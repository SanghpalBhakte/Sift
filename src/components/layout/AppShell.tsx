'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { DesktopSidebar } from './DesktopSidebar';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// Dynamically import non-critical modals and client managers to reduce critical First Load JS
const AddSubscriptionModal = dynamic(
  () => import('../subscriptions/AddSubscriptionModal').then((m) => m.AddSubscriptionModal),
  { ssr: false }
);

const ServiceWorkerManager = dynamic(
  () => import('@/components/pwa/ServiceWorkerManager').then((m) => m.ServiceWorkerManager),
  { ssr: false }
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useKeyboardShortcuts({
    onOpenAddModal: () => setIsAddModalOpen(true),
    isModalOpen: isAddModalOpen,
  });

  return (
    <div className="h-screen w-full flex flex-row bg-background text-foreground overflow-hidden">
      {/* 1. Pinned Desktop Sidebar (scrolls independently only if viewport is too short) */}
      <DesktopSidebar />

      {/* 2. Primary Single Vertical Scroll Region for the Application Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden bg-background">
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-12 min-w-0">
          {children}
        </main>
      </div>

      {/* 3. Mobile Navigation Bottom Bar */}
      <MobileNav />

      {/* 4. Accessible Mobile Floating Action Button (FAB) positioned safely above MobileNav */}
      <Link
        href="/subscriptions/new"
        className="md:hidden fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-4 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
        aria-label="Add Subscription"
      >
        <Plus className="w-5 h-5" aria-hidden="true" />
      </Link>

      {/* 5. Global Quick Add Subscription Modal (keyboard shortcut "N") */}
      {isAddModalOpen && (
        <AddSubscriptionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* 6. Non-intrusive PWA update notification banner */}
      <ServiceWorkerManager />
    </div>
  );
}
