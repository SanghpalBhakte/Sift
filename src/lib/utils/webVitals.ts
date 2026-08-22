'use client';

import { useReportWebVitals } from 'next/web-vitals';

/**
 * Lightweight client Web Vitals reporter.
 * Automatically reports Core Web Vitals (LCP, FID, CLS, INP, FCP, TTFB) in development
 * or to custom analytics endpoints.
 */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vitals] ${metric.name}:`, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value) / (metric.name === 'CLS' ? 1000 : 1),
        rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
        id: metric.id,
      });
    }
  });

  return null;
}
