import { createBrowserClient } from '@supabase/ssr';
import { Database } from './types';

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      anonKey &&
      !url.includes('your-project-id') &&
      !anonKey.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
  );
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!isSupabaseConfigured()) {
    return null;
  }

  return createBrowserClient<Database>(url, anonKey);
}
