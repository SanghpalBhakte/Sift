// =============================================================================
// Sift - Exchange Rate Synchronization & Conversion Service
// Path: src/lib/services/exchangeRateService.ts
// =============================================================================

import { ExchangeRatesData } from '../types';

const CACHE_KEY = 'sift_exchange_rates_cache_v1';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const RECONNECT_MIN_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes debounce for reconnect sync

// Reliable static baseline exchange rates (Base: USD)
export const DEFAULT_OFFLINE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  INR: 86.8,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 153.5,
  CHF: 0.88,
  SGD: 1.34,
  NZD: 1.68,
  SEK: 10.45,
  NOK: 10.82,
  BRL: 5.65,
  ZAR: 18.2,
  AED: 3.67,
  KRW: 1380.0,
  HKD: 7.78,
  MXN: 19.8,
};

class ExchangeRateService {
  private inMemoryCache: ExchangeRatesData | null = null;
  private lastReconnectSyncTime = 0;
  private isFetching = false;

  /**
   * Returns current exchange rates from memory, localStorage, or live API
   */
  async getExchangeRates(forceRefresh = false): Promise<ExchangeRatesData> {
    // 1. Check in-memory cache if not forcing refresh
    if (!forceRefresh && this.inMemoryCache && !this.isExpired(this.inMemoryCache.updatedAt)) {
      return this.inMemoryCache;
    }

    // 2. Check localStorage in browser
    if (typeof window !== 'undefined' && !forceRefresh) {
      try {
        const stored = localStorage.getItem(CACHE_KEY);
        if (stored) {
          const parsed: ExchangeRatesData = JSON.parse(stored);
          if (!this.isExpired(parsed.updatedAt)) {
            this.inMemoryCache = parsed;
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Error reading exchange rates from localStorage:', err);
      }
    }

    // 3. Fetch from primary live open endpoints
    if (this.isFetching) {
      // Prevent duplicate parallel requests
      return this.inMemoryCache || this.getOfflineBaseline();
    }

    this.isFetching = true;
    try {
      const liveData = await this.fetchLiveRates();
      this.inMemoryCache = liveData;

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(liveData));
        } catch {
          // ignore quota error
        }
      }

      return liveData;
    } catch (err) {
      console.warn('Could not fetch live exchange rates, falling back to cached/baseline:', err);

      // Return stale cache if available
      if (this.inMemoryCache) {
        return { ...this.inMemoryCache, isStale: true };
      }

      // Check stored stale cache
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(CACHE_KEY);
          if (stored) {
            const parsed: ExchangeRatesData = JSON.parse(stored);
            this.inMemoryCache = { ...parsed, isStale: true };
            return this.inMemoryCache;
          }
        } catch {
          // Fallback
        }
      }

      // Final fallback to static baseline
      return this.getOfflineBaseline();
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Set up network online/offline listeners for smooth reconnect refresh
   */
  initReconnectSync(onSyncSuccess?: (data: ExchangeRatesData) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleOnline = async () => {
      const now = Date.now();
      // Debounce reconnect sync to avoid spamming on unstable Wi-Fi
      if (now - this.lastReconnectSyncTime < RECONNECT_MIN_INTERVAL_MS) {
        return;
      }

      const cached = this.inMemoryCache;
      const isStale = !cached || this.isExpired(cached.updatedAt);

      // Refresh in background if stale or missing
      if (isStale) {
        this.lastReconnectSyncTime = now;
        try {
          const updated = await this.getExchangeRates(true);
          if (onSyncSuccess) {
            onSyncSuccess(updated);
          }
        } catch (err) {
          console.warn('Background reconnect exchange rate sync failed:', err);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }

  /**
   * Fetches latest exchange rates from internal same-origin API route
   */
  private async fetchLiveRates(): Promise<ExchangeRatesData> {
    try {
      const res = await fetch('/api/exchange-rates', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          return {
            base: data.base || 'USD',
            rates: { ...DEFAULT_OFFLINE_RATES, ...data.rates },
            updatedAt: data.updatedAt || new Date().toISOString(),
            source: data.source || 'Open Exchange Rates (ECB / Central Banks)',
            isStale: Boolean(data.isStale),
          };
        }
      }
    } catch (err) {
      console.warn('Error fetching from /api/exchange-rates:', err);
    }

    return this.getOfflineBaseline();
  }

  /**
   * Converts an amount from one currency to another using the provided rates table
   */
  convert(
    amount: number,
    fromCurrency: string = 'USD',
    toCurrency: string = 'USD',
    rates: Record<string, number> = DEFAULT_OFFLINE_RATES
  ): number {
    if (!amount || isNaN(amount) || amount <= 0) return 0;

    const from = fromCurrency.toUpperCase().trim();
    const to = toCurrency.toUpperCase().trim();

    if (from === to) return amount;

    const fromRate = rates[from] || DEFAULT_OFFLINE_RATES[from] || 1.0;
    const toRate = rates[to] || DEFAULT_OFFLINE_RATES[to] || 1.0;

    // Convert to USD base first, then to target currency
    const amountInUSD = amount / fromRate;
    const converted = amountInUSD * toRate;

    return Math.round(converted * 100) / 100;
  }

  private getOfflineBaseline(): ExchangeRatesData {
    return {
      base: 'USD',
      rates: DEFAULT_OFFLINE_RATES,
      updatedAt: new Date().toISOString(),
      source: 'Offline Static Baseline',
      isStale: true,
    };
  }

  private isExpired(isoTimestamp: string): boolean {
    if (!isoTimestamp) return true;
    const time = new Date(isoTimestamp).getTime();
    return Date.now() - time > CACHE_TTL_MS;
  }
}

export const exchangeRateService = new ExchangeRateService();
