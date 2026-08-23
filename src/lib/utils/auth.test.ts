import { describe, it, expect } from 'vitest';
import { getSafeNext } from './safe-redirect';

describe('Auth Redirection & Security Validation', () => {
  describe('getSafeNext() open-redirect protection', () => {
    it('allows clean relative root and subroutes', () => {
      expect(getSafeNext('/')).toBe('/');
      expect(getSafeNext('/subscriptions')).toBe('/subscriptions');
      expect(getSafeNext('/insights')).toBe('/insights');
      expect(getSafeNext('/settings/security')).toBe('/settings/security');
      expect(getSafeNext('/subscriptions/new?name=Netflix')).toBe('/subscriptions/new?name=Netflix');
    });

    it('rejects external absolute URLs and falls back to /', () => {
      expect(getSafeNext('https://evil.com')).toBe('/');
      expect(getSafeNext('http://attacker.org/steal')).toBe('/');
      expect(getSafeNext('//evil.com/phish')).toBe('/');
      expect(getSafeNext('/\\evil.com')).toBe('/');
    });

    it('rejects javascript: and data: pseudo-protocols', () => {
      expect(getSafeNext('javascript:alert(1)')).toBe('/');
      expect(getSafeNext('data:text/html,evil')).toBe('/');
    });

    it('handles null, undefined, and empty string safely', () => {
      expect(getSafeNext(null)).toBe('/');
      expect(getSafeNext(undefined)).toBe('/');
      expect(getSafeNext('')).toBe('/');
      expect(getSafeNext('   ')).toBe('/');
      expect(getSafeNext(null, '/dashboard')).toBe('/dashboard');
    });
  });
});
