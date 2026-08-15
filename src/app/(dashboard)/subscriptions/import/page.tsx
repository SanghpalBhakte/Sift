'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { CsvColumnMapping, NormalizedTransaction, RecurringCandidate } from '@/lib/types';
import {
  parseRawCsv,
  autoDetectColumnMapping,
  normalizeTransactions,
} from '@/lib/utils/csvParser';
import { detectRecurringCandidates } from '@/lib/utils/recurringDetector';
import { CsvDropzone } from '@/components/import/CsvDropzone';
import { ColumnMapper } from '@/components/import/ColumnMapper';
import { CandidateReviewCard } from '@/components/import/CandidateReviewCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/currency';
import {
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Plus,
  Sparkles,
  Inbox,
} from 'lucide-react';

type ImportStep = 'upload' | 'map' | 'review' | 'success';

export default function CsvImportPage() {
  const router = useRouter();
  const { categories, profile, addSubscription } = useSubscriptions();

  const [step, setStep] = useState<ImportStep>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<CsvColumnMapping>({
    dateColumn: '',
    descriptionColumn: '',
    amountColumn: '',
  });

  const [normalizedTransactions, setNormalizedTransactions] = useState<NormalizedTransaction[]>([]);
  const [candidates, setCandidates] = useState<RecurringCandidate[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const currency = profile?.currency_preference || 'USD';

  // Step 1: File Loaded
  const handleFileLoaded = (csvContent: string, name: string) => {
    setFileName(name);
    const { headers, rows } = parseRawCsv(csvContent);

    if (headers.length === 0 || rows.length === 0) {
      alert('The CSV file could not be parsed. Please check the file structure.');
      return;
    }

    setCsvHeaders(headers);
    setCsvRows(rows);

    const detectedMapping = autoDetectColumnMapping(headers);
    setColumnMapping(detectedMapping);

    // If auto-detection succeeded with high confidence, normalize and proceed to mapping
    setStep('map');
  };

  // Step 2: Columns Confirmed
  const handleConfirmMapping = (confirmedMapping: CsvColumnMapping) => {
    setColumnMapping(confirmedMapping);
    const normalized = normalizeTransactions(csvRows, confirmedMapping);
    setNormalizedTransactions(normalized);

    const detected = detectRecurringCandidates(normalized, categories, currency);
    setCandidates(detected);
    setStep('review');
  };

  // Step 3: Candidate Selection
  const toggleCandidateSelect = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleUpdateCandidate = (id: string, updates: Partial<RecurringCandidate>) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setCandidates((prev) => prev.map((c) => ({ ...c, selected: select })));
  };

  // Execute Batch Import
  const handleExecuteImport = async () => {
    const selectedCandidates = candidates.filter((c) => c.selected);
    if (selectedCandidates.length === 0) {
      alert('Please select at least one subscription candidate to import.');
      return;
    }

    setIsImporting(true);
    let count = 0;

    try {
      for (const candidate of selectedCandidates) {
        await addSubscription({
          name: candidate.merchantName,
          amount: candidate.amount,
          currency: candidate.currency,
          billing_cycle: candidate.billingCycle,
          status: 'active',
          category_id: candidate.suggestedCategoryId,
          start_date: candidate.firstDate,
          next_renewal_date: candidate.estimatedNextRenewal,
          is_trial: false,
          reminder_offsets: profile?.default_reminder_days || [7, 3, 1],
          value_rating: candidate.valueRating,
          notes: `Imported from ${fileName} (${candidate.transactionCount} transactions detected)`,
        });
        count++;
      }

      setImportedCount(count);
      setStep('success');
    } catch (err: any) {
      console.error('Error importing subscriptions:', err);
      alert(`Import error: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount = candidates.filter((c) => c.selected).length;
  const selectedMonthlyTotal = candidates
    .filter((c) => c.selected)
    .reduce((acc, c) => {
      if (c.billingCycle === 'yearly') return acc + c.amount / 12;
      if (c.billingCycle === 'quarterly') return acc + c.amount / 3;
      return acc + c.amount;
    }, 0);

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-3">
          <Link
            href="/subscriptions"
            className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
              Import Statement CSV
            </h1>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Detect recurring subscriptions from bank or card statements
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))] font-mono">
          <span className={step === 'upload' ? 'text-[hsl(var(--primary))] font-bold' : ''}>
            1. Upload
          </span>
          <span>→</span>
          <span className={step === 'map' ? 'text-[hsl(var(--primary))] font-bold' : ''}>
            2. Map
          </span>
          <span>→</span>
          <span className={step === 'review' ? 'text-[hsl(var(--primary))] font-bold' : ''}>
            3. Review
          </span>
        </div>
      </div>

      {/* STEP 1: Upload */}
      {step === 'upload' ? (
        <CsvDropzone onFileLoaded={handleFileLoaded} />
      ) : null}

      {/* STEP 2: Map Columns */}
      {step === 'map' ? (
        <ColumnMapper
          headers={csvHeaders}
          previewRows={csvRows}
          initialMapping={columnMapping}
          onConfirmMapping={handleConfirmMapping}
          onBack={() => setStep('upload')}
        />
      ) : null}

      {/* STEP 3: Review Candidates */}
      {step === 'review' ? (
        <div className="space-y-6">
          {/* Summary bar */}
          <div className="p-4 rounded-xl bg-[hsl(var(--surface)/0.6)] border border-[hsl(var(--border))] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-[hsl(var(--foreground))]">
                {candidates.length} Recurring Service{candidates.length === 1 ? '' : 's'} Detected
              </div>
              <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                Scanned {normalizedTransactions.length} statement transactions from{' '}
                <span className="font-mono">{fileName}</span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-sm font-bold text-[hsl(var(--foreground))] font-mono">
                +{formatCurrency(selectedMonthlyTotal, currency)}/mo
              </div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                {selectedCount} selected for import
              </div>
            </div>
          </div>

          {/* Candidates List or Empty State */}
          {candidates.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))]">
              <Inbox className="w-8 h-8 mx-auto text-[hsl(var(--muted-foreground))]" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  No recurring patterns detected
                </h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-sm mx-auto">
                  We could not find repeated recurring charges in this statement. You can always add
                  subscriptions manually.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep('map')}
                className="text-xs"
              >
                Adjust Column Mapping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-[hsl(var(--muted-foreground))] font-medium">
                  Review & customize before adding to your ledger:
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="text-[11px] text-[hsl(var(--primary))] hover:underline"
                  >
                    Select All
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="text-[11px] text-[hsl(var(--muted-foreground))] hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {candidates.map((candidate) => (
                  <CandidateReviewCard
                    key={candidate.id}
                    candidate={candidate}
                    categories={categories}
                    onToggleSelect={toggleCandidateSelect}
                    onUpdateCandidate={handleUpdateCandidate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--border))]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep('map')}
            >
              Back to Mapping
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={selectedCount === 0}
              isLoading={isImporting}
              onClick={handleExecuteImport}
              className="gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Import {selectedCount} Subscription{selectedCount === 1 ? '' : 's'}
            </Button>
          </div>
        </div>
      ) : null}

      {/* STEP 4: Success */}
      {step === 'success' ? (
        <Card className="text-center py-10 px-4 space-y-5 max-w-lg mx-auto">
          <div className="w-14 h-14 mx-auto rounded-full bg-[hsl(var(--success-subtle))] flex items-center justify-center text-[hsl(var(--success))] shadow-xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
              Import Completed Successfully!
            </h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-sm mx-auto">
              Added <strong>{importedCount} new subscription{importedCount === 1 ? '' : 's'}</strong> to
              your Sift ledger. Renewal schedules and burn rates have been recalculated.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/subscriptions">
              <Button variant="primary" size="md">
                View Subscriptions
              </Button>
            </Link>

            <Link href="/">
              <Button variant="outline" size="md">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
