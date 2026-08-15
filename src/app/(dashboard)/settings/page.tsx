'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SUPPORTED_CURRENCIES } from '@/lib/utils/currency';
import {
  generateFullBackupJson,
  generateSubscriptionsCsv,
  generateBackupReadme,
  downloadFile,
} from '@/lib/utils/backup';
import { RestoreModal } from '@/components/backup/RestoreModal';
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
  Mail,
  Zap,
  RefreshCw,
  Archive,
  Coins,
  Globe,
  Smartphone,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/dates';

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
    exchangeRates,
    updateProfile,
    populateStarterTemplates,
    refreshExchangeRates,
    refresh,
  } = useSubscriptions();

  const {
    isPushSupported,
    isPushSubscribed,
    enablePushNotifications,
    disablePushNotifications,
    sendTestPushNotification,
    updatePreferences,
  } = useNotifications();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [ratesSyncSuccess, setRatesSyncSuccess] = useState(false);
  const [isSyncingRates, setIsSyncingRates] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [emailDispatchStatus, setEmailDispatchStatus] = useState<string | null>(null);
  const [pushActionStatus, setPushActionStatus] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);

  const [currency, setCurrency] = useState(profile?.currency_preference || 'USD');
  const [name, setName] = useState(profile?.full_name || '');
  const [selectedOffsets, setSelectedOffsets] = useState<number[]>(
    profile?.default_reminder_days || [7, 3, 1]
  );
  const [notifyRenewals, setNotifyRenewals] = useState(
    profile?.notify_renewals !== false
  );
  const [notifyTrials, setNotifyTrials] = useState(
    profile?.notify_trials !== false
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile?.notifications_enabled !== false
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
        notifications_enabled: notificationsEnabled,
        notify_renewals: notifyRenewals,
        notify_trials: notifyTrials,
      });
      await updatePreferences({
        enabled: notificationsEnabled,
        notifyRenewals,
        notifyTrials,
        offsets: selectedOffsets,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePush = async () => {
    setIsPushLoading(true);
    setPushActionStatus(null);
    try {
      if (isPushSubscribed) {
        const res = await disablePushNotifications();
        if (res.success) {
          setPushActionStatus('Web push alerts disabled on this device.');
        } else {
          setPushActionStatus(res.error || 'Failed to disable push alerts.');
        }
      } else {
        const res = await enablePushNotifications();
        if (res.success) {
          setPushActionStatus('Web push alerts enabled on this device.');
        } else {
          setPushActionStatus(res.error || 'Permission not granted or push unavailable.');
        }
      }
    } catch (err: any) {
      setPushActionStatus(err.message || 'Error updating push status.');
    } finally {
      setIsPushLoading(false);
    }
  };

  const handleTestPush = async () => {
    setIsPushLoading(true);
    setPushActionStatus(null);
    try {
      const res = await sendTestPushNotification();
      if (res.success) {
        setPushActionStatus('Test push notification sent! Check your notification center.');
      } else {
        setPushActionStatus(res.error || 'Failed to trigger test push.');
      }
    } catch (err: any) {
      setPushActionStatus(err.message || 'Error triggering push.');
    } finally {
      setIsPushLoading(false);
    }
  };

  const handleSyncRates = async () => {
    setIsSyncingRates(true);
    try {
      await refreshExchangeRates(true);
      setRatesSyncSuccess(true);
      setTimeout(() => setRatesSyncSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to sync rates:', err);
    } finally {
      setIsSyncingRates(false);
    }
  };

  const handleTriggerEmailDispatch = async () => {
    setIsDispatching(true);
    setEmailDispatchStatus(null);
    try {
      const res = await fetch('/api/reminders/dispatch', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailDispatchStatus(
          `Evaluated ${data.results.totalDueAlerts} due alert(s): ${data.results.sent} email(s) sent, ${data.results.pushSent || 0} push alert(s) dispatched, ${data.results.skipped} deduplicated.`
        );
      } else {
        setEmailDispatchStatus(`Dispatch status: ${data.error || 'Check server configuration.'}`);
      }
    } catch (err: any) {
      setEmailDispatchStatus(`Dispatch failed: ${err.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  // Export Subscriptions as Full JSON Backup
  const handleExportJSON = () => {
    const backup = generateFullBackupJson({
      userEmail: user?.email,
      profile,
      subscriptions,
      categories,
    });
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(
      JSON.stringify(backup, null, 2),
      `sift-backup-${dateStr}.json`,
      'application/json'
    );
  };

  // Export Subscriptions as CSV
  const handleExportCSV = () => {
    const csvContent = generateSubscriptionsCsv(subscriptions);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(csvContent, `sift-subscriptions-${dateStr}.csv`, 'text/csv');
  };

  // Export Complete Backup Package (JSON + CSV + README)
  const handleExportPackage = () => {
    const backup = generateFullBackupJson({
      userEmail: user?.email,
      profile,
      subscriptions,
      categories,
    });
    const dateStr = new Date().toISOString().split('T')[0];

    downloadFile(
      JSON.stringify(backup, null, 2),
      `sift-backup-${dateStr}.json`,
      'application/json'
    );

    const csvContent = generateSubscriptionsCsv(subscriptions);
    setTimeout(() => {
      downloadFile(csvContent, `sift-subscriptions-${dateStr}.csv`, 'text/csv');
    }, 200);

    const readme = generateBackupReadme(backup);
    setTimeout(() => {
      downloadFile(readme, `sift-manifest-${dateStr}.txt`, 'text/plain');
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="pb-2 border-b border-[hsl(var(--border))]">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          Settings & Preferences
        </h1>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
          Workspace personalization, multi-currency display, browser push & email reminders, and open data
          backup
        </p>
      </div>

      {savedSuccess ? (
        <div className="p-3 text-xs bg-[hsl(var(--success-subtle))] border border-[hsl(var(--success)/0.3)] text-[hsl(var(--success))] rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" /> Preferences saved successfully.
        </div>
      ) : null}

      {restoreSuccess ? (
        <div className="p-3 text-xs bg-[hsl(var(--success-subtle))] border border-[hsl(var(--success)/0.3)] text-[hsl(var(--success))] rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" /> Workspace backup restored successfully.
        </div>
      ) : null}

      {ratesSyncSuccess ? (
        <div className="p-3 text-xs bg-[hsl(var(--success-subtle))] border border-[hsl(var(--success)/0.3)] text-[hsl(var(--success))] rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" /> Latest exchange rates synchronized successfully.
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

      {/* 2. Notifications & Multi-Channel Reminder Dispatch */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[hsl(var(--primary))]" />
            <CardTitle>Renewal Alerts & Dispatch Channels</CardTitle>
          </div>
          <Badge variant="success" size="sm">
            Channels Active
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
            Quiet, transactional notifications sent before scheduled renewal debits or
            when free trials convert.
          </p>

          {/* Web Push Notification Section */}
          <div className="p-3.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.5)] space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                  Browser Web Push Alerts
                </div>
                <div className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  {isPushSupported ? (
                    isPushSubscribed ? (
                      <span className="text-[hsl(var(--success))] font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active on this browser
                      </span>
                    ) : (
                      'Opt in to receive native browser push reminders'
                    )
                  ) : (
                    <span className="text-[hsl(var(--muted-foreground))]">
                      Web Push is not supported on this browser (requires HTTPS/PWA)
                    </span>
                  )}
                </div>
              </div>

              {isPushSupported ? (
                <div className="flex items-center gap-2">
                  {isPushSubscribed ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleTestPush}
                      isLoading={isPushLoading}
                      className="text-xs text-[hsl(var(--primary))]"
                    >
                      Test Push
                    </Button>
                  ) : null}

                  <Button
                    type="button"
                    variant={isPushSubscribed ? 'outline' : 'primary'}
                    size="sm"
                    onClick={handleTogglePush}
                    isLoading={isPushLoading}
                    className="text-xs shrink-0"
                  >
                    {isPushSubscribed ? 'Disable Push' : 'Enable Web Push'}
                  </Button>
                </div>
              ) : null}
            </div>

            {pushActionStatus ? (
              <div className="p-2.5 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[11px] text-[hsl(var(--foreground))]">
                {pushActionStatus}
              </div>
            ) : null}
          </div>

          {/* Email Dispatch & Test Trigger */}
          <div className="p-3.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.5)] space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                  Resend Transactional Email
                </div>
                <div className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  Scheduled dispatch to <span className="font-mono font-semibold">{user?.email || profile?.email || 'your email'}</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTriggerEmailDispatch}
                isLoading={isDispatching}
                className="gap-1.5 text-xs shrink-0"
              >
                <Zap className="w-3 h-3 text-[hsl(var(--primary))]" />
                Test Dispatch Now
              </Button>
            </div>

            {emailDispatchStatus ? (
              <div className="p-2.5 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[11px] text-[hsl(var(--foreground))]">
                {emailDispatchStatus}
              </div>
            ) : null}
          </div>

          {/* Alert Type Toggles */}
          <div className="space-y-3 pt-1">
            <label className="flex items-center justify-between p-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] cursor-pointer">
              <div className="space-y-0.5 pr-2">
                <div className="text-xs font-medium text-[hsl(var(--foreground))]">
                  Master In-App & Remote Alerts
                </div>
                <div className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  Enable or silence all automated reminder emails, push alerts, and dashboard banners
                </div>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-[hsl(var(--primary))] border-[hsl(var(--border))] accent-[hsl(var(--primary))]"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] cursor-pointer">
              <div className="space-y-0.5 pr-2">
                <div className="text-xs font-medium text-[hsl(var(--foreground))]">
                  Upcoming Renewal Alerts
                </div>
                <div className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  Warn before regular monthly, quarterly, and annual subscription charges
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyRenewals}
                onChange={(e) => setNotifyRenewals(e.target.checked)}
                disabled={!notificationsEnabled}
                className="w-4 h-4 rounded text-[hsl(var(--primary))] border-[hsl(var(--border))] accent-[hsl(var(--primary))]"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] cursor-pointer">
              <div className="space-y-0.5 pr-2">
                <div className="text-xs font-medium text-[hsl(var(--foreground))]">
                  Free Trial Expiration Alerts
                </div>
                <div className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  Urgent alerts before trial services convert to paid subscriptions
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyTrials}
                onChange={(e) => setNotifyTrials(e.target.checked)}
                disabled={!notificationsEnabled}
                className="w-4 h-4 rounded text-[hsl(var(--primary))] border-[hsl(var(--border))] accent-[hsl(var(--primary))]"
              />
            </label>
          </div>

          {/* Reminder Offset Chips */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
              Default Renewal Alert Offsets
            </label>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
              Alert triggers will generate at these intervals before charge dates:
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
        </CardContent>
      </Card>

      {/* 3. Workspace & Multi-Currency Preferences */}
      <form onSubmit={handleSaveProfile}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[hsl(var(--primary))]" />
              <CardTitle>Workspace & Display Currency</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
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

            <Select
              label="Primary Display Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              helperText="All recurring subscription run-rates and dashboard totals will be converted and shown in this currency."
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name} ({c.symbol})
                </option>
              ))}
            </Select>

            {/* Exchange Rates Status & Sync Card */}
            <div className="p-3.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.5)] space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                    Exchange Rate Engine
                  </div>
                  <div className="text-[11px] text-[hsl(var(--muted-foreground))]">
                    {exchangeRates.source} · Updated {formatDate(exchangeRates.updatedAt)}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSyncRates}
                  isLoading={isSyncingRates}
                  className="gap-1 text-xs shrink-0"
                >
                  <RefreshCw className="w-3 h-3 text-[hsl(var(--primary))]" />
                  Sync Rates
                </Button>
              </div>

              <div className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-3 pt-1 border-t border-[hsl(var(--border))]">
                <span>
                  Base: <strong className="text-[hsl(var(--foreground))]">USD</strong>
                </span>
                <span>·</span>
                <span>
                  Current Rate: 1 USD ≈{' '}
                  <strong className="text-[hsl(var(--foreground))] font-mono">
                    {exchangeRates.rates[currency] || 1.0} {currency}
                  </strong>
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                Save All Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* 4. Data Ownership, Export & Restore */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-[hsl(var(--primary))]" />
            <CardTitle>Data Ownership & Backup</CardTitle>
          </div>
          <Badge variant="outline" size="sm">
            {subscriptions.length} tracked records
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
            Your data belongs to you. You can export complete account backups in open JSON and CSV
            formats, or restore a previous backup to another device at any time.
          </p>

          {/* Export Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 text-xs justify-start"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              Spreadsheet (CSV)
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportJSON}
              className="gap-1.5 text-xs justify-start"
            >
              <Download className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              Full Backup (JSON)
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportPackage}
              className="gap-1.5 text-xs justify-start"
            >
              <Archive className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              Backup Package
            </Button>
          </div>

          {/* Restore & Sample Data Actions */}
          <div className="pt-4 border-t border-[hsl(var(--border))] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                Restore From Backup
              </div>
              <div className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Import a <code className="font-mono">sift-backup-*.json</code> file to restore records
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsRestoreModalOpen(true)}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restore Backup
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => populateStarterTemplates()}
                className="gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Load Samples
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Account & Security Session */}
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

      {/* 6. Cloud Sync & System Status */}
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

      {/* 7. About Sift */}
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

      {/* Restore Modal */}
      <RestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onSuccess={() => {
          setRestoreSuccess(true);
          refresh();
          setTimeout(() => setRestoreSuccess(false), 4000);
        }}
      />
    </div>
  );
}
