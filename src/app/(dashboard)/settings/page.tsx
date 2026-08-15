'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SUPPORTED_CURRENCIES } from '@/lib/utils/currency';
import {
  Palette,
  Database,
  User,
  Check,
  LogOut,
  Sparkles,
  Download,
  FileSpreadsheet,
  Bell,
  Info,
  ShieldCheck,
} from 'lucide-react';

const REMINDER_OFFSET_OPTIONS = [
  { days: 7, label: '7 days before' },
  { days: 3, label: '3 days before' },
  { days: 1, label: '1 day before' },
  { days: 0, label: 'On renewal day' },
];

export default function SettingsPage() {
  const { resolvedTheme } = useTheme();
  const { user, signOut, isConfigured } = useAuth();
  const {
    subscriptions,
    categories,
    profile,
    updateProfile,
    resetToSampleData,
    populateStarterTemplates,
  } = useSubscriptions();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [currency, setCurrency] = useState(profile?.currency_preference || 'USD');
  const [name, setName] = useState(profile?.full_name || '');
  const [selectedOffsets, setSelectedOffsets] = useState<number[]>(
    profile?.default_reminder_days || [7, 3, 1]
  );
  const [isSaving, setIsSaving] = useState(false);

  const toggleOffset = (days: number) => {
    if (selectedOffsets.includes(days)) {
      setSelectedOffsets(selectedOffsets.filter((d) => d !== days));
    } else {
      setSelectedOffsets([...selectedOffsets, days].sort((a, b) => b - a));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        currency_preference: currency,
        full_name: name,
        default_reminder_days: selectedOffsets,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Export Subscriptions as JSON
  const handleExportJSON = () => {
    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      profile: {
        email: user?.email || profile?.email,
        currency_preference: currency,
      },
      subscriptions,
      categories,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sift-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export Subscriptions as CSV
  const handleExportCSV = () => {
    const headers = [
      'Name',
      'Amount',
      'Currency',
      'Billing Cycle',
      'Status',
      'Category',
      'Value Rating',
      'Next Renewal Date',
      'Is Trial',
      'Monthly Amount',
      'Notes',
    ];

    const rows = subscriptions.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      s.amount,
      s.currency,
      s.billing_cycle,
      s.status,
      `"${(s.category?.name || 'General').replace(/"/g, '""')}"`,
      s.value_rating,
      s.next_renewal_date,
      s.is_trial ? 'Yes' : 'No',
      s.monthly_amount,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sift-subscriptions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetData = async () => {
    if (
      window.confirm(
        'Clear all local subscriptions and restore sample starter catalog?'
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
          Workspace personalization, theme customization, reminder defaults, and data export
        </p>
      </div>

      {savedSuccess ? (
        <div className="p-3 text-xs bg-[hsl(var(--success-subtle))] border border-[hsl(var(--success)/0.3)] text-[hsl(var(--success))] rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" /> Preferences saved successfully.
        </div>
      ) : null}

      {/* 1. Appearance & Theme */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[hsl(var(--primary))]" />
            <CardTitle>Appearance & Theme</CardTitle>
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

      {/* 2. Workspace & Preferences Form */}
      <form onSubmit={handleSaveProfile}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[hsl(var(--primary))]" />
              <CardTitle>Workspace & Reminders</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Display Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name / Display Name"
                placeholder="Alex Mercer"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <Input
                label="Primary Email"
                type="email"
                placeholder="alex@sift.studio"
                value={user?.email || profile?.email || ''}
                disabled
                helperText="Primary workspace identity"
              />
            </div>

            {/* Currency Preference */}
            <Select
              label="Primary Display Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              helperText="All recurring subscription run-rates and totals will be formatted in this currency."
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name} ({c.symbol})
                </option>
              ))}
            </Select>

            {/* Reminder Default Offsets Foundation */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                Default Renewal Reminder Offsets
              </label>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                New subscriptions will inherit these pre-renewal notification alerts:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {REMINDER_OFFSET_OPTIONS.map(({ days, label }) => {
                  const isSelected = selectedOffsets.includes(days);
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => toggleOffset(days)}
                      className={`p-2.5 rounded-lg border text-xs font-medium text-center transition-all ${
                        isSelected
                          ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))] font-semibold'
                          : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* 3. Account & Security Session */}
      {user ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[hsl(var(--primary))]" />
              <CardTitle>Account & Session</CardTitle>
            </div>
            <Badge variant="success" size="sm">
              Signed In
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[hsl(var(--muted-foreground))]">Authenticated Email</span>
              <span className="font-semibold text-[hsl(var(--foreground))] font-mono">
                {user.email}
              </span>
            </div>

            <div className="pt-2 border-t border-[hsl(var(--border))] flex items-center justify-between">
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                End current active session
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-xs text-[hsl(var(--danger))] hover:bg-[hsl(var(--danger-subtle))] gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* 4. Data Management & Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-[hsl(var(--primary))]" />
            <CardTitle>Data Management & Export</CardTitle>
          </div>
          <Badge variant="outline" size="sm">
            {subscriptions.length} records
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <p className="text-[hsl(var(--muted-foreground))]">
            Your data belongs to you. You can export your subscriptions at any time for backup or
            spreadsheet analysis.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              Export to CSV (Excel / Sheets)
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportJSON}
              className="gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              Export to JSON (Full Backup)
            </Button>
          </div>

          <div className="pt-3 border-t border-[hsl(var(--border))] flex items-center justify-between">
            <div>
              <div className="font-semibold text-[hsl(var(--foreground))]">Sample Starter Catalog</div>
              <div className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Populate realistic test subscriptions for trial
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => populateStarterTemplates()}
              className="gap-1 text-xs text-[hsl(var(--primary))]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Samples
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 5. Cloud Sync & System Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[hsl(var(--primary))]" />
            <CardTitle>Database & Cloud Sync</CardTitle>
          </div>
          <Badge variant={isConfigured ? 'success' : 'default'} size="sm">
            {isConfigured ? 'Supabase Connected' : 'Local Mode'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-[hsl(var(--muted-foreground))]">
          {isConfigured ? (
            <p>
              Sift is securely connected to PostgreSQL with Row Level Security (RLS) isolating all
              records to your authenticated account.
            </p>
          ) : (
            <p>
              Sift is operating in <strong>Local Storage Mode</strong>. Supabase credentials can be
              set in <code className="px-1.5 py-0.5 rounded bg-[hsl(var(--surface))] font-mono text-[11px]">.env.local</code>.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 6. About Sift */}
      <Card className="bg-[hsl(var(--surface)/0.5)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[hsl(var(--primary))]" />
            <CardTitle>About Sift</CardTitle>
          </div>
          <span className="text-[11px] font-mono text-[hsl(var(--muted-foreground))]">v0.1.0</span>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
          <p>
            Sift is a calm, minimal, mobile-first recurring payments workspace built for clarity,
            financial peace of mind, and zero surprise billings.
          </p>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
            Supports Progressive Web App (PWA) installation directly from your browser menu.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
