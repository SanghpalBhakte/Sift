import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSafeNext } from '@/lib/utils/safe-redirect';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = getSafeNext(searchParams.get('next'), '/');

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Check if user requires MFA assurance level 2
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalData?.nextLevel === 'aal2' && aalData.nextLevel !== aalData.currentLevel) {
          return NextResponse.redirect(`${origin}/mfa/challenge?next=${encodeURIComponent(next)}`);
        }

        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-failed`);
}
