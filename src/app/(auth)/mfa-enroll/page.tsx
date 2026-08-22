'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MFAEnroll } from '@/components/auth/MFAEnroll';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Link from 'next/link';

export default function MFAEnrollPage() {
  const router = useRouter();

  const handleEnrolled = () => {
    router.push('/settings');
    router.refresh();
  };

  const handleCancel = () => {
    router.push('/settings');
  };

  return (
    <div className="w-full space-y-6">
      {/* Header logo & theme toggle */}
      <div className="flex items-center justify-between px-1">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shadow-xs">
            S
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            Sift
          </span>
        </Link>
        <ThemeToggle />
      </div>

      <MFAEnroll onEnrolled={handleEnrolled} onCancel={handleCancel} />
    </div>
  );
}
