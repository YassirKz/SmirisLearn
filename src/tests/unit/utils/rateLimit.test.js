import { describe, it, expect, vi } from 'vitest';
import { checkRateLimit, resetRateLimit } from '../../../utils/rateLimit';

describe('checkRateLimit', () => {
  // Use unique identifiers per test to avoid cross-contamination
  // (the module-level Map persists across tests)

  it('autorise la première tentative', () => {
    const id = `user-first-${Date.now()}`;
    expect(checkRateLimit('test-action', id, 5, 60000)).toBe(true);
  });

  it('autorise les tentatives dans la limite (maxAttempts = 3)', () => {
    const id = `user-within-${Date.now()}`;
    expect(checkRateLimit('within', id, 3, 60000)).toBe(true);  // 1
    expect(checkRateLimit('within', id, 3, 60000)).toBe(true);  // 2
    expect(checkRateLimit('within', id, 3, 60000)).toBe(true);  // 3
  });

  it('bloque les tentatives au-delà de la limite', () => {
    const id = `user-block-${Date.now()}`;
    checkRateLimit('block', id, 2, 60000); // 1
    checkRateLimit('block', id, 2, 60000); // 2
    expect(checkRateLimit('block', id, 2, 60000)).toBe(false); // 3 → blocked
  });

  it('continue de bloquer après dépassement', () => {
    const id = `user-multi-block-${Date.now()}`;
    checkRateLimit('multi', id, 1, 60000); // 1 → ok
    expect(checkRateLimit('multi', id, 1, 60000)).toBe(false); // 2 → blocked
    expect(checkRateLimit('multi', id, 1, 60000)).toBe(false); // 3 → still blocked
  });

  it('réinitialise après expiration de la fenêtre', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    const id = `user-expire-${now}`;
    checkRateLimit('expire', id, 1, 1000); // 1 → ok
    expect(checkRateLimit('expire', id, 1, 1000)).toBe(false); // blocked

    // Advance past the window
    vi.setSystemTime(now + 1001);
    expect(checkRateLimit('expire', id, 1, 1000)).toBe(true); // new window → ok

    vi.useRealTimers();
  });

  it('isole les identifiants différents', () => {
    const id1 = `user-iso-a-${Date.now()}`;
    const id2 = `user-iso-b-${Date.now()}`;
    checkRateLimit('iso', id1, 1, 60000); // user A: 1 → ok
    expect(checkRateLimit('iso', id1, 1, 60000)).toBe(false); // user A blocked

    expect(checkRateLimit('iso', id2, 1, 60000)).toBe(true); // user B → ok
  });

  it('isole les actions différentes', () => {
    const id = `user-action-${Date.now()}`;
    checkRateLimit('action-a', id, 1, 60000); // action A: 1 → ok
    expect(checkRateLimit('action-a', id, 1, 60000)).toBe(false); // action A blocked

    expect(checkRateLimit('action-b', id, 1, 60000)).toBe(true); // action B → ok
  });
});

describe('resetRateLimit', () => {
  it('supprime l\'entrée du cache pour une action/identifiant', () => {
    const id = `user-reset-${Date.now()}`;
    checkRateLimit('reset-action', id, 1, 60000); // 1 → ok
    expect(checkRateLimit('reset-action', id, 1, 60000)).toBe(false); // blocked

    resetRateLimit('reset-action', id);
    expect(checkRateLimit('reset-action', id, 1, 60000)).toBe(true); // unblocked → ok
  });

  it('ne lève pas d\'erreur pour une clé inexistante', () => {
    expect(() => resetRateLimit('nonexistent', 'nobody')).not.toThrow();
  });
});
