'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  Category,
  DashboardStats,
  ExchangeRatesData,
  PaymentMethod,
  Profile,
  Subscription,
  SubscriptionFilters,
  SubscriptionFormData,
} from '../lib/types';
import { subscriptionService } from '../lib/services/subscriptionService';
import { calculateDashboardStats } from '../lib/utils/analytics';
import { DEFAULT_OFFLINE_RATES, exchangeRateService } from '../lib/services/exchangeRateService';
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
  subscriptions: Subscription[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  profile: Profile | null;
  exchangeRates: ExchangeRatesData;
  displayCurrency: string;
  isLoading: boolean;
  filters: SubscriptionFilters;
  stats: DashboardStats;
  setFilters: React.Dispatch<React.SetStateAction<SubscriptionFilters>>;
  addSubscription: (data: SubscriptionFormData) => Promise<Subscription>;
  addCategory: (data: { name: string; slug?: string; color?: string; icon?: string }) => Promise<Category>;
  updateCategory: (id: string, data: Partial<{ name: string; slug: string; color: string; icon: string }>) => Promise<Category>;
  updateSubscription: (id: string, data: Partial<SubscriptionFormData>) => Promise<Subscription>;
  deleteSubscription: (id: string) => Promise<void>;
  toggleStatus: (id: string, currentStatus: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  populateStarterTemplates: () => Promise<void>;
  resetToSampleData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  refreshExchangeRates: (force?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRatesData>({
    base: 'USD',
    rates: DEFAULT_OFFLINE_RATES,
    updatedAt: new Date().toISOString(),
    source: 'Offline Static Baseline',
  });

  const [filters, setFilters] = useState<SubscriptionFilters>({
    status: 'all',
    category_id: 'all',
    value_rating: 'all',
    billing_cycle: 'all',
    sortBy: 'next_renewal_date',
    sortOrder: 'asc',
  });

  const displayCurrency = profile?.currency_preference || 'USD';

  const loadExchangeRates = useCallback(async (force = false) => {
    try {
      const data = await exchangeRateService.getExchangeRates(force);
      setExchangeRates(data);
    } catch (err) {
      console.warn('Error loading exchange rates:', err);
    }
  }, []);

  const loadAll = useCallback(async (isInitial = false) => {
    // Only show skeleton if we have no data at all
    if (isInitial && subscriptions.length === 0) {
      setIsLoading(true);
    }
    try {
      // Fetch all independent data sources in parallel (0 waterfalls)
      const [subs, cats, pms, prof, rates] = await Promise.all([
        subscriptionService.getSubscriptions(),
        subscriptionService.getCategories(),
        subscriptionService.getPaymentMethods(),
        subscriptionService.getProfile(),
        exchangeRateService.getExchangeRates(),
      ]);
      setSubscriptions(subs);
      setCategories(cats);
      setPaymentMethods(pms);
      setProfile(prof);
      setExchangeRates(rates);
    } catch (err) {
      console.error('Error loading subscription data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [subscriptions.length]);

  const userId = user?.id;

  useEffect(() => {
    // Seed from local storage immediately on client mount if available
    try {
      const cachedSubs = localStorage.getItem('sift_subscriptions_v1');
      if (cachedSubs) {
        const parsed = JSON.parse(cachedSubs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSubscriptions(parsed);
          setIsLoading(false);
        }
      }
    } catch {
      // Continue with regular load
    }

    loadAll(true);

    // Background reconnect sync for exchange rates
    const cleanup = exchangeRateService.initReconnectSync((updatedRates) => {
      setExchangeRates(updatedRates);
    });

    return () => cleanup();
  }, [loadAll, userId]);

  const addSubscription = async (data: SubscriptionFormData): Promise<Subscription> => {
    const created = await subscriptionService.createSubscription(data);
    await loadAll();
    return created;
  };

  const addCategory = async (data: {
    name: string;
    slug?: string;
    color?: string;
    icon?: string;
  }): Promise<Category> => {
    const created = await subscriptionService.createCategory(data);
    await loadAll();
    return created;
  };

  const updateCategory = async (
    id: string,
    data: Partial<{ name: string; slug: string; color: string; icon: string }>
  ): Promise<Category> => {
    const updated = await subscriptionService.updateCategory(id, data);
    await loadAll();
    return updated;
  };

  const updateSubscription = async (
    id: string,
    data: Partial<SubscriptionFormData>
  ): Promise<Subscription> => {
    const updated = await subscriptionService.updateSubscription(id, data);
    await loadAll();
    return updated;
  };

  const deleteSubscription = async (id: string): Promise<void> => {
    await subscriptionService.deleteSubscription(id);
    await loadAll();
  };

  const toggleStatus = async (id: string, currentStatus: string): Promise<void> => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await subscriptionService.updateSubscription(id, {
      status: newStatus as Subscription['status'],
    });
    await loadAll();
  };

  const handleUpdateProfile = async (updates: Partial<Profile>): Promise<void> => {
    const updated = await subscriptionService.updateProfile(updates);
    setProfile(updated);
  };

  const handlePopulateStarterTemplates = async (): Promise<void> => {
    await subscriptionService.populateStarterTemplates();
    await loadAll();
  };

  const handleResetToSampleData = async (): Promise<void> => {
    subscriptionService.resetToSampleData();
    await loadAll();
  };

  const handleClearAllData = async (): Promise<void> => {
    await subscriptionService.clearAllData();
    await loadAll();
  };

  const stats = useMemo(() => {
    return calculateDashboardStats(subscriptions, displayCurrency, exchangeRates.rates);
  }, [subscriptions, displayCurrency, exchangeRates.rates]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptions,
        categories,
        paymentMethods,
        profile,
        exchangeRates,
        displayCurrency,
        isLoading,
        filters,
        stats,
        setFilters,
        addSubscription,
        addCategory,
        updateCategory,
        updateSubscription,
        deleteSubscription,
        toggleStatus,
        updateProfile: handleUpdateProfile,
        populateStarterTemplates: handlePopulateStarterTemplates,
        resetToSampleData: handleResetToSampleData,
        clearAllData: handleClearAllData,
        refreshExchangeRates: loadExchangeRates,
        refresh: loadAll,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptions() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptions must be used within a SubscriptionProvider');
  }
  return context;
}
