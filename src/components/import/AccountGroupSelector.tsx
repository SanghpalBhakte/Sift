'use client';

import React from 'react';
import { AccountGroup } from '@/lib/utils/multiAccountDetector';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CreditCard, Layers, ArrowRight, Check, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AccountGroupSelectorProps {
  accountColumn: string;
  groups: AccountGroup[];
  totalRows: number;
  selectedGroupKey: string | 'ALL';
  onSelectGroup: (key: string | 'ALL') => void;
  onContinue: () => void;
  onBack: () => void;
}

export function AccountGroupSelector({
  accountColumn,
  groups,
  totalRows,
  selectedGroupKey,
  onSelectGroup,
  onContinue,
  onBack,
}: AccountGroupSelectorProps) {
  const selectedGroup = groups.find((g) => g.accountKey === selectedGroupKey);
  const activeCount = selectedGroupKey === 'ALL' ? totalRows : selectedGroup?.rowCount || 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-200">
      <div className="space-y-1 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.2)] mb-1">
          <Layers className="w-3.5 h-3.5" />
          Multi-Account Statement Detected
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-[hsl(var(--foreground))] tracking-tight">
          Select Account to Import
        </h2>
        <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-lg">
          We found {groups.length} distinct sub-accounts or card members in the{' '}
          <strong className="font-mono text-[hsl(var(--foreground))]">{accountColumn}</strong>{' '}
          column. Choose which transactions you want to analyze.
        </p>
      </div>

      <div className="space-y-3">
        {/* "All Accounts Combined" Option */}
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

        {/* Individual Account Cards */}
        {groups.map((group) => {
          const isSelected = selectedGroupKey === group.accountKey;
          return (
            <div
              key={group.id}
              onClick={() => onSelectGroup(group.accountKey)}
              className={cn(
                'p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs',
                isSelected
                  ? 'border-[hsl(var(--primary))] bg-[hsl(var(--card))] ring-1 ring-[hsl(var(--primary)/0.2)]'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.5)] hover:bg-[hsl(var(--surface))]'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                    isSelected
                      ? 'bg-[hsl(var(--primary))] text-white'
                      : 'bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))]'
                  )}
                >
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[hsl(var(--foreground))] truncate">
                    {group.label}
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] font-mono truncate">
                    ID: {group.accountKey}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={isSelected ? 'primary' : 'default'} size="sm">
                  {group.rowCount} txs
                </Badge>
                {isSelected ? (
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
          Upload Different File
        </Button>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onContinue}
          className="gap-1.5 shadow-xs font-semibold"
        >
          Continue with {activeCount} Transactions <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
