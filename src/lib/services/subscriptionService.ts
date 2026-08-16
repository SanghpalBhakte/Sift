import {
  Category,
  DashboardStats,
  PaymentMethod,
  Profile,
  Subscription,
  SubscriptionFilters,
  SubscriptionFormData,
} from '../types';
import {
  defaultProfile,
  mockCategories,
  mockPaymentMethods,
  mockSubscriptions,
} from '../mock/sampleData';
import { createClient } from '../supabase/client';
import { calculateDashboardStats } from '../utils/analytics';
import { normalizeMonthlyAmount } from '../utils/currency';

const STORAGE_KEYS = {
  SUBSCRIPTIONS: 'sift_subscriptions_v1',
  CATEGORIES: 'sift_categories_v1',
  PAYMENT_METHODS: 'sift_payment_methods_v1',
  PROFILE: 'sift_profile_v1',
};

class SubscriptionService {
  private getLocalData<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  }

  private setLocalData<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save to local storage', err);
    }
  }

  // --- Subscriptions ---

  async getSubscriptions(filters?: SubscriptionFilters): Promise<Subscription[]> {
    const supabase = createClient();
    let items: Subscription[] = [];

    if (supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          let query = (supabase.from('subscriptions') as any)
            .select('*, category:categories(*), payment_method:payment_methods(*)')
            .eq('user_id', user.id);

          if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status);
          }
          if (filters?.category_id && filters.category_id !== 'all') {
            query = query.eq('category_id', filters.category_id);
          }
          if (filters?.value_rating && filters.value_rating !== 'all') {
            query = query.eq('value_rating', filters.value_rating);
          }

          const { data, error } = await query;
          if (!error && data) {
            items = data as unknown as Subscription[];
          } else {
            console.error('Supabase query error:', error);
            items = [];
          }
        } else {
          items = [];
        }
      } catch (err) {
        console.error('Error fetching subscriptions from Supabase:', err);
        items = [];
      }
    } else {
      // Local demo / unconfigured mode: start with clean empty ledger for authentic first-run experience
      items = this.getLocalData(STORAGE_KEYS.SUBSCRIPTIONS, []);
    }

    // Attach categories & payment methods if needed
    const categories = await this.getCategories();
    const paymentMethods = await this.getPaymentMethods();

    items = items.map((sub) => ({
      ...sub,
      category: sub.category || categories.find((c) => c.id === sub.category_id),
      payment_method:
        sub.payment_method || paymentMethods.find((p) => p.id === sub.payment_method_id),
    }));

    // Apply in-memory search
    if (filters?.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q)) ||
          (s.category && s.category.name.toLowerCase().includes(q)) ||
          (s.notes && s.notes.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (filters?.status && filters.status !== 'all') {
      items = items.filter((s) => s.status === filters.status);
    }

    // Category filter
    if (filters?.category_id && filters.category_id !== 'all') {
      items = items.filter((s) => s.category_id === filters.category_id);
    }

    // Value rating filter
    if (filters?.value_rating && filters.value_rating !== 'all') {
      items = items.filter((s) => s.value_rating === filters.value_rating);
    }

    // Billing cycle filter
    if (filters?.billing_cycle && filters.billing_cycle !== 'all') {
      items = items.filter((s) => s.billing_cycle === filters.billing_cycle);
    }

    // Sorting
    const sortBy = filters?.sortBy || 'next_renewal_date';
    const sortOrder = filters?.sortOrder || 'asc';

    items.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'next_renewal_date') {
        comparison =
          new Date(a.next_renewal_date).getTime() - new Date(b.next_renewal_date).getTime();
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortBy === 'monthly_amount') {
        comparison = a.monthly_amount - b.monthly_amount;
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return items;
  }

  async getSubscriptionById(id: string): Promise<Subscription | null> {
    const supabase = createClient();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from('subscriptions') as any)
          .select('*, category:categories(*), payment_method:payment_methods(*)')
          .eq('id', id)
          .single();

        if (!error && data) {
          return data as unknown as Subscription;
        }
      } catch {
        // Fallback
      }
    }

    const subs = await this.getSubscriptions();
    return subs.find((s) => s.id === id) || null;
  }

  async createSubscription(form: SubscriptionFormData): Promise<Subscription> {
    const supabase = createClient();
    const monthlyAmount = normalizeMonthlyAmount(
      form.amount,
      form.billing_cycle,
      form.custom_interval_days
    );

    let userId = defaultProfile.id;

    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        userId = user.id;

        const { data, error } = await (supabase.from('subscriptions') as any)
          .insert({
            user_id: userId,
            name: form.name,
            description: form.description || null,
            amount: form.amount,
            currency: form.currency,
            billing_cycle: form.billing_cycle,
            custom_interval_days: form.custom_interval_days || null,
            status: form.status,
            category_id: form.category_id || null,
            payment_method_id: form.payment_method_id || null,
            start_date: form.start_date,
            next_renewal_date: form.next_renewal_date,
            is_trial: form.is_trial,
            trial_end_date: form.trial_end_date || null,
            reminder_offsets: form.reminder_offsets,
            value_rating: form.value_rating,
            cancel_url: form.cancel_url || null,
            notes: form.notes || null,
            monthly_amount: monthlyAmount,
            monthly_alternative_price: form.monthly_alternative_price || null,
            previous_amount: form.previous_amount || null,
            price_hike_reviewed_at: form.price_hike_reviewed_at || null,
            cancellation_reason: form.cancellation_reason || null,
            cancellation_effective_date: form.cancellation_effective_date || null,
          })
          .select('*, category:categories(*), payment_method:payment_methods(*)')
          .single();

        if (error) {
          throw new Error(error.message);
        }

        if (data) {
          return data as unknown as Subscription;
        }
      }
    }

    // Local storage fallback for unconfigured/offline
    const newSub: Subscription = {
      ...form,
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `sub-${Date.now()}`,
      user_id: userId,
      monthly_amount: monthlyAmount,
      monthly_alternative_price: form.monthly_alternative_price || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const all = this.getLocalData(STORAGE_KEYS.SUBSCRIPTIONS, mockSubscriptions);
    const updated = [newSub, ...all];
    this.setLocalData(STORAGE_KEYS.SUBSCRIPTIONS, updated);
    return newSub;
  }

  async updateSubscription(
    id: string,
    updates: Partial<SubscriptionFormData>
  ): Promise<Subscription> {
    const supabase = createClient();
    const existing = await this.getSubscriptionById(id);
    if (!existing) throw new Error('Subscription not found');

    const billingCycle = updates.billing_cycle || existing.billing_cycle;
    const amount = updates.amount !== undefined ? updates.amount : existing.amount;
    const customDays =
      updates.custom_interval_days !== undefined
        ? updates.custom_interval_days
        : existing.custom_interval_days;
    const monthlyAmount = normalizeMonthlyAmount(amount, billingCycle, customDays);

    const updatedSub: Subscription = {
      ...existing,
      ...updates,
      monthly_amount: monthlyAmount,
      updated_at: new Date().toISOString(),
    };

    if (supabase) {
      const { error } = await (supabase.from('subscriptions') as any)
        .update({
          name: updatedSub.name,
          description: updatedSub.description || null,
          amount: updatedSub.amount,
          currency: updatedSub.currency,
          billing_cycle: updatedSub.billing_cycle,
          custom_interval_days: updatedSub.custom_interval_days || null,
          status: updatedSub.status,
          category_id: updatedSub.category_id || null,
          payment_method_id: updatedSub.payment_method_id || null,
          start_date: updatedSub.start_date,
          next_renewal_date: updatedSub.next_renewal_date,
          is_trial: updatedSub.is_trial,
          trial_end_date: updatedSub.trial_end_date || null,
          reminder_offsets: updatedSub.reminder_offsets,
          value_rating: updatedSub.value_rating,
          cancel_url: updatedSub.cancel_url || null,
          notes: updatedSub.notes || null,
          monthly_amount: updatedSub.monthly_amount,
          monthly_alternative_price: updatedSub.monthly_alternative_price || null,
          previous_amount: updatedSub.previous_amount || null,
          price_hike_reviewed_at: updatedSub.price_hike_reviewed_at || null,
          cancellation_reason: updatedSub.cancellation_reason || null,
          cancellation_effective_date: updatedSub.cancellation_effective_date || null,
          updated_at: updatedSub.updated_at,
        })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    }

    const all = this.getLocalData(STORAGE_KEYS.SUBSCRIPTIONS, mockSubscriptions);
    const updatedList = all.map((s) => (s.id === id ? updatedSub : s));
    this.setLocalData(STORAGE_KEYS.SUBSCRIPTIONS, updatedList);

    return updatedSub;
  }

  async deleteSubscription(id: string): Promise<void> {
    const supabase = createClient();
    if (supabase) {
      const { error } = await (supabase.from('subscriptions') as any).delete().eq('id', id);
      if (error) {
        throw new Error(error.message);
      }
    }

    const all = this.getLocalData(STORAGE_KEYS.SUBSCRIPTIONS, mockSubscriptions);
    const updated = all.filter((s) => s.id !== id);
    this.setLocalData(STORAGE_KEYS.SUBSCRIPTIONS, updated);
  }

  // --- Categories & Payment Methods ---

  async getCategories(): Promise<Category[]> {
    const supabase = createClient();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from('categories') as any)
          .select('*')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          return data as Category[];
        }
      } catch {
        // Fallback
      }
    }
    return this.getLocalData(STORAGE_KEYS.CATEGORIES, mockCategories);
  }

  async createCategory(categoryData: {
    name: string;
    slug?: string;
    color?: string;
    icon?: string;
  }): Promise<Category> {
    const slug =
      categoryData.slug?.trim().toLowerCase() ||
      categoryData.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const newCat: Category = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `cat-${Date.now()}`,
      name: categoryData.name.trim(),
      slug,
      color: categoryData.color || '#6366f1',
      icon: categoryData.icon || 'folder',
      created_at: new Date().toISOString(),
    };

    const supabase = createClient();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from('categories') as any)
          .insert({
            id: newCat.id,
            name: newCat.name,
            slug: newCat.slug,
            color: newCat.color,
            icon: newCat.icon,
          })
          .select()
          .single();

        if (!error && data) {
          return data as Category;
        }
      } catch (err) {
        console.warn('Failed to insert category into Supabase, using local storage fallback:', err);
      }
    }

    const all = this.getLocalData(STORAGE_KEYS.CATEGORIES, mockCategories);
    const updated = [...all, newCat];
    this.setLocalData(STORAGE_KEYS.CATEGORIES, updated);
    return newCat;
  }

  async updateCategory(
    id: string,
    updates: Partial<{ name: string; slug: string; color: string; icon: string }>
  ): Promise<Category> {
    const categories = await this.getCategories();
    const existing = categories.find((c) => c.id === id);
    if (!existing) throw new Error('Category not found');

    const newSlug = updates.slug
      ? updates.slug.trim().toLowerCase()
      : updates.name
        ? updates.name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
        : existing.slug;

    // If slug is changing, preserve old slug in slug_aliases without duplicates
    const existingAliases = existing.slug_aliases || [];
    const updatedAliases = [...existingAliases];
    if (existing.slug && existing.slug !== newSlug && !updatedAliases.includes(existing.slug)) {
      updatedAliases.push(existing.slug);
    }

    const updatedCat: Category = {
      ...existing,
      ...updates,
      slug: newSlug,
      slug_aliases: updatedAliases,
    };

    const supabase = createClient();
    if (supabase) {
      try {
        await (supabase.from('categories') as any)
          .update({
            name: updatedCat.name,
            slug: updatedCat.slug,
            color: updatedCat.color,
            icon: updatedCat.icon,
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Failed to update category in Supabase, using local storage fallback:', err);
      }
    }

    const all = this.getLocalData(STORAGE_KEYS.CATEGORIES, mockCategories);
    const updatedList = all.map((c) => (c.id === id ? updatedCat : c));
    this.setLocalData(STORAGE_KEYS.CATEGORIES, updatedList);
    return updatedCat;
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const supabase = createClient();
    if (supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await (supabase.from('payment_methods') as any)
            .select('*')
            .eq('user_id', user.id);

          if (!error && data) {
            return data as PaymentMethod[];
          }
        }
      } catch {
        // Fallback
      }
    }
    return this.getLocalData(STORAGE_KEYS.PAYMENT_METHODS, mockPaymentMethods);
  }

  // --- Profile & Preferences ---

  async getProfile(): Promise<Profile | null> {
    const supabase = createClient();
    if (supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await (supabase.from('profiles') as any)
            .select('*')
            .eq('id', user.id)
            .single();

          if (!error && data) {
            return data as Profile;
          }

          // Fallback profile from user metadata if profile row not yet created
          return {
            id: user.id,
            email: user.email || '',
            full_name: (user.user_metadata?.full_name as string) || '',
            currency_preference: 'USD',
            theme_preference: 'paper-ledger',
            default_reminder_days: [3, 1],
            created_at: user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      } catch {
        // Fallback
      }
    }
    return this.getLocalData(STORAGE_KEYS.PROFILE, defaultProfile);
  }

  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    const current = (await this.getProfile()) || defaultProfile;
    const updated: Profile = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const supabase = createClient();
    if (supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await (supabase.from('profiles') as any).upsert({
            id: user.id,
            email: user.email || current.email,
            full_name: updated.full_name,
            currency_preference: updated.currency_preference,
            theme_preference: updated.theme_preference,
            default_reminder_days: updated.default_reminder_days,
            updated_at: updated.updated_at,
          });
        }
      } catch {
        // Fallback
      }
    }

    this.setLocalData(STORAGE_KEYS.PROFILE, updated);
    return updated;
  }

  // Populate starter templates for a new user
  async populateStarterTemplates(): Promise<void> {
    const supabase = createClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        for (const sub of mockSubscriptions.slice(0, 4)) {
          await this.createSubscription({
            name: sub.name,
            description: sub.description,
            amount: sub.amount,
            currency: sub.currency,
            billing_cycle: sub.billing_cycle,
            status: sub.status,
            category_id: sub.category_id,
            start_date: sub.start_date,
            next_renewal_date: sub.next_renewal_date,
            is_trial: sub.is_trial,
            trial_end_date: sub.trial_end_date,
            reminder_offsets: sub.reminder_offsets,
            value_rating: sub.value_rating,
            cancel_url: sub.cancel_url,
            notes: sub.notes,
          });
        }
        return;
      }
    }

    this.setLocalData(STORAGE_KEYS.SUBSCRIPTIONS, mockSubscriptions);
  }

  // Reset to initial state
  resetToSampleData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTIONS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.PAYMENT_METHODS);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
  }

  // Dashboard calculations summary
  async getDashboardSummary(): Promise<DashboardStats> {
    const subs = await this.getSubscriptions();
    return calculateDashboardStats(subs);
  }
}

export const subscriptionService = new SubscriptionService();
