import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Fraunces } from 'next/font/google';
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
  variable: '--font-sans',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true,
  fallback: ['Georgia', 'serif'],
  adjustFontFallback: true,
  variable: '--font-fraunces',
});

export const metadata: Metadata = {
  title: 'Sweep — Your recurring life, in one clear view',
  description:
    'A calm, tactile subscription and recurring spend workspace. Track subscriptions, upcoming renewals, free trials, and clear financial clutter with peace of mind.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/favicon.svg',
    shortcut: '/icons/favicon.svg',
    apple: '/icons/icon-192.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sweep',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F1E8' },
    { media: '(prefers-color-scheme: dark)', color: '#191516' },
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
      <body className={`${plusJakartaSans.variable} ${fraunces.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
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
