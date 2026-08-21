import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Validates that a redirect target is a safe relative path.
 * Blocks open-redirect attacks where `next` could be set to an external URL.
 */
function isSafeRedirectPath(path: string): boolean {
  // Must start with / and not be a protocol-relative URL (//evil.com)
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  // Reject anything containing a protocol colon (javascript:, data:, https:)
  if (/[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(path)) return false;
  return true;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') ?? '/';

  // Validate the redirect target is a safe relative path before using it
  const next = isSafeRedirectPath(rawNext) ? rawNext : '/';

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return user to an error page with instructions if exchange fails
  return NextResponse.redirect(`${origin}/login?error=auth-failed`);
}
