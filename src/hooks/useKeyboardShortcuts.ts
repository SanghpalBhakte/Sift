'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcutOptions {
  onOpenAddModal: () => void;
  isModalOpen?: boolean;
}

export function useKeyboardShortcuts({
  onOpenAddModal,
  isModalOpen = false,
}: KeyboardShortcutOptions) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger if any modifier keys are held (allow browser Ctrl+N, Cmd+N, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      // Check if user is currently typing in an input, textarea, select, or contenteditable
      const target = e.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName.toUpperCase();
        if (
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      // If a modal or dialog is already open, do not trigger global shortcuts
      if (isModalOpen || document.querySelector('[role="dialog"]')) {
        return;
      }

      // Shortcut: "/" -> Focus Search Bar
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById(
          'subscription-search-input'
        ) as HTMLInputElement | null;

        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        } else {
          // If search bar is not on current page, navigate to subscriptions page
          router.push('/subscriptions?focusSearch=true');
        }
        return;
      }

      // Shortcut: "n" or "N" -> Open Add Subscription Modal
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        onOpenAddModal();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenAddModal, isModalOpen, router]);
}
