/** @type {import('next').NextConfig} */

// Build-time environment variable audit
function validateBuildEnv() {
  const issues = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL must be a valid URL starting with https:// or http://');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && !appUrl.startsWith('http://') && !appUrl.startsWith('https://')) {
    issues.push('NEXT_PUBLIC_APP_URL must be a valid URL starting with https:// or http://');
  }

  if (process.env.VAPID_PRIVATE_KEY && !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    issues.push('VAPID_PRIVATE_KEY is present but NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing.');
  }

  if (issues.length > 0) {
    console.error('\n\u274c [Sift Environment Validation Error]:');
    issues.forEach((err) => console.error(`  - ${err}`));
    console.error('');
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Build failed due to invalid environment variables:\n${issues.join('\n')}`);
    }
  }
}

validateBuildEnv();

/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Block browsers from MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Prevent Sift from being embedded in iframes (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Enable HSTS — browsers will only connect via HTTPS for 1 year
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  // Control referrer info sent on navigation
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Restrict access to sensitive browser APIs
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // CSP — allow Supabase, Resend, Vercel Analytics, and Exchange Rates APIs; block everything else
  {
    key: 'Content-Security-Policy',
    value: [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live`,
      `style-src 'self' 'unsafe-inline' https://api.fontshare.com https://fonts.googleapis.com`,
      `font-src 'self' https://api.fontshare.com https://fonts.gstatic.com`,
      `img-src 'self' data: blob: https://*.supabase.co`,
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://vitals.vercel-insights.com https://open.er-api.com https://api.frankfurter.dev`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  experimental: {
    // optimize packages
  },
};

export default nextConfig;
