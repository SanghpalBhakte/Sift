import { NextResponse } from 'next/server';
import { DEFAULT_OFFLINE_RATES } from '@/lib/services/exchangeRateService';
import { ExchangeRatesData } from '@/lib/types';

// Force dynamic execution with 12 hour revalidation
export const revalidate = 43200; // 12 hours in seconds

export async function GET() {
  // 1. Primary: open.er-api.com (ECB & Central Banks, reliable, HTTPS)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      next: { revalidate: 43200 },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        const responseData: ExchangeRatesData = {
          base: 'USD',
          rates: { ...DEFAULT_OFFLINE_RATES, ...data.rates },
          updatedAt: new Date().toISOString(),
          source: 'Open Exchange Rates (ECB / Central Banks)',
          isStale: false,
        };

        return NextResponse.json(responseData, {
          headers: {
            'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400',
          },
        });
      }
    }
  } catch (primaryErr) {
    console.warn('Primary exchange rate fetch failed (open.er-api.com):', primaryErr);
  }

  // 2. Secondary fallback: Frankfurter API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const fallbackRes = await fetch('https://api.frankfurter.dev/v1/latest?base=USD', {
      signal: controller.signal,
      next: { revalidate: 43200 },
    });
    clearTimeout(timeoutId);

    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      if (data && data.rates) {
        const responseData: ExchangeRatesData = {
          base: 'USD',
          rates: { ...DEFAULT_OFFLINE_RATES, USD: 1.0, ...data.rates },
          updatedAt: new Date().toISOString(),
          source: 'Frankfurter (European Central Bank)',
          isStale: false,
        };

        return NextResponse.json(responseData, {
          headers: {
            'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400',
          },
        });
      }
    }
  } catch (fallbackErr) {
    console.warn('Secondary exchange rate fetch failed (api.frankfurter.dev):', fallbackErr);
  }

  // 3. Graceful baseline fallback
  const fallbackBaseline: ExchangeRatesData = {
    base: 'USD',
    rates: DEFAULT_OFFLINE_RATES,
    updatedAt: new Date().toISOString(),
    source: 'Offline Static Baseline',
    isStale: true,
  };

  return NextResponse.json(fallbackBaseline, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}
