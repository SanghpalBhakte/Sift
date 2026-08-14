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
  mockCategories,
  mockPaymentMethods,
  mockProfile,
  mockSubscriptions,
} from '../mock/sampleData';
import { createClient, isSupabaseConfigured } from '../supabase/client';
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
        let query = supabase
          .from('subscriptions')
          .select('*, category:categories(*), payment_method:payment_methods(*)');

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
        if (!error && data && data.length > 0) {
          items = data as unknown as Subscription[];
        } else {
          // Fallback to local
          items = this.getLocalData(STORAGE_KEYS.SUBSCRIPTIONS, mockSubscriptions);
        }
      } catch {
        items = this.getLocalData(STORAGE_KEYS.SUBSCRIPTIONS, mockSubscriptions);
      }
    } else {
      items = this.getLocalData(STORAGE_KEYS.SUBSCRIPTIONS, mockSubscriptions);
    }

    // Attach expanded category & payment method locally if needed
    const categories = await this.getCategories();
    const paymentMethods = await this.getPaymentMethods();

    items = items.map((sub) => ({
      ...sub,
      category: sub.category || categories.find((c) => c.id === sub.category_id),
      payment_method:
        sub.payment_method || paymentMethods.find((p) => p.id === sub.payment_method_id),
    }));

    // Apply in-memory search/filtering
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

    if (filters?.status && filters.status !== 'all') {
      items = items.filter((s) => s.status === filters.status);
    }

    if (filters?.category_id && filters.category_id !== 'all') {
      items = items.filter((s) => s.category_id === filters.category_id);
    }

    if (filters?.value_rating && filters.value_rating !== 'all') {
      items = items.filter((s) => s.value_rating === filters.value_rating);
    }

    if (filters?.billing_cycle && filters.billing_cycle !== 'all') {
      items = items.filter((s) => s.billing_cycle === filters.billing_cycle);
    }

    // Sorting
    const sortBy = filters?.sortBy || 'next_renewal_date';
    const sortOrder = filters?.sortOrder || 'asc';

    items.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'next_renewal_date') {
        comparison = new Date(a.next_renewal_date).getTime() - new Date(b.next_renewal_date).getTime();
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

    const newSub: Subscription = {
      ...form,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sub-${Date.now()}`,
      user_id: mockProfile.id,
      monthly_amount: monthlyAmount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: newSub.user_id,
            name: newSub.name,
            description: newSub.description || null,
            amount: newSub.amount,
            currency: newSub.currency,
            billing_cycle: newSub.billing_cycle,
            custom_interval_days: newSub.custom_interval_days || null,
            status: newSub.status,
            category_id: newSub.category_id || null,
            payment_method_id: newSub.payment_method_id || null,
            start_date: newSub.start_date,
            next_renewal_date: newSub.next_renewal_date,
            is_trial: newSub.is_trial,
            trial_end_date: newSub.trial_end_date || null,
            reminder_offsets: newSub.reminder_offsets,
            value_rating: newSub.value_rating,
            cancel_url: newSub.cancel_url || null,
            notes: newSub.notes || null,
            monthly_amount: newSub.monthly_amount,
          })
          .select()
          .single();

        if (!error && data) {
          return data as unknown as Subscription;
        }
      } catch {
        // Fallback to local
      }
    }

    // Local storage fallback
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
    const customDays = updates.custom_interval_days !== undefined ? updates.custom_interval_days : existing.custom_interval_days;
    const monthlyAmount = normalizeMonthlyAmount(amount, billingCycle, customDays);

    const updatedSub: Subscription = {
      ...existing,
      ...updates,
      monthly_amount: monthlyAmount,
      updated_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        await supabase
          .from('subscriptions')
          .update({
            name: updatedSub.name,
            description: updatedSub.description,
            amount: updatedSub.amount,
            currency: updatedSub.currency,
            billing_cycle: updatedSub.billing_cycle,
            custom_interval_days: updatedSub.custom_interval_days,
            status: updatedSub.status,
            category_id: updatedSub.category_id,
            payment_method_id: updatedSub.payment_method_id,
            start_date: updatedSub.start_date,
            next_renewal_date: updatedSub.next_renewal_date,
            is_trial: updatedSub.is_trial,
            trial_end_date: updatedSub.trial_end_date,
            reminder_offsets: updatedSub.reminder_offsets,
            value_rating: updatedSub.value_rating,
            cancel_url: updatedSub.cancel_url,
            notes: updatedSub.notes,
            monthly_amount: updatedSub.monthly_amount,
            updated_at: updatedSub.updated_at,
          })
          .eq('id', id);
      } catch {
        // Continue to local
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
      try {
        await supabase.from('subscriptions').delete().eq('id', id);
      } catch {
        // local fallback
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
        const { data, error } = await supabase.from('categories').select('*');
        if (!error && data && data.length > 0) {
          return data as Category[];
        }
      } catch {
        // Fallback
      }
    }
    return this.getLocalData(STORAGE_KEYS.CATEGORIES, mockCategories);
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const supabase = createClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('payment_methods').select('*');
        if (!error && data && data.length > 0) {
          return data as PaymentMethod[];
        }
      } catch {
        // Fallback
      }
    }
    return this.getLocalData(STORAGE_KEYS.PAYMENT_METHODS, mockPaymentMethods);
  }

  // --- Profile & Preferences ---

  async getProfile(): Promise<Profile> {
    const supabase = createClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('profiles').select('*').single();
        if (!error && data) {
          return data as Profile;
        }
      } catch {
        // Fallback
      }
    }
    return this.getLocalData(STORAGE_KEYS.PROFILE, mockProfile);
  }

  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    const current = await this.getProfile();
    const updated: Profile = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const supabase = createClient();
    if (supabase) {
      try {
        await supabase.from('profiles').update(updates).eq('id', current.id);
      } catch {
        // local fallback
      }
    }

    this.setLocalData(STORAGE_KEYS.PROFILE, updated);
    return updated;
  }

  // --- Reset to initial state ---
  resetToSampleData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTIONS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.PAYMENT_METHODS);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
  }

  // --- Dashboard Summary ---
  async getDashboardSummary(): Promise<DashboardStats> {
    const subs = await this.getSubscriptions();
    return calculateDashboardStats(subs);
  }
}

export const subscriptionService = new SubscriptionService();
