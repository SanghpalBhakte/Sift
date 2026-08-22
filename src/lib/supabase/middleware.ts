import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from './client';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!isSupabaseConfigured()) {
    // If Supabase environment variables are missing, allow request to proceed for local fallback
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Use getUser() for secure server-side auth checking instead of getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/mfa-challenge');

  const isPublicRoute =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icons') ||
    pathname.includes('.') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/manifest.json' ||
    pathname === '/privacy';

  // 1. Unauthenticated users trying to access protected routes -> redirect to /login
  if (!user && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // 2. Authenticated users: Check MFA assurance level (AAL2)
  if (user) {
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const needsMFA =
      aalData && aalData.nextLevel === 'aal2' && aalData.nextLevel !== aalData.currentLevel;

    // If MFA is required but not completed, enforce /mfa-challenge
    if (needsMFA && pathname !== '/mfa-challenge' && !pathname.startsWith('/auth/callback')) {
      const url = request.nextUrl.clone();
      url.pathname = '/mfa-challenge';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }

    // If user is already fully authenticated (aal2 satisfied or no mfa), redirect away from login/signup/mfa-challenge
    if (
      !needsMFA &&
      isAuthRoute &&
      !pathname.startsWith('/auth/callback') &&
      !pathname.startsWith('/api/auth/callback')
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
