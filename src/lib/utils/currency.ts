import { BillingCycle } from '../types';

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
];

/**
 * Format a number into clean, human currency display
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  options: { showCents?: boolean; compact?: boolean } = {}
): string {
  const { showCents = true, compact = false } = options;

  // Handle compact formatting for large numbers if needed
  if (compact && amount >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: showCents && amount % 1 !== 0 ? 2 : amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate normalized monthly amount from any billing cycle
 */
export function normalizeMonthlyAmount(
  amount: number,
  cycle: BillingCycle,
  customDays?: number
): number {
  if (amount <= 0) return 0;

  switch (cycle) {
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'yearly':
      return amount / 12;
    case 'custom':
      if (!customDays || customDays <= 0) return amount;
      return (amount / customDays) * 30.4375; // average days per month
    default:
      return amount;
  }
}

/**
 * Format billing cycle label for concise UI display
 */
export function formatCycle(cycle: BillingCycle, customDays?: number): string {
  switch (cycle) {
    case 'monthly':
      return '/mo';
    case 'quarterly':
      return '/qtr';
    case 'yearly':
      return '/yr';
    case 'custom':
      return `/${customDays || 30}d`;
    default:
      return '';
  }
}

/**
 * Format billing cycle into full readable name
 */
export function formatCycleFull(cycle: BillingCycle, customDays?: number): string {
  switch (cycle) {
    case 'monthly':
      return 'Billed monthly';
    case 'quarterly':
      return 'Billed every 3 months';
    case 'yearly':
      return 'Billed annually';
    case 'custom':
      return `Billed every ${customDays || 30} days`;
    default:
      return 'Recurring';
  }
}
