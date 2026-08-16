'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Database,
  Download,
  Trash2,
  Sparkles,
  TrendingUp,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  HelpCircle,
  Clock,
  Info,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="p-1 h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Privacy & Data Policy
            </h1>
            <Badge variant="success" size="sm" className="font-mono text-[10px]">
              Client-Side & Privacy-First
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Plain-English explanation of how Sift handles your financial records, recommendation limits, and storage boundaries.
          </p>
        </div>

        <Link href="/settings">
          <Button variant="outline" size="sm" className="text-xs gap-1.5 self-start sm:self-center">
            <Download className="w-3.5 h-3.5" /> Export My Data in Settings
          </Button>
        </Link>
      </div>

      {/* 1. Core Privacy Principles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 border-border bg-card shadow-xs flex flex-col justify-between gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <EyeOff className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold text-foreground">Zero Surveillance</div>
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              No browser tracking, no app login surveillance, and no background screen time monitors.
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs flex flex-col justify-between gap-2">
          <div className="w-8 h-8 rounded-xl bg-success-subtle flex items-center justify-center text-success">
            <Lock className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold text-foreground">Client-Side Processing</div>
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              Statement imports (CSV/PDF) are parsed directly in your browser. Raw files are never uploaded to parsing APIs.
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs flex flex-col justify-between gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Database className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold text-foreground">Complete Ownership</div>
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              Export your entire workspace in open JSON and CSV formats at any time, or delete records in 1 click.
            </div>
          </div>
        </Card>
      </div>

      {/* 2. What Sift Collects vs What Sift Does NOT Collect */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <CardTitle>Data Collection Matrix</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* What Sift Collects */}
            <div className="p-3.5 rounded-xl border border-success/30 bg-success-subtle/10 space-y-2.5">
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-success" />
                What Sift Collects (Explicit Data)
              </div>
              <ul className="space-y-1.5 text-[11px] text-muted-foreground list-disc list-inside leading-relaxed">
                <li><strong className="text-foreground">Subscription Records:</strong> Name, amount, currency, cadence, renewal dates, optional notes.</li>
                <li><strong className="text-foreground">User Value Ratings:</strong> Essential, useful, rarely used, and cancel candidate tags.</li>
                <li><strong className="text-foreground">Imported Entries:</strong> Dates, names, and transaction amounts extracted from uploaded statements.</li>
                <li><strong className="text-foreground">Workspace Preferences:</strong> Currency preference, theme mode, and reminder offsets.</li>
                <li><strong className="text-foreground">Account Credentials:</strong> Email address for login and session management (when signed in).</li>
              </ul>
            </div>

            {/* What Sift Does NOT Collect */}
            <div className="p-3.5 rounded-xl border border-border bg-surface/50 space-y-2.5">
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <EyeOff className="w-4 h-4 text-primary" />
                What Sift Does NOT Collect (Privacy Boundaries)
              </div>
              <ul className="space-y-1.5 text-[11px] text-muted-foreground list-disc list-inside leading-relaxed">
                <li><strong className="text-foreground">No Browser History:</strong> We cannot see websites or tabs you visit.</li>
                <li><strong className="text-foreground">No App Login Monitoring:</strong> We do not track external service activity.</li>
                <li><strong className="text-foreground">No Bank Logins:</strong> We never request or store online banking passwords.</li>
                <li><strong className="text-foreground">No Behavioral Trackers:</strong> No marketing pixels or ad trackers exist.</li>
                <li><strong className="text-foreground">No AI Model Training:</strong> Your financial data is not used to train models.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. How Recommendations & Insights Work */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <CardTitle>How Sift Recommendations Work</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3.5 text-xs text-muted-foreground leading-relaxed pt-1">
          <p>
            Sift provides an Action Center designed to keep you in control of recurring expenses.
            Our suggestions are transparent and rule-based rather than opaque AI guesses:
          </p>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl border border-border bg-surface/40 flex items-start gap-3">
              <HelpCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-foreground">Underutilization & Value Ratings</div>
                <div className="text-[11px] leading-relaxed">
                  Utilization suggestions come directly from your assigned value tags (<code className="px-1 py-0.5 rounded bg-surface font-mono text-[10px]">rarely_used</code> or <code className="px-1 py-0.5 rounded bg-surface font-mono text-[10px]">cancel_candidate</code>).
                  Because Sift does not monitor your browser or device activity, value signals reflect your own periodic reviews.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-surface/40 flex items-start gap-3">
              <TrendingUp className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-foreground">Price-Hike Detection</div>
                <div className="text-[11px] leading-relaxed">
                  Sift does not use bank OAuth scraping or store bank login credentials. As a result, price-hike detection is limited to imported statement data and manually updated amounts. If a subscription has only a single entered amount, Sift cannot infer a trend until a second statement or a manual update provides comparison data.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-surface/40 flex items-start gap-3">
              <Layers className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-foreground">Plan Alternatives & Downgrade Suggestions</div>
                <div className="text-[11px] leading-relaxed">
                  Sift does not track merchant feature-set changes or plan-limit changes. Where downgrade or alternative-plan suggestions are shown, they are based on visible pricing tiers and user-provided subscription data rather than live merchant plan intelligence.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-surface/40 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-foreground">Cancellation Assistance & Merchant Responsibility</div>
                <div className="text-[11px] leading-relaxed">
                  Sift also does not store merchant login credentials. Where a subscription must be canceled through a merchant’s website, Sift can help the user track, review, and prepare the cancellation, but the user must complete the final action directly with the merchant.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-surface/40 flex items-start gap-3">
              <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-foreground">Upcoming Renewals & Trials</div>
                <div className="text-[11px] leading-relaxed">
                  Scheduled notifications calculate exact countdowns against your entered renewal dates and reminder offsets (e.g. 7, 3, or 1 days prior).
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Storage, Export & Deletion */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <CardTitle>Storage, Export & Deletion</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed pt-1">
          <p>
            <strong className="text-foreground">Storage Architecture: </strong>
            In Local Mode, data is stored solely in your browser. When signed in, records are synchronized with a PostgreSQL database secured by Row Level Security (RLS), ensuring you can access only your own records.
          </p>

          <p>
            <strong className="text-foreground">Full Portability: </strong>
            You can export a full JSON backup or CSV spreadsheet of your ledger at any time in Settings.
          </p>

          <p>
            <strong className="text-foreground">Instant Deletion: </strong>
            Deleting a subscription immediately wipes it from your database and local storage. Clearing your browser cache in Local Mode purges all local data.
          </p>

          <div className="pt-2 flex items-center gap-2">
            <Link href="/settings">
              <Button variant="outline" size="sm" className="text-xs gap-1">
                Go to Settings & Backup <ArrowLeft className="w-3 h-3 rotate-180" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
