import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';

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
    { media: '(prefers-color-scheme: light)', color: '#F8F7F3' },
    { media: '(prefers-color-scheme: dark)', color: '#111413' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <ThemeProvider>
          <SubscriptionProvider>{children}</SubscriptionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
