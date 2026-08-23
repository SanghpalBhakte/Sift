import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGate } from '@/components/auth/auth-gate';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate requireAuth={false}>
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
