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

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [subs, cats, pms, prof] = await Promise.all([
        subscriptionService.getSubscriptions(),
        subscriptionService.getCategories(),
        subscriptionService.getPaymentMethods(),
        subscriptionService.getProfile(),
      ]);
      setSubscriptions(subs);
      setCategories(cats);
      setPaymentMethods(pms);
      setProfile(prof);
      await loadExchangeRates();
    } catch (err) {
      console.error('Error loading subscription data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [loadExchangeRates]);

  useEffect(() => {
    loadAll();

    // Background reconnect sync for exchange rates
    const cleanup = exchangeRateService.initReconnectSync((updatedRates) => {
      setExchangeRates(updatedRates);
    });

    return () => cleanup();
  }, [loadAll, user]);

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
