// =============================================================================
// Sift - Subscription Health & Financial Action Center Engine
// Path: src/lib/utils/subscriptionHealth.ts
// =============================================================================

import { Category, Subscription } from '../types';
import { convertCurrency, formatCurrency, normalizeMonthlyAmount } from './currency';
import { getDaysUntil, formatDate } from './dates';
import { DEFAULT_OFFLINE_RATES } from '../services/exchangeRateService';

export type ActionSeverity = 'urgent' | 'warning' | 'info';

export type ActionType =
  | 'trial_expiring'
  | 'cancel_candidate'
  | 'annual_renewal_due'
  | 'rarely_used_audit'
  | 'renewal_imminent'
  | 'service_overlap'
  | 'outsized_cost';

export interface HealthActionItem {
  id: string;
  type: ActionType;
  severity: ActionSeverity;
  title: string;
  subtitle: string;
  whyExplanation: string;
  heuristicRule: string;
  impactAmount: number;
  impactCurrency: string;
  impactLabel: string;
  impactType: 'savings' | 'charge_review' | 'budget_share';
  subscriptionId?: string;
  subscriptionName?: string;
  cancelUrl?: string;
  relatedSubscriptions?: {
    id: string;
    name: string;
    amount: number;
    currency: string;
    billingCycle: string;
  }[];
  suggestedActionLabel: string;
  actionUrl?: string;
}

export interface SubscriptionHealthSummary {
  healthScore: number; // 0 - 100
  statusLabel: 'Calm & Optimized' | 'Review Recommended' | 'Action Required';
  statusDescription: string;
  totalActiveCount: number;
  actionsCount: number;
  urgentCount: number;
  warningCount: number;
  infoCount: number;
  potentialMonthlySavings: number;
  potentialAnnualSavings: number;
  displayCurrency: string;
  items: HealthActionItem[];
}

// Known overlapping service clusters for intelligent cross-service awareness
const OVERLAPPING_CLUSTERS: Record<string, { clusterName: string; keywords: string[] }> = {
  ai_assistants: {
    clusterName: 'AI Assistants & LLMs',
    keywords: ['chatgpt', 'openai', 'claude', 'anthropic', 'copilot', 'github copilot', 'gemini', 'perplexity'],
  },
  music_streaming: {
    clusterName: 'Music Streaming',
    keywords: ['spotify', 'apple music', 'tidal', 'deezer', 'youtube music', 'amazon music', 'qobuz'],
  },
  video_streaming: {
    clusterName: 'Video Streaming',
    keywords: ['netflix', 'hulu', 'disney', 'hbo', 'max', 'paramount', 'peacock', 'prime video', 'apple tv'],
  },
  cloud_storage: {
    clusterName: 'Cloud Storage & Sync',
    keywords: ['dropbox', 'google drive', 'google one', 'onedrive', 'icloud', 'box.com', 'pcloud', 'backblaze'],
  },
  design_creative: {
    clusterName: 'Design & Creative Tools',
    keywords: ['figma', 'sketch', 'adobe', 'canva', 'framer'],
  },
  password_security: {
    clusterName: 'Password Managers & Security',
    keywords: ['1password', 'bitwarden', 'dashlane', 'lastpass', 'nordpass'],
  },
};

/**
 * Evaluates active subscriptions and produces prioritized, transparent financial action items.
 */
