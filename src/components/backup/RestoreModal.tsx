'use client';

import React, { useState, useRef } from 'react';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { BackupValidationResult, SiftBackupData } from '@/lib/types';
import { validateBackupJson } from '@/lib/utils/backup';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileJson,
  X,
  RefreshCw,
  Layers,
  Trash2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/dates';

interface RestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RestoreModal({ isOpen, onClose, onSuccess }: RestoreModalProps) {
  const { subscriptions, categories, addSubscription, deleteSubscription, updateProfile } =
    useSubscriptions();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [validation, setValidation] = useState<BackupValidationResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      setError('Please select a valid .json Sift backup file.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = validateBackupJson(text);
      if (!result.valid) {
        setError(result.error || 'Invalid backup file structure.');
        setValidation(null);
      } else {
        setValidation(result);
      }
    };
    reader.onerror = () => {
      setError('Failed to read the backup file.');
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!validation?.data) return;
    setIsRestoring(true);
    setError(null);

    try {
      const backup = validation.data;

      // If Replace mode: remove existing subscriptions first
      if (restoreMode === 'replace') {
        for (const sub of subscriptions) {
          await deleteSubscription(sub.id);
        }
      }

      // Restore Subscriptions
      for (const subData of backup.subscriptions) {
        // Match category by slug or name if possible
        const matchedCategory = categories.find(
          (c) => (subData as any).category_slug === c.slug || subData.name.toLowerCase().includes(c.name.toLowerCase())
        );

        await addSubscription({
          name: subData.name,
          description: subData.description,
          amount: subData.amount,
          currency: subData.currency || backup.profile?.currency_preference || 'USD',
          billing_cycle: subData.billing_cycle,
          custom_interval_days: subData.custom_interval_days,
          status: subData.status || 'active',
          category_id: matchedCategory?.id || null,
          start_date: subData.start_date || new Date().toISOString().split('T')[0],
          next_renewal_date: subData.next_renewal_date,
          is_trial: subData.is_trial || false,
          trial_end_date: subData.trial_end_date,
          reminder_offsets: subData.reminder_offsets || [7, 3, 1],
          value_rating: subData.value_rating || 'useful',
          cancel_url: subData.cancel_url,
          notes: subData.notes,
        });
      }

      // Restore Profile Preferences if present
      if (backup.profile) {
        await updateProfile({
          currency_preference: backup.profile.currency_preference,
          theme_preference: backup.profile.theme_preference,
          default_reminder_days: backup.profile.default_reminder_days,
          annual_benchmark_percent: backup.profile.annual_benchmark_percent ?? 16.7,
          category_annual_benchmarks: backup.profile.category_annual_benchmarks ?? {},
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to restore backup:', err);
      setError(`Restore failed: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-[hsl(var(--border))] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[hsl(var(--primary))]" />
            <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
              Restore Sift Account Backup
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface))]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error ? (
            <div className="p-3 text-xs bg-[hsl(var(--danger-subtle))] border border-[hsl(var(--danger)/0.3)] text-[hsl(var(--danger))] rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : null}

          {/* Upload Area */}
          {!validation ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)] rounded-xl p-8 text-center cursor-pointer bg-[hsl(var(--surface)/0.3)] hover:bg-[hsl(var(--surface)/0.6)] transition-all space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 mx-auto rounded-xl bg-[hsl(var(--surface))] flex items-center justify-center text-[hsl(var(--primary))] shadow-xs">
                <FileJson className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  Select Sift Backup JSON
                </div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  Choose a previously exported <code className="font-mono text-[11px]">sift-backup-*.json</code> file
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" className="pointer-events-none text-xs">
                Browse Files
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Validation Summary Card */}
              <div className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.6)] space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" />
                    <span className="font-bold text-[hsl(var(--foreground))]">
                      Valid Backup Archive Verified
                    </span>
                  </div>
                  <Badge variant="primary" size="sm">
                    {validation.counts?.subscriptions} Subscriptions
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[hsl(var(--border))] text-[11px]">
                  <div>
                    <span className="text-[hsl(var(--muted-foreground))]">Export Date: </span>
                    <span className="font-semibold text-[hsl(var(--foreground))]">
                      {formatDate(validation.data?.exported_at || '')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[hsl(var(--muted-foreground))]">Account Email: </span>
                    <span className="font-mono text-[hsl(var(--foreground))]">
                      {validation.data?.user_email}
                    </span>
                  </div>
                  <div>
                    <span className="text-[hsl(var(--muted-foreground))]">Currency: </span>
                    <span className="font-semibold text-[hsl(var(--foreground))]">
                      {validation.data?.profile.currency_preference || 'USD'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[hsl(var(--muted-foreground))]">File: </span>
                    <span className="font-mono text-[hsl(var(--foreground))]">{fileName}</span>
                  </div>
                </div>
              </div>

              {/* Restore Strategy Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))] block">
                  Restore Strategy
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRestoreMode('merge')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      restoreMode === 'merge'
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] ring-1 ring-[hsl(var(--primary)/0.3)]'
                        : 'border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.5)]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-[hsl(var(--foreground))]">
                      <Layers className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                      Merge & Append
                    </div>
                    <div className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">
                      Adds imported items alongside your current {subscriptions.length} existing
                      records.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRestoreMode('replace')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      restoreMode === 'replace'
                        ? 'border-[hsl(var(--danger))] bg-[hsl(var(--danger-subtle))] ring-1 ring-[hsl(var(--danger)/0.3)]'
                        : 'border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.5)]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-[hsl(var(--danger))]">
                      <Trash2 className="w-3.5 h-3.5 text-[hsl(var(--danger))]" />
                      Replace Workspace
                    </div>
                    <div className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">
                      Clears your current {subscriptions.length} records and restores fresh.
                    </div>
                  </button>
                </div>
              </div>

              {restoreMode === 'replace' ? (
                <div className="p-3 text-[11px] bg-[hsl(var(--danger-subtle))] border border-[hsl(var(--danger)/0.3)] text-[hsl(var(--danger))] rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Warning: Replace mode will permanently overwrite current subscriptions.
                  </span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[hsl(var(--border))] flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setValidation(null);
              onClose();
            }}
          >
            Cancel
          </Button>

          {validation ? (
            <Button
              type="button"
              variant={restoreMode === 'replace' ? 'danger' : 'primary'}
              size="sm"
              isLoading={isRestoring}
              onClick={handleExecuteRestore}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Confirm Restore ({validation.counts?.subscriptions} items)
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
