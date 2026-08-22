import { createClient } from '@/lib/supabase/client';

/**
 * Checks Authenticator Assurance Level (AAL) and redirects to MFA challenge
 * if the user has enrolled TOTP factor (aal2) but currently authenticated at aal1.
 */
export async function requireMFA(redirectToMFA: () => void): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;

  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) {
      console.error('Error checking MFA assurance level:', error);
      return false;
    }

    if (data?.nextLevel === 'aal2' && data.nextLevel !== data.currentLevel) {
      redirectToMFA();
      return true;
    }
  } catch (err) {
    console.error('Exception checking MFA status:', err);
  }

  return false;
}
