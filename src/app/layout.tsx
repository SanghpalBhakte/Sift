import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Fraunces } from 'next/font/google';
import './globals.css';
import { Providers } from '@/app/providers';
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://sweep-sanghapal2006-8427s-projects.vercel.app'
  ),
  title: 'Sweep — Your recurring life, in one clear view',
  description:
    'A calm, tactile subscription and recurring spend workspace. Track subscriptions, upcoming renewals, free trials, and clear financial clutter with peace of mind.',
  applicationName: 'Sweep',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/icons/favicon.svg',
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sweep',
  },
  openGraph: {
    title: 'Sweep — Your recurring life, in one clear view',
    description:
      'A calm, tactile subscription and recurring spend workspace. Track subscriptions, upcoming renewals, free trials, and clear financial clutter.',
    url: 'https://sweep-sanghapal2006-8427s-projects.vercel.app',
    siteName: 'Sweep',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sweep — Recurring Spend Workspace',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sweep — Your recurring life, in one clear view',
    description:
      'A calm, tactile subscription and recurring spend workspace. Track subscriptions, upcoming renewals, free trials, and clear financial clutter.',
    images: ['/og-image.png'],
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
      <body
        suppressHydrationWarning
        className={`${plusJakartaSans.variable} ${fraunces.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        <Providers>
          <ThemeProvider>
            <AuthProvider>
              <SubscriptionProvider>
                <NotificationProvider>{children}</NotificationProvider>
              </SubscriptionProvider>
            </AuthProvider>
          </ThemeProvider>
        </Providers>
        <Analytics />
        <SpeedInsights />
        <WebVitalsReporter />
      </body>
    </html>
  );
}
