'use client';

import React, { useState, useEffect } from 'react';
import {
  CustomBankRule,
  getCustomBankRules,
  saveCustomBankRule,
  deleteCustomBankRule,
  toggleCustomBankRule,
  testCustomRule,
} from '@/lib/utils/statementMappingMemory';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Play,
  Sparkles,
  Sliders,
} from 'lucide-react';

export function CustomBankRulesManager() {
  const [rules, setRules] = useState<CustomBankRule[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [bankName, setBankName] = useState('');
  const [filePattern, setFilePattern] = useState('');
  const [headerKeywords, setHeaderKeywords] = useState('');
  const [headerRegex, setHeaderRegex] = useState('');

  // Test state
  const [testFileName, setTestFileName] = useState('');
  const [testHeaders, setTestHeaders] = useState('');
  const [testResult, setTestResult] = useState<{ matches: boolean; matchedBy: string[] } | null>(
    null
  );

  const loadRules = () => {
    setRules(getCustomBankRules());
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleStartAdd = () => {
    setEditingId(null);
    setBankName('');
    setFilePattern('');
    setHeaderKeywords('');
    setHeaderRegex('');
    setTestResult(null);
    setIsEditing(true);
  };

  const handleStartEdit = (rule: CustomBankRule) => {
    setEditingId(rule.id);
    setBankName(rule.bankName);
    setFilePattern(rule.filePattern || '');
    setHeaderKeywords(rule.headerKeywords.join(', '));
    setHeaderRegex(rule.headerRegexPattern || '');
    setTestResult(null);
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) return;

    const keywords = headerKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    saveCustomBankRule({
      id: editingId || undefined,
      bankName: bankName.trim(),
      filePattern: filePattern.trim() || undefined,
      headerKeywords: keywords,
      headerRegexPattern: headerRegex.trim() || undefined,
      isEnabled: true,
    });

    setIsEditing(false);
    loadRules();
  };

  const handleDelete = (id: string) => {
    deleteCustomBankRule(id);
    loadRules();
  };

  const handleToggle = (id: string, current: boolean) => {
    toggleCustomBankRule(id, !current);
    loadRules();
  };

  const handleRunTest = () => {
    const keywords = headerKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    const headersArray = testHeaders
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);

    const tempRule: CustomBankRule = {
      id: 'test',
      bankName: bankName || 'Test Provider',
      filePattern: filePattern.trim() || undefined,
      headerKeywords: keywords,
      headerRegexPattern: headerRegex.trim() || undefined,
      isEnabled: true,
      createdAt: '',
      updatedAt: '',
    };

    const res = testCustomRule(tempRule, headersArray, testFileName);
    setTestResult(res);
  };

  return (
    <Card className="border-[hsl(var(--border))]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[hsl(var(--primary))]" />
            <CardTitle>Custom Bank Recognition Rules</CardTitle>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleStartAdd}
            className="gap-1 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Rule
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-xs">
        <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
          Define custom pattern matchers for regional credit unions and international banks. Custom
          rules execute with high priority before built-in bank templates.
        </p>

        {/* Rule Editor Drawer / Card */}
        {isEditing ? (
          <form
            onSubmit={handleSave}
            className="p-4 rounded-xl border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--surface)/0.5)] space-y-3.5 animate-in fade-in duration-150"
          >
            <div className="font-semibold text-sm text-[hsl(var(--foreground))] flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[hsl(var(--primary))]" />
              {editingId ? 'Edit Bank Recognition Rule' : 'New Bank Recognition Rule'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Bank / Provider Name *"
                placeholder="e.g. First Tech Federal CU"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
              />

              <Input
                label="Filename Substring or Pattern"
                placeholder="e.g. firsttech_.*\.csv or firsttech"
                value={filePattern}
                onChange={(e) => setFilePattern(e.target.value)}
                helperText="Matches statement file names"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Required Header Keywords (comma-separated)"
                placeholder="e.g. trans_date, description, debit"
                value={headerKeywords}
                onChange={(e) => setHeaderKeywords(e.target.value)}
                helperText="All keywords must exist in the CSV headers"
              />

              <Input
                label="Optional Header Regex Pattern"
                placeholder="e.g. (posted_date|booking_date)"
                value={headerRegex}
                onChange={(e) => setHeaderRegex(e.target.value)}
                helperText="Evaluated safely against joined headers"
              />
            </div>

            {/* In-Line Rule Sandbox Tester */}
            <div className="p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] space-y-2">
              <div className="text-[11px] font-semibold text-[hsl(var(--foreground))] flex items-center justify-between">
                <span>Rule Verification Sandbox</span>
                <button
                  type="button"
                  onClick={handleRunTest}
                  className="text-[11px] font-medium text-[hsl(var(--primary))] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3" /> Test Matcher
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Sample filename (e.g. firsttech_export.csv)"
                  value={testFileName}
                  onChange={(e) => setTestFileName(e.target.value)}
                  className="sift-input text-xs py-1 px-2"
                />
                <input
                  type="text"
                  placeholder="Sample headers (e.g. trans_date, description, debit, balance)"
                  value={testHeaders}
                  onChange={(e) => setTestHeaders(e.target.value)}
                  className="sift-input text-xs py-1 px-2"
                />
              </div>

              {testResult ? (
                <div
                  className={`p-2 rounded text-[11px] flex items-center gap-1.5 ${
                    testResult.matches
                      ? 'bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))] font-medium'
                      : 'bg-[hsl(var(--danger-subtle))] text-[hsl(var(--danger))]'
                  }`}
                >
                  {testResult.matches ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Match Success! {testResult.matchedBy.join(' · ')}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Rule did not match the test inputs.</span>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Rule
              </Button>
            </div>
          </form>
        ) : null}

        {/* Existing Rules List */}
        {rules.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-[hsl(var(--border))] text-center text-[hsl(var(--muted-foreground))]">
            No custom bank rules defined. Sift uses built-in fingerprints for major banks
            automatically.
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border))]">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[hsl(var(--foreground))] text-sm">
                      {rule.bankName}
                    </span>
                    <Badge variant={rule.isEnabled ? 'success' : 'muted'} size="sm">
                      {rule.isEnabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>

                  <div className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-2 flex-wrap font-mono">
                    {rule.filePattern ? <span>File: {rule.filePattern}</span> : null}
                    {rule.headerKeywords.length > 0 ? (
                      <span>Keywords: [{rule.headerKeywords.join(', ')}]</span>
                    ) : null}
                    {rule.headerRegexPattern ? <span>Regex: /{rule.headerRegexPattern}/</span> : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(rule.id, rule.isEnabled)}
                    className="text-xs"
                  >
                    {rule.isEnabled ? 'Disable' : 'Enable'}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStartEdit(rule)}
                    className="text-xs text-[hsl(var(--primary))]"
                  >
                    Edit
                  </Button>

                  <button
                    type="button"
                    onClick={() => handleDelete(rule.id)}
                    title="Delete rule"
                    className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--danger))] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
