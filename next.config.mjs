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
    console.error('\n❌ [Sift Environment Validation Error]:');
    issues.forEach((err) => console.error(`  - ${err}`));
    console.error('');
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Build failed due to invalid environment variables:\n${issues.join('\n')}`);
    }
  }
}

validateBuildEnv();

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // optimize packages
  },
};

export default nextConfig;