export function generateSubscriptionHealthActions(
  subscriptions: Subscription[],
  categories: Category[] = [],
  targetCurrency: string = 'USD',
  rates: Record<string, number> = DEFAULT_OFFLINE_RATES
): SubscriptionHealthSummary {
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const items: HealthActionItem[] = [];

  const totalMonthlySpend = activeSubs.reduce((acc, s) => {
    const rawMonthly =
      s.monthly_amount ||
      normalizeMonthlyAmount(s.amount, s.billing_cycle, s.custom_interval_days);
    return acc + convertCurrency(rawMonthly, s.currency || 'USD', targetCurrency, rates);
  }, 0);

  let potentialMonthlySavings = 0;

  // ---------------------------------------------------------------------------
  // 1. SIGNAL: Free Trials Ending Soon (< 7 Days)
  // ---------------------------------------------------------------------------
  activeSubs
    .filter((s) => s.is_trial)
    .forEach((sub) => {
      const targetDate = sub.trial_end_date || sub.next_renewal_date;
      const daysUntil = getDaysUntil(targetDate);
      const convertedMonthly = convertCurrency(
        sub.monthly_amount || normalizeMonthlyAmount(sub.amount, sub.billing_cycle),
        sub.currency || 'USD',
        targetCurrency,
        rates
      );

      if (daysUntil <= 7) {
        items.push({
          id: `health-trial-${sub.id}`,
          type: 'trial_expiring',
          severity: 'urgent',
          title: `Free trial ending: ${sub.name}`,
          subtitle: `Converts to ${formatCurrency(sub.amount, sub.currency)}/${sub.billing_cycle} on ${formatDate(targetDate)}`,
          whyExplanation:
            daysUntil < 0
              ? `Trial period expired on ${formatDate(targetDate)}. Sift detected potential automatic billing conversion.`
              : daysUntil === 0
              ? `Trial period ends today. Auto-billing will convert to ${formatCurrency(sub.amount, sub.currency)}.`
              : `Trial period expires in ${daysUntil} day${daysUntil === 1 ? '' : 's'}.`,
          heuristicRule: 'Rule: Active trial with conversion date within 7 days',
          impactAmount: convertedMonthly,
          impactCurrency: targetCurrency,
          impactLabel: `${formatCurrency(convertedMonthly, targetCurrency)}/mo commitment`,
          impactType: 'savings',
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          cancelUrl: sub.cancel_url,
          suggestedActionLabel: 'Review or Cancel Trial',
          actionUrl: `/subscriptions/${sub.id}/edit`,
        });
      }
    });

  // ---------------------------------------------------------------------------
  // 2. SIGNAL: Cancel Candidates (User-flagged for removal)
  // ---------------------------------------------------------------------------
  activeSubs
    .filter((s) => s.value_rating === 'cancel_candidate')
    .forEach((sub) => {
      const convertedMonthly = convertCurrency(
        sub.monthly_amount || normalizeMonthlyAmount(sub.amount, sub.billing_cycle),
        sub.currency || 'USD',
        targetCurrency,
        rates
      );
      potentialMonthlySavings += convertedMonthly;

      items.push({
        id: `health-cancel-${sub.id}`,
        type: 'cancel_candidate',
        severity: 'urgent',
        title: `Ready to cancel: ${sub.name}`,
        subtitle: `Incurring ${formatCurrency(sub.amount, sub.currency)}/${sub.billing_cycle} without active utility`,
        whyExplanation: `You marked this subscription as "Cancel Candidate" during your value audit.`,
        heuristicRule: 'Rule: Value Rating = "cancel_candidate"',
        impactAmount: convertedMonthly,
        impactCurrency: targetCurrency,
        impactLabel: `Save ${formatCurrency(convertedMonthly, targetCurrency)}/mo`,
        impactType: 'savings',
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        cancelUrl: sub.cancel_url,
        suggestedActionLabel: sub.cancel_url ? 'Open Cancel Link' : 'Mark as Canceled',
        actionUrl: `/subscriptions/${sub.id}/edit`,
      });
    });

  // ---------------------------------------------------------------------------
  // 3. SIGNAL: Upcoming Annual Renewals Due (< 30 Days)
  // ---------------------------------------------------------------------------
  activeSubs
    .filter((s) => s.billing_cycle === 'yearly')
    .forEach((sub) => {
      const daysUntil = getDaysUntil(sub.next_renewal_date);
      if (daysUntil >= 0 && daysUntil <= 30) {
        const convertedAnnual = convertCurrency(
          sub.amount,
          sub.currency || 'USD',
          targetCurrency,
          rates
        );

        items.push({
          id: `health-annual-${sub.id}`,
          type: 'annual_renewal_due',
          severity: 'warning',
          title: `Annual renewal due: ${sub.name}`,
          subtitle: `${formatCurrency(sub.amount, sub.currency)} renewing on ${formatDate(sub.next_renewal_date)}`,
          whyExplanation: `Annual plans lock in 12 months of commitment at once. Reviewing now prevents unintended multi-month charges.`,
          heuristicRule: 'Rule: Yearly billing cycle renewing within 30 days',
          impactAmount: convertedAnnual,
          impactCurrency: targetCurrency,
          impactLabel: `${formatCurrency(convertedAnnual, targetCurrency)} yearly charge`,
          impactType: 'charge_review',
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          cancelUrl: sub.cancel_url,
          suggestedActionLabel: 'Review Annual Plan',
          actionUrl: `/subscriptions/${sub.id}/edit`,
        });
      }
    });

  // ---------------------------------------------------------------------------
  // 4. SIGNAL: Underutilized / Rarely Used Service Audit
  // ---------------------------------------------------------------------------
  activeSubs
    .filter((s) => s.value_rating === 'rarely_used' && !s.is_trial)
    .forEach((sub) => {
      const convertedMonthly = convertCurrency(
        sub.monthly_amount || normalizeMonthlyAmount(sub.amount, sub.billing_cycle),
        sub.currency || 'USD',
        targetCurrency,
        rates
      );

      items.push({
        id: `health-rarely-${sub.id}`,
        type: 'rarely_used_audit',
        severity: 'warning',
        title: `Low utilization check: ${sub.name}`,
        subtitle: `Rated "Rarely Used" (${formatCurrency(sub.amount, sub.currency)}/${sub.billing_cycle})`,
        whyExplanation: `You designated this service as rarely used. Pausing or canceling could free up recurring cash flow.`,
        heuristicRule: 'Rule: Value Rating = "rarely_used"',
        impactAmount: convertedMonthly,
        impactCurrency: targetCurrency,
        impactLabel: `Save up to ${formatCurrency(convertedMonthly, targetCurrency)}/mo`,
        impactType: 'savings',
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        cancelUrl: sub.cancel_url,
        suggestedActionLabel: 'Audit Service',
        actionUrl: `/subscriptions/${sub.id}/edit`,
      });
    });

  // ---------------------------------------------------------------------------
  // 5. SIGNAL: Imminent Non-Trial Renewal (< 3 Days)
  // ---------------------------------------------------------------------------
  activeSubs
    .filter(
      (s) =>
        !s.is_trial &&
        s.billing_cycle !== 'yearly' &&
        s.value_rating !== 'cancel_candidate' &&
        s.value_rating !== 'rarely_used'
    )
    .forEach((sub) => {
      const daysUntil = getDaysUntil(sub.next_renewal_date);
      if (daysUntil >= 0 && daysUntil <= 2) {
        const converted = convertCurrency(sub.amount, sub.currency || 'USD', targetCurrency, rates);

        items.push({
          id: `health-imminent-${sub.id}`,
          type: 'renewal_imminent',
          severity: 'warning',
          title: `Renewing ${daysUntil === 0 ? 'today' : `in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`}: ${sub.name}`,
          subtitle: `${formatCurrency(sub.amount, sub.currency)} scheduled for ${formatDate(sub.next_renewal_date)}`,
          whyExplanation: `Upcoming automatic charge is scheduled within 48 hours.`,
          heuristicRule: 'Rule: Renewal date within 2 days',
          impactAmount: converted,
          impactCurrency: targetCurrency,
          impactLabel: `${formatCurrency(converted, targetCurrency)} charge`,
          impactType: 'charge_review',
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          suggestedActionLabel: 'View Subscription',
          actionUrl: `/subscriptions/${sub.id}/edit`,
        });
      }
    });

  // ---------------------------------------------------------------------------
  // 6. SIGNAL: Service Overlap / Redundant Subscriptions
  // ---------------------------------------------------------------------------
  // A. Check known keyword clusters
  Object.entries(OVERLAPPING_CLUSTERS).forEach(([clusterKey, cluster]) => {
    const matchedSubs = activeSubs.filter((s) => {
      const lowerName = s.name.toLowerCase();
      return cluster.keywords.some((kw) => lowerName.includes(kw));
    });

    if (matchedSubs.length >= 2) {
      const combinedMonthly = matchedSubs.reduce((acc, s) => {
        const rawMonthly =
          s.monthly_amount || normalizeMonthlyAmount(s.amount, s.billing_cycle, s.custom_interval_days);
        return acc + convertCurrency(rawMonthly, s.currency || 'USD', targetCurrency, rates);
      }, 0);

      items.push({
        id: `health-overlap-cluster-${clusterKey}`,
        type: 'service_overlap',
        severity: 'info',
        title: `Possible overlap: ${cluster.clusterName}`,
        subtitle: `${matchedSubs.length} active services (${matchedSubs.map((m) => m.name).join(', ')})`,
        whyExplanation: `Multiple active services match the "${cluster.clusterName}" category. Consolidating to one preferred provider could save money.`,
        heuristicRule: `Rule: 2+ active subscriptions in ${cluster.clusterName} cluster`,
        impactAmount: combinedMonthly,
        impactCurrency: targetCurrency,
        impactLabel: `Combined ${formatCurrency(combinedMonthly, targetCurrency)}/mo`,
        impactType: 'savings',
        relatedSubscriptions: matchedSubs.map((m) => ({
          id: m.id,
          name: m.name,
          amount: m.amount,
          currency: m.currency,
          billingCycle: m.billing_cycle,
        })),
        suggestedActionLabel: 'Compare Services',
        actionUrl: '/subscriptions',
      });
    }
  });

  // B. Check user-defined categories with 3+ subscriptions
  const categoryCountMap: Record<string, Subscription[]> = {};
  activeSubs.forEach((sub) => {
    if (sub.category_id) {
      if (!categoryCountMap[sub.category_id]) categoryCountMap[sub.category_id] = [];
      categoryCountMap[sub.category_id].push(sub);
    }
  });

  Object.entries(categoryCountMap).forEach(([catId, subs]) => {
    // If 3 or more subscriptions in the same category and not already captured by named clusters
    if (subs.length >= 3) {
      const catObj = categories.find((c) => c.id === catId);
      const catName = catObj?.name || 'Category';

      const alreadyCoveredInCluster = items.some(
        (it) => it.type === 'service_overlap' && it.relatedSubscriptions?.some((r) => subs.some((s) => s.id === r.id))
      );

      if (!alreadyCoveredInCluster) {
        const combinedMonthly = subs.reduce((acc, s) => {
          const rawMonthly =
            s.monthly_amount || normalizeMonthlyAmount(s.amount, s.billing_cycle, s.custom_interval_days);
          return acc + convertCurrency(rawMonthly, s.currency || 'USD', targetCurrency, rates);
        }, 0);

        items.push({
          id: `health-overlap-cat-${catId}`,
          type: 'service_overlap',
          severity: 'info',
          title: `Category density: ${catName}`,
          subtitle: `${subs.length} active subscriptions totaling ${formatCurrency(combinedMonthly, targetCurrency)}/mo`,
          whyExplanation: `High concentration of spend in ${catName}. Worth a quick review to ensure each tool remains distinct and necessary.`,
          heuristicRule: `Rule: 3+ active subscriptions in category "${catName}"`,
          impactAmount: combinedMonthly,
          impactCurrency: targetCurrency,
          impactLabel: `${formatCurrency(combinedMonthly, targetCurrency)}/mo total`,
          impactType: 'savings',
          relatedSubscriptions: subs.map((m) => ({
            id: m.id,
            name: m.name,
            amount: m.amount,
            currency: m.currency,
            billingCycle: m.billing_cycle,
          })),
          suggestedActionLabel: 'Review Category',
          actionUrl: '/subscriptions',
        });
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 7. SIGNAL: Outsized Cost / Heavy Hitter (> 25% of monthly recurring total)
  // ---------------------------------------------------------------------------
  if (activeSubs.length >= 3 && totalMonthlySpend >= 40) {
    activeSubs.forEach((sub) => {
      const subMonthly = convertCurrency(
        sub.monthly_amount || normalizeMonthlyAmount(sub.amount, sub.billing_cycle),
        sub.currency || 'USD',
        targetCurrency,
        rates
      );
      const sharePercent = Math.round((subMonthly / totalMonthlySpend) * 100);

      if (sharePercent >= 28) {
        items.push({
          id: `health-heavy-${sub.id}`,
          type: 'outsized_cost',
          severity: 'info',
          title: `Budget concentration: ${sub.name}`,
          subtitle: `${sharePercent}% of total monthly recurring spend (${formatCurrency(subMonthly, targetCurrency)}/mo)`,
          whyExplanation: `This single subscription makes up over one-quarter of your entire monthly recurring spend.`,
          heuristicRule: 'Rule: Monthly cost represents >= 28% of total recurring budget',
          impactAmount: subMonthly,
          impactCurrency: targetCurrency,
          impactLabel: `${sharePercent}% of monthly run-rate`,
          impactType: 'budget_share',
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          suggestedActionLabel: 'Review Plan Tier',
          actionUrl: `/subscriptions/${sub.id}/edit`,
        });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Sort items by Severity (Urgent -> Warning -> Info) and impact amount
  // ---------------------------------------------------------------------------
  const severityRank: Record<ActionSeverity, number> = {
    urgent: 1,
    warning: 2,
    info: 3,
  };

  items.sort((a, b) => {
    if (severityRank[a.severity] !== severityRank[b.severity]) {
      return severityRank[a.severity] - severityRank[b.severity];
    }
    return b.impactAmount - a.impactAmount;
  });

  // Calculate Health Score (100 is pristine calm ledger)
  const urgentCount = items.filter((i) => i.severity === 'urgent').length;
  const warningCount = items.filter((i) => i.severity === 'warning').length;
  const infoCount = items.filter((i) => i.severity === 'info').length;

  let healthScore = 100;
  if (activeSubs.length > 0) {
    const deduction = urgentCount * 25 + warningCount * 12 + infoCount * 5;
    healthScore = Math.max(10, Math.min(100, 100 - deduction));
  }

  let statusLabel: 'Calm & Optimized' | 'Review Recommended' | 'Action Required' = 'Calm & Optimized';
  let statusDescription = 'All subscriptions are in good standing with no urgent flags.';

  if (urgentCount > 0) {
    statusLabel = 'Action Required';
    statusDescription = `${urgentCount} urgent item${urgentCount === 1 ? '' : 's'} require${urgentCount === 1 ? 's' : ''} your decision (trial conversion or cancel candidate).`;
  } else if (warningCount > 0) {
    statusLabel = 'Review Recommended';
    statusDescription = `${warningCount} renewal or underutilized service${warningCount === 1 ? '' : 's'} due for a quick check.`;
  } else if (infoCount > 0) {
    statusLabel = 'Review Recommended';
    statusDescription = `Consider reviewing ${infoCount} potential overlap or budget concentration opportunities.`;
  }

  return {
    healthScore,
    statusLabel,
    statusDescription,
    totalActiveCount: activeSubs.length,
    actionsCount: items.length,
    urgentCount,
    warningCount,
    infoCount,
    potentialMonthlySavings: Math.round(potentialMonthlySavings * 100) / 100,
    potentialAnnualSavings: Math.round(potentialMonthlySavings * 12 * 100) / 100,
    displayCurrency: targetCurrency,
    items,
  };
}
