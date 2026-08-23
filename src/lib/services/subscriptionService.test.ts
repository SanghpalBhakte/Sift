import { describe, it, expect, beforeEach, vi } from 'vitest';
import { subscriptionService } from './subscriptionService';
import { CANONICAL_CATEGORIES } from '../constants/categories';
import { CANONICAL_PAYMENT_METHODS } from '../constants/paymentMethods';
import { SubscriptionFormData } from '../types';

// Mock localStorage for Node test environment
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(globalThis, 'window', {
  value: globalThis,
  writable: true,
});

describe('Subscription Service & Data Integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Canonical Categories Contract', () => {
    it('contains all 14 required canonical categories', () => {
      const requiredNames = [
        'Software & Development',
        'Infrastructure & Cloud',
        'Productivity & Notes',
        'Media & Reading',
        'Health & Routine',
        'Utilities & Sync',
        'Education & Learning',
        'Finance & Money',
        'Food & Delivery',
        'Shopping & Commerce',
        'Travel & Transport',
        'Entertainment & Games',
        'Family & Home',
        'Other',
      ];

      const categoryNames = CANONICAL_CATEGORIES.map((c) => c.name);
      requiredNames.forEach((reqName) => {
        expect(categoryNames).toContain(reqName);
      });
      expect(CANONICAL_CATEGORIES.length).toBe(14);
    });

    it('each category has a unique stable ID, slug, color, and icon', () => {
      const ids = new Set<string>();
      const slugs = new Set<string>();

      CANONICAL_CATEGORIES.forEach((cat) => {
        expect(cat.id).toBeDefined();
        expect(cat.slug).toBeDefined();
        expect(cat.color).toBeDefined();
        expect(cat.icon).toBeDefined();
        expect(ids.has(cat.id)).toBe(false);
        expect(slugs.has(cat.slug)).toBe(false);
        ids.add(cat.id);
        slugs.add(cat.slug);
      });
    });

    it('getCategories() returns all canonical categories', async () => {
      const categories = await subscriptionService.getCategories();
      expect(categories.length).toBeGreaterThanOrEqual(14);
      expect(categories.some((c) => c.slug === 'software-dev')).toBe(true);
      expect(categories.some((c) => c.slug === 'finance-money')).toBe(true);
    });
  });

  describe('Canonical Payment Methods Contract', () => {
    it('contains all required canonical payment methods', () => {
      const requiredTypes = [
        'credit_card',
        'debit_card',
        'bank_account',
        'upi',
        'paypal',
        'apple_pay',
        'google_pay',
        'cash',
        'other',
      ];

      const methodTypes = CANONICAL_PAYMENT_METHODS.map((pm) => pm.type);
      requiredTypes.forEach((reqType) => {
        expect(methodTypes).toContain(reqType);
      });
      expect(CANONICAL_PAYMENT_METHODS.length).toBe(9);
    });

    it('getPaymentMethods() returns canonical payment options for new users', async () => {
      const paymentMethods = await subscriptionService.getPaymentMethods();
      expect(paymentMethods.length).toBeGreaterThanOrEqual(9);
      expect(paymentMethods.some((pm) => pm.name === 'Credit Card')).toBe(true);
      expect(paymentMethods.some((pm) => pm.name === 'UPI')).toBe(true);
      expect(paymentMethods.some((pm) => pm.name === 'Apple Pay')).toBe(true);
    });
  });

  describe('Subscription Creation and Normalization', () => {
    it('normalizes monthly amount for yearly billing cycle', async () => {
      const form: SubscriptionFormData = {
        name: 'Figma Annual',
        amount: 144,
        currency: 'USD',
        billing_cycle: 'yearly',
        status: 'active',
        start_date: '2026-01-01',
        next_renewal_date: '2027-01-01',
        is_trial: false,
        reminder_offsets: [7, 3],
        value_rating: 'essential',
      };

      const created = await subscriptionService.createSubscription(form);
      expect(created.name).toBe('Figma Annual');
      expect(created.amount).toBe(144);
      expect(created.monthly_amount).toBe(12);
      expect(created.id).toBeDefined();
    });

    it('persists subscription to local storage fallback', async () => {
      const form: SubscriptionFormData = {
        name: 'Spotify Premium',
        amount: 10.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        status: 'active',
        start_date: '2026-08-01',
        next_renewal_date: '2026-09-01',
        is_trial: false,
        reminder_offsets: [3, 1],
        value_rating: 'useful',
      };

      const created = await subscriptionService.createSubscription(form);
      const all = await subscriptionService.getSubscriptions();
      expect(all.some((s) => s.id === created.id)).toBe(true);
    });

    it('updates subscription correctly', async () => {
      const form: SubscriptionFormData = {
        name: 'Notion Plus',
        amount: 10,
        currency: 'USD',
        billing_cycle: 'monthly',
        status: 'active',
        start_date: '2026-08-01',
        next_renewal_date: '2026-09-01',
        is_trial: false,
        reminder_offsets: [3, 1],
        value_rating: 'useful',
      };

      const created = await subscriptionService.createSubscription(form);
      const updated = await subscriptionService.updateSubscription(created.id, {
        amount: 12,
        notes: 'Price increased by $2',
      });

      expect(updated.amount).toBe(12);
      expect(updated.monthly_amount).toBe(12);
      expect(updated.notes).toBe('Price increased by $2');
    });

    it('deletes subscription cleanly', async () => {
      const form: SubscriptionFormData = {
        name: 'Temporary Service',
        amount: 5,
        currency: 'USD',
        billing_cycle: 'monthly',
        status: 'active',
        start_date: '2026-08-01',
        next_renewal_date: '2026-09-01',
        is_trial: false,
        reminder_offsets: [1],
        value_rating: 'rarely_used',
      };

      const created = await subscriptionService.createSubscription(form);
      await subscriptionService.deleteSubscription(created.id);
      const all = await subscriptionService.getSubscriptions();
      expect(all.some((s) => s.id === created.id)).toBe(false);
    });
  });
});
