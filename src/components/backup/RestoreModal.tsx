'use client';

import React, { useState, useRef } from 'react';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { BackupValidationResult, SiftBackupData } from '@/lib/types';
import {
  validateBackupJson,
  remapCategoryBenchmarkOverrides,
  findCategorySuggestion,
} from '@/lib/utils/backup';
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
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/dates';

interface RestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface RestoreCompletionSummary {
  subscriptionCount: number;
  mode: 'merge' | 'replace';
  globalBenchmark: number;
  activeOverridesCount: number;
  skippedItems: Array<{
    name: string;
    slug?: string;
    benchmark: number;
    reason: 'collision' | 'unmatched';
    details?: string;
  }>;
}

export function RestoreModal({ isOpen, onClose, onSuccess }: RestoreModalProps) {
  const { subscriptions, categories, addSubscription, deleteSubscription, updateProfile } =
    useSubscriptions();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [validation, setValidation] = useState<BackupValidationResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [manualRemappings, setManualRemappings] = useState<Record<string, string>>({});
  const [restoreResult, setRestoreResult] = useState<RestoreCompletionSummary | null>(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setRestoreResult(null);
    setValidation(null);
    setFileName('');
    setManualRemappings({});
    setIsDetailsExpanded(false);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setManualRemappings({});
    setRestoreResult(null);
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
        const benchmarkReport = remapCategoryBenchmarkOverrides(
          backup.profile.category_annual_benchmarks || {},
          backup.categories || [],
          categories
        );

        // Merge user-confirmed manual remappings on top of auto-mapped benchmarks
        const finalBenchmarks = { ...benchmarkReport.remappedBenchmarks };
        const rawBackupBenchmarks = backup.profile.category_annual_benchmarks || {};

        for (const [sourceKey, targetCatId] of Object.entries(manualRemappings)) {
          if (
            targetCatId &&
            targetCatId !== 'skip' &&
            typeof rawBackupBenchmarks[sourceKey] === 'number'
          ) {
            finalBenchmarks[targetCatId] = rawBackupBenchmarks[sourceKey];
          }
        }

        await updateProfile({
          currency_preference: backup.profile.currency_preference,
          theme_preference: backup.profile.theme_preference,
          default_reminder_days: backup.profile.default_reminder_days,
          annual_benchmark_percent: backup.profile.annual_benchmark_percent ?? 16.7,
          category_annual_benchmarks: finalBenchmarks,
        });

        // Compute skipped items that were not manually remapped
        const skippedItems = [
          ...benchmarkReport.collisions
            .filter((c) => !manualRemappings[c.sourceKey] || manualRemappings[c.sourceKey] === 'skip')
            .map((c) => ({
              name: c.sourceName || c.sourceSlug,
              slug: c.sourceSlug,
              benchmark: c.configuredBenchmark,
              reason: 'collision' as const,
              details: `Matched ${c.conflictingCategories.length} local categories (${c.conflictingCategories.map((cat) => `"${cat.name}"`).join(', ')})`,
            })),
          ...benchmarkReport.unmatched
            .filter((u) => !manualRemappings[u.sourceKey] || manualRemappings[u.sourceKey] === 'skip')
            .map((u) => ({
              name: u.sourceName || u.sourceSlug || u.sourceKey,
              slug: u.sourceSlug,
              benchmark: u.configuredBenchmark,
              reason: 'unmatched' as const,
              details: 'Category is not present in this workspace',
            })),
        ];

        setRestoreResult({
          subscriptionCount: backup.subscriptions.length,
          mode: restoreMode,
          globalBenchmark: backup.profile.annual_benchmark_percent ?? 16.7,
          activeOverridesCount: Object.keys(finalBenchmarks).length,
          skippedItems,
        });
      } else {
        setRestoreResult({
          subscriptionCount: backup.subscriptions.length,
          mode: restoreMode,
          globalBenchmark: 16.7,
          activeOverridesCount: 0,
          skippedItems: [],
        });
      }

      onSuccess();
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

          {restoreResult ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-success/30 bg-success-subtle text-success flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-success" />
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-foreground">
                    Workspace Restore Complete
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Successfully {restoreResult.mode === 'replace' ? 'replaced' : 'imported and merged'}{' '}
                    {restoreResult.subscriptionCount} subscriptions into your active workspace.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-lg border border-border bg-surface/50 text-center">
                  <div className="text-[10px] text-muted-foreground">Subscriptions</div>
                  <div className="text-sm font-bold text-foreground font-mono">
                    {restoreResult.subscriptionCount}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-surface/50 text-center">
                  <div className="text-[10px] text-muted-foreground">Global Benchmark</div>
                  <div className="text-sm font-bold text-foreground font-mono">
                    {restoreResult.globalBenchmark}%
                  </div>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-surface/50 text-center col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-muted-foreground">Category Overrides</div>
                  <div className="text-sm font-bold text-foreground font-mono">
                    {restoreResult.activeOverridesCount} Active
                  </div>
                </div>
              </div>

              {/* Skipped Items Notice & Accordion */}
              {restoreResult.skippedItems.length > 0 ? (
                <div className="p-3.5 rounded-xl border border-border bg-surface/40 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                      <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                      <span>
                        {restoreResult.skippedItems.length} Category Override
                        {restoreResult.skippedItems.length === 1 ? '' : 's'} Skipped
                      </span>
                    </div>
                    <a
                      href="#category-benchmarks"
                      onClick={handleClose}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>Fix in Settings</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    These category overrides were skipped to preserve safety and will default to your global{' '}
                    {restoreResult.globalBenchmark}% benchmark. You can configure them anytime in Settings.
                  </p>

                  <div className="pt-1 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                      className="flex items-center justify-between w-full py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <span>
                        {isDetailsExpanded
                          ? 'Hide skipped item details'
                          : 'Show skipped item details'}
                      </span>
                      {isDetailsExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isDetailsExpanded ? (
                      <div className="space-y-1.5 pt-2 animate-in fade-in duration-150">
                        {restoreResult.skippedItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-card border border-border flex items-center justify-between gap-2 text-[11px]"
                          >
                            <div className="min-w-0">
                              <div className="font-medium text-foreground truncate">
                                {item.name}{' '}
                                {item.slug ? (
                                  <span className="font-mono text-muted-foreground text-[10px]">
                                    ({item.slug})
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-[10px] text-muted-foreground">{item.details}</div>
                            </div>
                            <Badge
                              variant="outline"
                              size="sm"
                              className="font-mono text-[10px] shrink-0"
                            >
                              {item.benchmark}% Skipped
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <>
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
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[hsl(var(--foreground))]">
                      Select Sift JSON Backup File
                    </div>
                    <div className="text-[11px] text-[hsl(var(--muted-foreground))]">
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
                      {validation.data?.profile?.annual_benchmark_percent !== undefined ? (
                        <div>
                          <span className="text-[hsl(var(--muted-foreground))]">Discount Benchmark: </span>
                          <span className="font-semibold text-[hsl(var(--foreground))]">
                            {validation.data.profile.annual_benchmark_percent}%
                          </span>
                        </div>
                      ) : null}
                      {(() => {
                        if (
                          !validation.data?.profile?.category_annual_benchmarks ||
                          Object.keys(validation.data.profile.category_annual_benchmarks).length === 0
                        ) {
                          return null;
                        }
                        const rep = remapCategoryBenchmarkOverrides(
                          validation.data.profile.category_annual_benchmarks,
                          validation.data.categories || [],
                          categories
                        );
                        const parts: string[] = [];
                        if (rep.matchedByUuid > 0) parts.push(`${rep.matchedByUuid} by ID`);
                        if (rep.matchedBySlug > 0) parts.push(`${rep.matchedBySlug} by slug fallback`);
                        if (rep.skippedAmbiguous > 0) parts.push(`${rep.skippedAmbiguous} ambiguous skipped`);
                        if (rep.skippedMissing > 0) parts.push(`${rep.skippedMissing} missing skipped`);

                        return (
                          <div className="col-span-2 text-[10px] text-[hsl(var(--muted-foreground))] pt-1 border-t border-[hsl(var(--border)/0.5)]">
                            <span className="font-semibold text-[hsl(var(--foreground))]">
                              Category Overrides ({Object.keys(validation.data.profile.category_annual_benchmarks).length}):{' '}
                            </span>
                            <span>{parts.join(', ') || 'No overrides mapped'}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Interactive Category Benchmark Remapping & Recovery Callout */}
                  {(() => {
                    if (!validation.data?.profile?.category_annual_benchmarks) return null;
                    const rep = remapCategoryBenchmarkOverrides(
                      validation.data.profile.category_annual_benchmarks,
                      validation.data.categories || [],
                      categories
                    );

                    if (rep.collisions.length === 0 && rep.unmatched.length === 0) return null;

                    const globalBenchmark = validation.data?.profile?.annual_benchmark_percent ?? 16.7;
                    const manuallyRemappedCount = Object.values(manualRemappings).filter(
                      (v) => v && v !== 'skip'
                    ).length;

                    return (
                      <div className="p-3.5 rounded-xl border border-border bg-surface/40 space-y-3 text-xs">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 font-semibold text-foreground">
                            <Layers className="w-3.5 h-3.5 text-primary" />
                            <span>Interactive Category Recovery (Optional)</span>
                          </div>
                          <Badge
                            variant={manuallyRemappedCount > 0 ? 'primary' : 'outline'}
                            size="sm"
                            className="text-[10px] font-mono"
                          >
                            {manuallyRemappedCount} of {rep.collisions.length + rep.unmatched.length} Remapped
                          </Badge>
                        </div>

                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          The following category overrides could not be matched automatically and will stay skipped by default. You can optionally remap them to a local workspace category below.
                        </p>

                        {/* Collisions List */}
                        {rep.collisions.length > 0 ? (
                          <div className="space-y-2 pt-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                              Ambiguous Matches ({rep.collisions.length})
                            </span>
                            {rep.collisions.map((col) => {
                              const currentSelection = manualRemappings[col.sourceKey] || 'skip';
                              const suggestion = findCategorySuggestion(col.sourceName || col.sourceSlug, categories);
                              const isCustom = currentSelection !== 'skip';

                              return (
                                <div
                                  key={col.sourceKey}
                                  className={`p-2.5 rounded-lg border transition-all space-y-2 ${
                                    isCustom ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="space-y-0.5 min-w-0">
                                      <div className="font-semibold text-foreground text-[11px] truncate flex items-center gap-1.5">
                                        <span>{col.sourceName}</span>
                                        <span className="font-mono text-muted-foreground font-normal text-[10px]">
                                          ({col.sourceSlug})
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-muted-foreground">
                                        Matched {col.conflictingCategories.length} local categories ({col.conflictingCategories.map((c) => `"${c.name}"`).join(', ')})
                                      </div>
                                    </div>
                                    <Badge
                                      variant={isCustom ? 'primary' : 'warning'}
                                      size="sm"
                                      className="font-mono text-[10px] shrink-0"
                                    >
                                      {col.configuredBenchmark}% {isCustom ? 'Remapped' : 'Skipped'}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-2 pt-1.5 border-t border-border/50">
                                    <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                                      Map to:
                                    </span>
                                    <select
                                      value={currentSelection}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'skip') {
                                          const next = { ...manualRemappings };
                                          delete next[col.sourceKey];
                                          setManualRemappings(next);
                                        } else {
                                          setManualRemappings({
                                            ...manualRemappings,
                                            [col.sourceKey]: val,
                                          });
                                        }
                                      }}
                                      className="w-full h-7 px-2 text-[11px] rounded-md border border-border bg-surface text-foreground font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                      <option value="skip">
                                        Skip (Use global {globalBenchmark}% benchmark)
                                      </option>
                                      {suggestion ? (
                                        <option value={suggestion.category.id}>
                                          Suggested: {suggestion.category.name} ({Math.round(suggestion.similarity * 100)}% match)
                                        </option>
                                      ) : null}
                                      <optgroup label="Available Workspace Categories">
                                        {categories.map((c) => (
                                          <option key={c.id} value={c.id}>
                                            {c.name}
                                          </option>
                                        ))}
                                      </optgroup>
                                    </select>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}

                        {/* Unmatched List */}
                        {rep.unmatched.length > 0 ? (
                          <div className="space-y-2 pt-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                              Unmatched Categories ({rep.unmatched.length})
                            </span>
                            {rep.unmatched.map((un) => {
                              const currentSelection = manualRemappings[un.sourceKey] || 'skip';
                              const suggestion = findCategorySuggestion(un.sourceName || un.sourceSlug || '', categories);
                              const isCustom = currentSelection !== 'skip';

                              return (
                                <div
                                  key={un.sourceKey}
                                  className={`p-2.5 rounded-lg border transition-all space-y-2 ${
                                    isCustom ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="space-y-0.5 min-w-0">
                                      <div className="font-semibold text-foreground text-[11px] truncate flex items-center gap-1.5">
                                        <span>{un.sourceName || un.sourceSlug || un.sourceKey}</span>
                                        {un.sourceSlug ? (
                                          <span className="font-mono text-muted-foreground font-normal text-[10px]">
                                            ({un.sourceSlug})
                                          </span>
                                        ) : null}
                                      </div>
                                      <div className="text-[10px] text-muted-foreground">
                                        Category not present in current workspace
                                      </div>
                                    </div>
                                    <Badge
                                      variant={isCustom ? 'primary' : 'outline'}
                                      size="sm"
                                      className="font-mono text-[10px] shrink-0"
                                    >
                                      {un.configuredBenchmark}% {isCustom ? 'Remapped' : 'Skipped'}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-2 pt-1.5 border-t border-border/50">
                                    <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                                      Map to:
                                    </span>
                                    <select
                                      value={currentSelection}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'skip') {
                                          const next = { ...manualRemappings };
                                          delete next[un.sourceKey];
                                          setManualRemappings(next);
                                        } else {
                                          setManualRemappings({
                                            ...manualRemappings,
                                            [un.sourceKey]: val,
                                          });
                                        }
                                      }}
                                      className="w-full h-7 px-2 text-[11px] rounded-md border border-border bg-surface text-foreground font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                      <option value="skip">
                                        Skip (Use global {globalBenchmark}% benchmark)
                                      </option>
                                      {suggestion ? (
                                        <option value={suggestion.category.id}>
                                          Suggested: {suggestion.category.name} ({Math.round(suggestion.similarity * 100)}% match)
                                        </option>
                                      ) : null}
                                      <optgroup label="Available Workspace Categories">
                                        {categories.map((c) => (
                                          <option key={c.id} value={c.id}>
                                            {c.name}
                                          </option>
                                        ))}
                                      </optgroup>
                                    </select>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })()}

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
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[hsl(var(--border))] flex items-center justify-between">
          {restoreResult ? (
            <div className="flex items-center justify-between w-full gap-2">
              {restoreResult.skippedItems.length > 0 ? (
                <a href="#category-benchmarks" onClick={handleClose}>
                  <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs">
                    <span>Fix Category Mappings</span>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </a>
              ) : (
                <div />
              )}

              <Button type="button" variant="primary" size="sm" onClick={handleClose}>
                Done
              </Button>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
