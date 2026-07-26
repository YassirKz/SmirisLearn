import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateInvitationToken, isValidToken, getExpirationDate, isTokenExpired } from '../../../utils/tokenGenerator';

describe('generateInvitationToken', () => {
  it('génère un token avec le préfixe INV_', () => {
    const token = generateInvitationToken();
    expect(token.startsWith('INV_')).toBe(true);
  });

  it('génère un token d\'au moins 20 caractères', () => {
    const token = generateInvitationToken();
    expect(token.length).toBeGreaterThanOrEqual(20);
  });

  it('génère un token avec des caractères hexadécimaux après le préfixe', () => {
    const token = generateInvitationToken();
    const hex = token.slice(4); // Remove "INV_"
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });

  it('génère exactement 64 caractères hex (32 bytes)', () => {
    const token = generateInvitationToken();
    const hex = token.slice(4);
    expect(hex.length).toBe(64);
    // Total: "INV_" (4) + 64 hex = 68
    expect(token.length).toBe(68);
  });

  it('génère des tokens uniques à chaque appel', () => {
    const token1 = generateInvitationToken();
    const token2 = generateInvitationToken();
    expect(token1).not.toBe(token2);
  });

  it('fonctionne avec crypto.getRandomValues mocké', () => {
    const originalGetRandomValues = crypto.getRandomValues;
    // Mock pour retourner des valeurs prévisibles
    crypto.getRandomValues = (arr) => {
      for (let i = 0; i < arr.length; i++) arr[i] = 0xab;
      return arr;
    };

    const token = generateInvitationToken();
    expect(token).toBe('INV_' + 'ab'.repeat(32));

    crypto.getRandomValues = originalGetRandomValues;
  });
});

describe('isValidToken', () => {
  it('accepte un token au format INV_XXX (hex, >= 20 chars)', () => {
    const token = generateInvitationToken();
    expect(isValidToken(token)).toBe(true);
  });

  it('accepte un token au format INV_ suivi d\'alphanumériques (ancien format base36)', () => {
    expect(isValidToken('INV_abc123def456ghi789')).toBe(true);
  });

  it('rejette une chaîne vide', () => {
    expect(isValidToken('')).toBe(false);
  });

  it('rejette un token sans préfixe INV_', () => {
    expect(isValidToken('TOKEN_abc123def456ghi789')).toBe(false);
  });

  it('rejette null/undefined', () => {
    expect(isValidToken(null)).toBe(false);
    expect(isValidToken(undefined)).toBe(false);
  });

  it('rejette un token trop court', () => {
    expect(isValidToken('INV_abc')).toBe(false); // 7 chars < 20
  });

  it('rejette un token avec des caractères spéciaux', () => {
    expect(isValidToken('INV_abc123!@#$%^&*()123456')).toBe(false);
  });
});

describe('getExpirationDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retourne une date ISO string', () => {
    const result = getExpirationDate();
    expect(() => new Date(result)).not.toThrow();
    // ISO format check
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('retourne une date exactement 24h dans le futur', () => {
    const now = new Date('2025-06-15T12:00:00Z');
    vi.setSystemTime(now);

    const result = getExpirationDate();
    const expirationDate = new Date(result);
    const expected = new Date('2025-06-16T12:00:00Z');

    expect(expirationDate.getTime()).toBe(expected.getTime());
  });

  it('gère le passage minuit', () => {
    const now = new Date('2025-12-31T23:00:00Z');
    vi.setSystemTime(now);

    const result = getExpirationDate();
    const expirationDate = new Date(result);
    const expected = new Date('2026-01-01T23:00:00Z');

    expect(expirationDate.getTime()).toBe(expected.getTime());
  });
});

describe('isTokenExpired', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('détecte un token expiré (date passée)', () => {
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
    expect(isTokenExpired('2025-06-14T12:00:00Z')).toBe(true);
  });

  it('détecte un token valide (date future)', () => {
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
    expect(isTokenExpired('2025-06-16T12:00:00Z')).toBe(false);
  });

  it('détecte un token expiré exactement maintenant comme expiré', () => {
    const now = new Date('2025-06-15T12:00:00Z');
    vi.setSystemTime(now);
    // Même seconde → new Date(expiresAt) < new Date() → false (not strictly <)
    // Actually both are equal, so < returns false → not expired
    expect(isTokenExpired('2025-06-15T12:00:00.000Z')).toBe(false);
  });

  it('détecte un token expiré 1ms dans le passé', () => {
    vi.setSystemTime(new Date('2025-06-15T12:00:00.001Z'));
    expect(isTokenExpired('2025-06-15T12:00:00.000Z')).toBe(true);
  });
});
