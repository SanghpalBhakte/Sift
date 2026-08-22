import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { WebVitalsReporter } from '@/lib/utils/webVitals';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
  adjustFontFallback: true,
  variable: '--font-plus-jakarta',
});

export const metadata: Metadata = {
  title: 'Sift — Calm Recurring Spend Workspace',
  description:
    'A calm, minimal, mobile-first subscription and recurring payments dashboard. Track subscriptions, upcoming renewals, free trials, and cancel candidates with peace of mind.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sift',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F9F8F5' },
    { media: '(prefers-color-scheme: dark)', color: '#111318' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseOrigin: string | null = null;
  if (supabaseUrl && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'))) {
    try {
      supabaseOrigin = new URL(supabaseUrl).origin;
    } catch {
      // Ignore invalid URL
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {supabaseOrigin && (
          <>
            <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        )}
      </head>
      <body className={`${plusJakartaSans.className} antialiased min-h-screen bg-background text-foreground`}>
        <ThemeProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <NotificationProvider>{children}</NotificationProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
        <WebVitalsReporter />
      </body>
    </html>
  );
}
