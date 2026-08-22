'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MFAEnroll } from '@/components/auth/MFAEnroll';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SweepLogo } from '@/components/brand/SweepLogo';
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
        <Link href="/" className="flex items-center gap-2 group" aria-label="Sweep home">
          <SweepLogo size="sm" />
        </Link>
        <ThemeToggle />
      </div>

      <MFAEnroll onEnrolled={handleEnrolled} onCancel={handleCancel} />
    </div>
  );
}
