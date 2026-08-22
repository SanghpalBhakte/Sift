import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Validates that `next` is a safe relative path.
 * - Must start with `/`
 * - Must NOT start with `//` (protocol-relative URL, e.g. //evil.com)
 * - Falls back to `/` for anything that looks external or blank
 */
function safeRedirectPath(next: string | null): string {
  if (!next) return '/';
  if (!next.startsWith('/')) return '/';
  if (next.startsWith('//')) return '/';
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeRedirectPath(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-failed`);
}
