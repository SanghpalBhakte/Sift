'use client';

import React, { useState } from 'react';
import { CsvColumnMapping } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Table, ArrowRight, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { autoDetectColumnMapping } from '@/lib/utils/csvParser';

interface ColumnMapperProps {
  headers: string[];
  previewRows: Record<string, string>[];
  initialMapping: CsvColumnMapping;
  isRememberedFormat?: boolean;
  onConfirmMapping: (mapping: CsvColumnMapping) => void;
  onBack: () => void;
}

export function ColumnMapper({
  headers,
  previewRows,
  initialMapping,
  isRememberedFormat = false,
  onConfirmMapping,
  onBack,
}: ColumnMapperProps) {
  const [mapping, setMapping] = useState<CsvColumnMapping>(initialMapping);
  const [isRemembered, setIsRemembered] = useState(isRememberedFormat);
  const [error, setError] = useState<string | null>(null);

  const handleResetToAuto = () => {
    const auto = autoDetectColumnMapping(headers);
    setMapping(auto);
    setIsRemembered(false);
  };

  const handleContinue = () => {
    if (!mapping.dateColumn) {
      setError('Please select a Date column.');
      return;
    }
    if (!mapping.descriptionColumn) {
      setError('Please select a Description or Merchant column.');
      return;
    }
    if (!mapping.amountColumn && !mapping.debitColumn) {
      setError('Please select an Amount or Debit column.');
      return;
    }

    setError(null);
    onConfirmMapping(mapping);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
          Confirm Statement Column Mapping
        </h2>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Verify or adjust the column mappings below to ensure accurate recurring charge detection.
        </p>
      </div>

      {/* Remembered Format Banner */}
      {isRemembered ? (
        <div className="p-3.5 rounded-xl bg-[hsl(var(--primary)/0.06)] border border-[hsl(var(--primary)/0.25)] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[hsl(var(--primary))]">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>
              <strong>Recognized Statement Layout:</strong> Applied your saved column mapping for this bank format.
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetToAuto}
            className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] flex items-center gap-1 hover:underline shrink-0"
          >
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="p-3 text-xs bg-[hsl(var(--danger-subtle))] border border-[hsl(var(--danger)/0.3)] text-[hsl(var(--danger))] rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Mapping Selectors */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-[hsl(var(--primary))]" />
            <CardTitle>Column Definitions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Transaction Date *"
              value={mapping.dateColumn}
              onChange={(e) => {
                setMapping({ ...mapping, dateColumn: e.target.value });
                setIsRemembered(false);
              }}
              helperText="e.g. Posted Date or Date"
            >
              <option value="">-- Select Date Column --</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </Select>

            <Select
              label="Description / Merchant *"
              value={mapping.descriptionColumn}
              onChange={(e) => {
                setMapping({ ...mapping, descriptionColumn: e.target.value });
                setIsRemembered(false);
              }}
              helperText="e.g. Description, Payee, Name"
            >
              <option value="">-- Select Merchant Column --</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </Select>

            <Select
              label="Amount / Charge *"
              value={mapping.amountColumn}
              onChange={(e) => {
                setMapping({ ...mapping, amountColumn: e.target.value });
                setIsRemembered(false);
              }}
              helperText="e.g. Amount, Debit, Spent"
            >
              <option value="">-- Select Amount Column --</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* CSV Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs">Statement Data Preview (First 3 Rows)</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.6)] text-[hsl(var(--muted-foreground))]">
                {headers.map((h) => {
                  const isMapped =
                    h === mapping.dateColumn ||
                    h === mapping.descriptionColumn ||
                    h === mapping.amountColumn;
                  return (
                    <th key={h} className="p-3 font-semibold whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{h}</span>
                        {isMapped ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))]" />
                        ) : null}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {previewRows.slice(0, 3).map((row, rIndex) => (
                <tr key={rIndex} className="hover:bg-[hsl(var(--surface)/0.3)]">
                  {headers.map((h) => (
                    <td
                      key={h}
                      className="p-3 text-[hsl(var(--foreground))] whitespace-nowrap font-mono text-[11px]"
                    >
                      {row[h] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>

        <Button type="button" variant="primary" size="md" onClick={handleContinue} className="gap-1.5">
          Scan for Subscriptions <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
