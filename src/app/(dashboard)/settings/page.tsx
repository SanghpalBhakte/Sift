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
import { clearSavedStatementMappings } from '@/lib/utils/statementMappingMemory';
import { CustomBankRulesManager } from '@/components/settings/CustomBankRulesManager';
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
  Globe,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';

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
      <div className="pb-2 border-b border-border">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Settings & Preferences
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Workspace personalization, multi-currency display, browser push & email reminders, and open data
          backup
        </p>
      </div>

      {savedSuccess ? (
        <div className="p-3 text-xs bg-success-subtle border border-success/30 text-success rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" /> Preferences saved successfully.
        </div>
      ) : null}

      {restoreSuccess ? (
        <div className="p-3 text-xs bg-success-subtle border border-success/30 text-success rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" /> Workspace backup restored successfully.
        </div>
      ) : null}

      {ratesSyncSuccess ? (
        <div className="p-3 text-xs bg-success-subtle border border-success/30 text-success rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" /> Latest exchange rates synchronized successfully.
        </div>
      ) : null}

      {/* 1. Appearance & Theme */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            <CardTitle>Appearance & Theme</CardTitle>
          </div>
          <Badge variant="primary" size="sm">
            {resolvedTheme === 'paper-ledger' ? 'Paper Ledger' : 'Night Shelf'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sift is crafted around two calm identities: <strong className="text-foreground">Paper Ledger</strong> (warm stationery light mode) and <strong className="text-foreground">Night Shelf</strong> (low-glare oiled slate dark mode).
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
            <Bell className="w-4 h-4 text-primary" />
            <CardTitle>Renewal Alerts & Dispatch Channels</CardTitle>
          </div>
          <Badge variant="success" size="sm">
            Channels Active
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Quiet, transactional notifications sent before scheduled renewal debits or
            when free trials convert.
          </p>

          {/* Web Push Notification Section */}
          <div className="p-3.5 rounded-xl border border-border bg-surface/50 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-primary" />
                  Browser Web Push Alerts
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {isPushSupported ? (
                    isPushSubscribed ? (
                      <span className="text-success font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active on this browser
                      </span>
                    ) : (
                      'Opt in to receive native browser push reminders'
                    )
                  ) : (
                    <span className="text-muted-foreground">
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
                      className="text-xs text-primary"
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
              <div className="p-2.5 rounded-lg bg-card border border-border text-[11px] text-foreground">
                {pushActionStatus}
              </div>
            ) : null}
          </div>

          {/* Email Dispatch & Test Trigger */}
          <div className="p-3.5 rounded-xl border border-border bg-surface/50 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  Resend Transactional Email
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Scheduled dispatch to <span className="font-mono font-semibold text-foreground">{user?.email || profile?.email || 'your email'}</span>
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
                <Zap className="w-3 h-3 text-primary" />
                Test Dispatch Now
              </Button>
            </div>

            {emailDispatchStatus ? (
              <div className="p-2.5 rounded-lg bg-card border border-border text-[11px] text-foreground">
                {emailDispatchStatus}
              </div>
            ) : null}
          </div>

          {/* Alert Type Toggles */}
          <div className="space-y-3 pt-1">
            <label className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card cursor-pointer hover:bg-surface/50 transition-colors">
              <div className="space-y-0.5 pr-2">
                <div className="text-xs font-medium text-foreground">
                  Master In-App & Remote Alerts
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Enable or silence all automated reminder emails, push alerts, and dashboard banners
                </div>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-primary border-border accent-primary cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card cursor-pointer hover:bg-surface/50 transition-colors">
              <div className="space-y-0.5 pr-2">
                <div className="text-xs font-medium text-foreground">
                  Upcoming Renewal Alerts
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Warn before regular monthly, quarterly, and annual subscription charges
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyRenewals}
                onChange={(e) => setNotifyRenewals(e.target.checked)}
                disabled={!notificationsEnabled}
                className="w-4 h-4 rounded text-primary border-border accent-primary cursor-pointer disabled:opacity-50"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card cursor-pointer hover:bg-surface/50 transition-colors">
              <div className="space-y-0.5 pr-2">
                <div className="text-xs font-medium text-foreground">
                  Free Trial Expiration Alerts
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Urgent alerts before trial services convert to paid subscriptions
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyTrials}
                onChange={(e) => setNotifyTrials(e.target.checked)}
                disabled={!notificationsEnabled}
                className="w-4 h-4 rounded text-primary border-border accent-primary cursor-pointer disabled:opacity-50"
              />
            </label>
          </div>

          {/* Reminder Offset Chips */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              Default Renewal Alert Offsets
            </label>
            <p className="text-[11px] text-muted-foreground">
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
                    className={cn(
                      'p-2.5 rounded-lg border text-xs font-medium text-center transition-all cursor-pointer',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface/80'
                    )}
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
              <User className="w-4 h-4 text-primary" />
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
            <div className="p-3.5 rounded-xl border border-border bg-surface/50 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    Exchange Rate Engine
                    {ratesSyncSuccess ? (
                      <Badge variant="success" size="sm">
                        Updated
                      </Badge>
                    ) : exchangeRates.isStale ? (
                      <Badge variant="warning" size="sm">
                        Cached (Offline Safe)
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm">
                        Live & Active
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {exchangeRates.source} · Last sync {formatDate(exchangeRates.updatedAt)} (auto-refreshes on reconnect)
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
                  <RefreshCw className="w-3 h-3 text-primary" />
                  Sync Rates
                </Button>
              </div>

              <div className="text-[11px] text-muted-foreground flex items-center gap-3 pt-1 border-t border-border">
                <span>
                  Base: <strong className="text-foreground">USD</strong>
                </span>
                <span>·</span>
                <span>
                  Current Rate: 1 USD ≈{' '}
                  <strong className="text-foreground font-mono">
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
            <Download className="w-4 h-4 text-primary" />
            <CardTitle>Data Ownership & Backup</CardTitle>
          </div>
          <Badge variant="outline" size="sm">
            {subscriptions.length} tracked records
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <p className="text-muted-foreground leading-relaxed">
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
              <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
              Spreadsheet (CSV)
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportJSON}
              className="gap-1.5 text-xs justify-start"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              Full Backup (JSON)
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportPackage}
              className="gap-1.5 text-xs justify-start"
            >
              <Archive className="w-3.5 h-3.5 text-primary" />
              Backup Package
            </Button>
          </div>

          {/* Restore & Sample Data Actions */}
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-primary" />
                Restore From Backup
              </div>
              <div className="text-[11px] text-muted-foreground">
                Import a <code className="font-mono bg-surface-muted px-1 py-0.5 rounded">sift-backup-*.json</code> file to restore records
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
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
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('sift_onboarding_dismissed_v1');
                    window.location.href = '/';
                  }
                }}
                className="gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Reset Guide
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearSavedStatementMappings();
                  alert('Remembered bank statement column mappings have been reset.');
                }}
                className="gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Clear Formats
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => populateStarterTemplates()}
                className="gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Load Samples
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Custom Bank Statement Recognition Rules */}
      <CustomBankRulesManager />

      {/* 6. Account & Security Session */}
      {user ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <CardTitle>Account & Session</CardTitle>
            </div>
            <Badge variant="success" size="sm">
              Signed In
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Authenticated Email</span>
              <span className="font-semibold text-foreground font-mono">
                {user.email}
              </span>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                End current active session
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-xs text-danger hover:bg-danger-subtle gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* 7. Cloud Sync & System Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <CardTitle>Database & Cloud Sync</CardTitle>
          </div>
          <Badge variant={isConfigured ? 'success' : 'default'} size="sm">
            {isConfigured ? 'Supabase Connected' : 'Local Mode'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          {isConfigured ? (
            <p>
              Sift is securely connected to PostgreSQL with Row Level Security (RLS) isolating all
              records to your authenticated account.
            </p>
          ) : (
            <p>
              Sift is operating in <strong className="text-foreground">Local Storage Mode</strong>. Supabase credentials can be
              set in <code className="px-1.5 py-0.5 rounded bg-surface font-mono text-[11px]">.env.local</code>.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 8. About Sift */}
      <Card className="bg-surface/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <CardTitle>About Sift</CardTitle>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">v0.1.0</span>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p>
            Sift is a calm, minimal, mobile-first recurring payments workspace built for clarity,
            financial peace of mind, and zero surprise billings.
          </p>
          <p className="text-[11px] text-muted-foreground">
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
