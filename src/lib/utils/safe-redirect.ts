/**
 * Validates that a redirect URL is an internal, relative path.
 * Protects against open redirect vulnerabilities.
 */
export function getSafeNext(next: string | null | undefined, fallback: string = '/'): string {
  if (!next) return fallback;
  const trimmed = next.trim();
  // Must start with a single slash and not double slash or backslash
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return trimmed;
  }
  return fallback;
}
