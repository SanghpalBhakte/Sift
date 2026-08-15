'use client';

import React from 'react';
import { AccountGroup } from '@/lib/utils/multiAccountDetector';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CreditCard, Layers, ArrowRight, Check, CheckCircle2, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AccountGroupSelectorProps {
  accountColumn: string;
  groups: AccountGroup[];
  totalRows: number;
  selectedGroupKey: string | 'ALL';
  completedGroupKeys: string[];
  onSelectGroup: (key: string | 'ALL') => void;
  onContinue: () => void;
  onBack: () => void;
  onFinishSession?: () => void;
}

export function AccountGroupSelector({
  accountColumn,
  groups,
  totalRows,
  selectedGroupKey,
  completedGroupKeys = [],
  onSelectGroup,
  onContinue,
  onBack,
  onFinishSession,
}: AccountGroupSelectorProps) {
  const selectedGroup = groups.find((g) => g.accountKey === selectedGroupKey);
  const activeCount = selectedGroupKey === 'ALL' ? totalRows : selectedGroup?.rowCount || 0;
  const completedCount = completedGroupKeys.length;
  const allCompleted = completedCount > 0 && completedCount >= groups.length;

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-200">
      <div className="space-y-1 text-center sm:text-left">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.2)]">
            <Layers className="w-3.5 h-3.5" />
            Multi-Account Statement Session
          </div>
          {completedCount > 0 ? (
            <Badge variant="success" size="sm">
              {completedCount} of {groups.length} Accounts Imported
            </Badge>
          ) : null}
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-[hsl(var(--foreground))] tracking-tight">
          {allCompleted ? 'All Account Batches Processed' : 'Select Account Batch to Import'}
        </h2>
        <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-lg">
          We found {groups.length} distinct sub-accounts or card members in the{' '}
          <strong className="font-mono text-[hsl(var(--foreground))]">{accountColumn}</strong>{' '}
          column. Process each batch consecutively without re-uploading.
        </p>
      </div>

      <div className="space-y-3">
        {/* "All Accounts Combined" Option (Only if none imported yet) */}
        {completedCount === 0 ? (
          <div
            onClick={() => onSelectGroup('ALL')}
            className={cn(
              'p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs',
              selectedGroupKey === 'ALL'
                ? 'border-[hsl(var(--primary))] bg-[hsl(var(--card))] ring-1 ring-[hsl(var(--primary)/0.2)]'
                : 'border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.5)] hover:bg-[hsl(var(--surface))]'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                  selectedGroupKey === 'ALL'
                    ? 'bg-[hsl(var(--primary))] text-white'
                    : 'bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))]'
                )}
              >
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-[hsl(var(--foreground))]">
                  All Accounts Combined
                </div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  Scan all {groups.length} sub-accounts together ({totalRows} total transactions)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" size="sm">
                {totalRows} txs
              </Badge>
              {selectedGroupKey === 'ALL' ? (
                <CheckCircle2 className="w-5 h-5 text-[hsl(var(--primary))]" />
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Individual Account Cards */}
        {groups.map((group) => {
          const isCompleted = completedGroupKeys.includes(group.accountKey);
          const isSelected = selectedGroupKey === group.accountKey;

          return (
            <div
              key={group.id}
              onClick={() => {
                if (!isCompleted) {
                  onSelectGroup(group.accountKey);
                }
              }}
              className={cn(
                'p-4 rounded-xl border transition-all flex items-center justify-between gap-3 shadow-xs',
                isCompleted
                  ? 'border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success-subtle)/0.3)] opacity-85 cursor-default'
                  : isSelected
                  ? 'border-[hsl(var(--primary))] bg-[hsl(var(--card))] ring-1 ring-[hsl(var(--primary)/0.2)] cursor-pointer'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.5)] hover:bg-[hsl(var(--surface))] cursor-pointer'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                    isCompleted
                      ? 'bg-[hsl(var(--success))] text-white'
                      : isSelected
                      ? 'bg-[hsl(var(--primary))] text-white'
                      : 'bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))]'
                  )}
                >
                  {isCompleted ? <CheckCheck className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[hsl(var(--foreground))] truncate flex items-center gap-2">
                    <span>{group.label}</span>
                    {isCompleted ? (
                      <Badge variant="success" size="sm">
                        Imported
                      </Badge>
                    ) : (
                      <Badge variant="outline" size="sm">
                        Pending
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] font-mono truncate">
                    ID: {group.accountKey}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono text-[hsl(var(--muted-foreground))]">
                  {group.rowCount} txs
                </span>
                {isSelected && !isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-[hsl(var(--primary))]" />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--border))]">
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          {completedCount > 0 ? 'Restart Session' : 'Upload Different File'}
        </Button>

        {allCompleted ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onFinishSession}
            className="gap-1.5 shadow-xs font-semibold"
          >
            Finish & View Subscriptions <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={selectedGroupKey === 'ALL' && completedCount > 0}
            onClick={onContinue}
            className="gap-1.5 shadow-xs font-semibold"
          >
            Review {selectedGroup?.label || `${activeCount} Transactions`}{' '}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
