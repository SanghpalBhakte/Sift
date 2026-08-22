import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGate } from '@/components/auth/auth-gate';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith('sb-') || c.name.includes('auth-token')
  );

  const supabase = await createClient();

  if (supabase) {
    if (!hasAuthCookie) {
      redirect('/login');
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }
  }

  return (
    <AuthGate>
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
