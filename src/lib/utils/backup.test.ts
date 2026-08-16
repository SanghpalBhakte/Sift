// =============================================================================
// Sift - Data Export & Backup Validation Tests
// Path: src/lib/utils/backup.test.ts
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  generateFullBackupJson,
  validateBackupJson,
  generateBackupReadme,
  remapCategoryBenchmarkOverrides,
} from './backup';
import { Profile, Subscription, Category } from '../types';

describe('Backup & Export Manifest Engine', () => {
  const mockProfile: Profile = {
    id: 'user-1',
    email: 'alex@sift.studio',
    full_name: 'Alex Mercer',
    currency_preference: 'EUR',
    theme_preference: 'night-shelf',
    default_reminder_days: [7, 3, 1],
    annual_benchmark_percent: 20,
    category_annual_benchmarks: {
      'cat-dev': 10,
      'cat-media': 20,
    },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  const mockCategories: Category[] = [
    {
      id: 'cat-dev',
      name: 'Software & Dev',
      slug: 'dev',
      color: '#10b981',
      icon: 'code',
      created_at: '2025-01-01T00:00:00Z',
    },
  ];

  const mockSubscriptions: Subscription[] = [
    {
      id: 'sub-1',
      user_id: 'user-1',
      name: 'GitHub Copilot',
      amount: 10,
      currency: 'USD',
      billing_cycle: 'monthly',
      status: 'active',
      start_date: '2025-01-01',
      next_renewal_date: '2025-02-01',
      is_trial: false,
      reminder_offsets: [3],
      value_rating: 'essential',
      monthly_amount: 10,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ];

  it('includes active global and per-category benchmark configurations in the exported JSON manifest', () => {
    const backup = generateFullBackupJson({
      userEmail: 'alex@sift.studio',
      profile: mockProfile,
      subscriptions: mockSubscriptions,
      categories: mockCategories,
    });

    expect(backup.version).toBe('1.0');
    expect(backup.app).toBe('Sift');
    expect(backup.profile.currency_preference).toBe('EUR');
    expect(backup.profile.theme_preference).toBe('night-shelf');
    expect(backup.profile.annual_benchmark_percent).toBe(20);
    expect(backup.profile.category_annual_benchmarks).toEqual({
      'cat-dev': 10,
      'cat-media': 20,
    });
    expect(backup.subscriptions).toHaveLength(1);
    expect(backup.categories).toHaveLength(1);
  });

  it('validates JSON backups containing benchmark configuration correctly', () => {
    const backup = generateFullBackupJson({
      userEmail: 'alex@sift.studio',
      profile: mockProfile,
      subscriptions: mockSubscriptions,
      categories: mockCategories,
    });

    const jsonString = JSON.stringify(backup);
    const result = validateBackupJson(jsonString);

    expect(result.valid).toBe(true);
    expect(result.data?.profile.annual_benchmark_percent).toBe(20);
    expect(result.data?.profile.category_annual_benchmarks).toEqual({
      'cat-dev': 10,
      'cat-media': 20,
    });
    expect(result.counts?.subscriptions).toBe(1);
  });

  it('preserves backward compatibility with legacy backups lacking benchmark settings', () => {
    const legacyBackup = {
      version: '1.0',
      app: 'Sift',
      exported_at: '2024-06-01T00:00:00Z',
      user_email: 'legacy@sift.studio',
      profile: {
        currency_preference: 'USD',
        theme_preference: 'paper-ledger',
        default_reminder_days: [7, 3, 1],
      },
      subscriptions: [
        {
          name: 'Legacy SaaS',
          amount: 15,
          currency: 'USD',
          billing_cycle: 'monthly',
          status: 'active',
          start_date: '2024-01-01',
          next_renewal_date: '2024-07-01',
          is_trial: false,
          value_rating: 'useful',
          monthly_amount: 15,
        },
      ],
      categories: [],
      payment_methods: [],
    };

    const result = validateBackupJson(JSON.stringify(legacyBackup));
    expect(result.valid).toBe(true);
    expect(result.data?.profile.annual_benchmark_percent).toBeUndefined();
    expect(result.counts?.subscriptions).toBe(1);
  });

  it('includes human-readable benchmark details in the backup README manifest', () => {
    const backup = generateFullBackupJson({
      userEmail: 'alex@sift.studio',
      profile: mockProfile,
      subscriptions: mockSubscriptions,
      categories: mockCategories,
    });

    const readme = generateBackupReadme(backup);
    expect(readme).toContain('Annual Discount Benchmark: 20% (2 category override(s))');
    expect(readme).toContain('SIFT DATA BACKUP MANIFEST');
  });

  describe('remapCategoryBenchmarkOverrides (Portability & Slug Fallback)', () => {
    const sourceBackupCategories: Category[] = [
      { id: 'src-uuid-1', name: 'Software & Dev', slug: 'software-dev', color: '#10b981', icon: 'code', created_at: '' },
      { id: 'src-uuid-2', name: 'Media & Streaming', slug: 'media-streaming', color: '#6366f1', icon: 'tv', created_at: '' },
      { id: 'src-uuid-3', name: 'Productivity', slug: 'productivity', color: '#f59e0b', icon: 'briefcase', created_at: '' },
    ];

    it('matches by exact category UUID when restoring on the same instance', () => {
      const activeCategories: Category[] = [
        { id: 'src-uuid-1', name: 'Software & Dev', slug: 'software-dev', color: '#10b981', icon: 'code', created_at: '' },
        { id: 'src-uuid-2', name: 'Media & Streaming', slug: 'media-streaming', color: '#6366f1', icon: 'tv', created_at: '' },
      ];

      const backupBenchmarks = {
        'src-uuid-1': 10,
        'src-uuid-2': 20,
      };

      const report = remapCategoryBenchmarkOverrides(backupBenchmarks, sourceBackupCategories, activeCategories);

      expect(report.matchedByUuid).toBe(2);
      expect(report.matchedBySlug).toBe(0);
      expect(report.skippedAmbiguous).toBe(0);
      expect(report.skippedMissing).toBe(0);
      expect(report.remappedBenchmarks).toEqual({
        'src-uuid-1': 10,
        'src-uuid-2': 20,
      });
    });

    it('falls back to matching by slug when restoring on a fresh instance with different category UUIDs', () => {
      const destFreshCategories: Category[] = [
        { id: 'dest-new-uuid-1', name: 'Software & Dev', slug: 'software-dev', color: '#10b981', icon: 'code', created_at: '' },
        { id: 'dest-new-uuid-2', name: 'Media & Streaming', slug: 'media-streaming', color: '#6366f1', icon: 'tv', created_at: '' },
      ];

      const backupBenchmarks = {
        'src-uuid-1': 10,
        'src-uuid-2': 20,
      };

      const report = remapCategoryBenchmarkOverrides(backupBenchmarks, sourceBackupCategories, destFreshCategories);

      expect(report.matchedByUuid).toBe(0);
      expect(report.matchedBySlug).toBe(2);
      expect(report.skippedAmbiguous).toBe(0);
      expect(report.skippedMissing).toBe(0);
      expect(report.remappedBenchmarks).toEqual({
        'dest-new-uuid-1': 10,
        'dest-new-uuid-2': 20,
      });
    });

    it('safely skips ambiguous slug collisions without guessing when duplicate destination slugs exist', () => {
      const destCategoriesWithDuplicateSlugs: Category[] = [
        { id: 'dup-1', name: 'Dev 1', slug: 'software-dev', color: '#10b981', icon: 'code', created_at: '' },
        { id: 'dup-2', name: 'Dev 2', slug: 'software-dev', color: '#10b981', icon: 'code', created_at: '' },
        { id: 'unique-1', name: 'Media', slug: 'media-streaming', color: '#6366f1', icon: 'tv', created_at: '' },
      ];

      const backupBenchmarks = {
        'src-uuid-1': 10, // Slug: software-dev (ambiguous in destination)
        'src-uuid-2': 20, // Slug: media-streaming (unique)
      };

      const report = remapCategoryBenchmarkOverrides(
        backupBenchmarks,
        sourceBackupCategories,
        destCategoriesWithDuplicateSlugs
      );

      expect(report.matchedBySlug).toBe(1);
      expect(report.skippedAmbiguous).toBe(1);
      expect(report.remappedBenchmarks).toEqual({
        'unique-1': 20,
      });
    });

    it('safely skips categories that are missing in the destination workspace', () => {
      const destCategories: Category[] = [
        { id: 'dest-1', name: 'Software & Dev', slug: 'software-dev', color: '#10b981', icon: 'code', created_at: '' },
      ];

      const backupBenchmarks = {
        'src-uuid-1': 10, // Found
        'src-uuid-3': 15, // Productivity (missing in destination)
      };

      const report = remapCategoryBenchmarkOverrides(backupBenchmarks, sourceBackupCategories, destCategories);

      expect(report.matchedBySlug).toBe(1);
      expect(report.skippedMissing).toBe(1);
      expect(report.remappedBenchmarks).toEqual({
        'dest-1': 10,
      });
    });
  });
});
