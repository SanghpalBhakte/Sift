'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SUPPORTED_CURRENCIES } from '@/lib/utils/currency';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { Palette, Bell, Database, User, RotateCcw, Check, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const { theme, resolvedTheme } = useTheme();
  const { profile, updateProfile, resetToSampleData } = useSubscriptions();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [currency, setCurrency] = useState(profile?.currency_preference || 'USD');
  const [name, setName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');

  const hasSupabase = isSupabaseConfigured();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      currency_preference: currency,
      full_name: name,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetData = async () => {
    if (
      window.confirm(
        'Reset local subscription dataset to the initial Paper Ledger sample catalog?'
      )
    ) {
      await resetToSampleData();
      alert('Sample dataset restored.');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="pb-2 border-b border-[hsl(var(--border))]">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          Settings & Preferences
        </h1>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
          Customize your theme, currency display, and workspace preferences
        </p>
      </div>

      {savedSuccess ? (
        <div className="p-3 text-xs bg-[hsl(var(--success-subtle))] border border-[hsl(var(--success)/0.3)] text-[hsl(var(--success))] rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" /> Preferences saved successfully.
        </div>
      ) : null}

      {/* 1. Theme Identity & Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[hsl(var(--primary))]" />
            <CardTitle>Theme Identity</CardTitle>
          </div>
          <Badge variant="primary" size="sm">
            {resolvedTheme === 'paper-ledger' ? 'Paper Ledger' : 'Night Shelf'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Sift is crafted around two calm identities: <strong>Paper Ledger</strong> (warm Japanese
            stationery light mode) and <strong>Night Shelf</strong> (low-glare oiled slate dark mode).
          </p>

          <div className="pt-1">
            <ThemeToggle showLabels />
          </div>
        </CardContent>
      </Card>

      {/* 2. Profile & Currency Settings */}
      <form onSubmit={handleSaveProfile}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[hsl(var(--primary))]" />
              <CardTitle>Workspace & Currency</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name / Display Name"
                placeholder="Alex Mercer"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <Input
                label="Email"
                type="email"
                placeholder="alex@sift.studio"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
                helperText="Primary workspace identifier"
              />
            </div>

            <Select
              label="Primary Display Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              helperText="All recurring subscription run-rates will be formatted in this currency."
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name} ({c.symbol})
                </option>
              ))}
            </Select>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" size="sm">
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* 3. Database & Supabase Integration Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[hsl(var(--primary))]" />
            <CardTitle>Database & Cloud Sync</CardTitle>
          </div>
          <Badge variant={hasSupabase ? 'success' : 'default'} size="sm">
            {hasSupabase ? 'Supabase Connected' : 'Local / Offline Mode'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-[hsl(var(--muted-foreground))]">
          {hasSupabase ? (
            <p>
              Sift is securely connected to your Supabase PostgreSQL instance with Row Level
              Security enabled on all subscription tables.
            </p>
          ) : (
            <p>
              Sift is currently operating in <strong>Local Mode</strong> with reactive browser
              storage. To sync with a cloud Supabase project, provide your Supabase URL and anon key
              in <code className="px-1.5 py-0.5 rounded bg-[hsl(var(--surface))] font-mono text-[11px]">.env.local</code>.
            </p>
          )}

          <div className="pt-2 border-t border-[hsl(var(--border))] flex items-center justify-between">
            <span className="text-[11px]">Restore initial sample dataset</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetData}
              className="gap-1 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Sample Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
