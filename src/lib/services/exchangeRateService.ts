// =============================================================================
// Sift - Exchange Rate Synchronization & Conversion Service
// Path: src/lib/services/exchangeRateService.ts
// =============================================================================

import { ExchangeRatesData } from '../types';

const CACHE_KEY = 'sift_exchange_rates_cache_v1';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

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

  /**
   * Returns current exchange rates from cache, live API, or fallback
   */
  async getExchangeRates(forceRefresh = false): Promise<ExchangeRatesData> {
    // 1. Check in-memory cache
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

    // 3. Fetch from primary open API (Open Exchange Rates API / Frankfurter)
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

      // Final fallback to static baseline
      const fallbackData: ExchangeRatesData = {
        base: 'USD',
        rates: DEFAULT_OFFLINE_RATES,
        updatedAt: new Date().toISOString(),
        source: 'Offline Static Baseline',
        isStale: true,
      };

      return fallbackData;
    }
  }

  /**
   * Fetches latest exchange rates from open endpoint
   */
  private async fetchLiveRates(): Promise<ExchangeRatesData> {
    // Primary: open.er-api.com (160+ currencies, fast, open)
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          return {
            base: 'USD',
            rates: { ...DEFAULT_OFFLINE_RATES, ...data.rates },
            updatedAt: new Date().toISOString(),
            source: 'Open Exchange Rates (ECB / Central Banks)',
          };
        }
      }
    } catch {
      // try secondary
    }

    // Secondary fallback: Frankfurter
    const fallbackRes = await fetch('https://api.frankfurter.dev/v1/latest?base=USD');
    const data = await fallbackRes.json();
    return {
      base: 'USD',
      rates: { ...DEFAULT_OFFLINE_RATES, USD: 1.0, ...(data.rates || {}) },
      updatedAt: new Date().toISOString(),
      source: 'Frankfurter (European Central Bank)',
    };
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

  private isExpired(isoTimestamp: string): boolean {
    if (!isoTimestamp) return true;
    const time = new Date(isoTimestamp).getTime();
    return Date.now() - time > CACHE_TTL_MS;
  }
}

export const exchangeRateService = new ExchangeRateService();
