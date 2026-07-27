import { beforeEach, describe, expect, it, vi } from 'vitest';

const GUEST_SESSION_ID = '550e8400-e29b-41d4-a716-446655440000';
const OTHER_SESSION_ID = '660e8400-e29b-41d4-a716-446655440001';

function mockSessionStorage(): void {
  const store = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  });
}

describe('guestSessionStorage', () => {
  beforeEach(() => {
    vi.resetModules();
    mockSessionStorage();
  });

  it('resolveGuestSessionId lit sessionStorage en priorité', async () => {
    const { setGuestSessionId, resolveGuestSessionId } = await import('./guestSessionStorage');
    setGuestSessionId(GUEST_SESSION_ID);
    expect(resolveGuestSessionId(OTHER_SESSION_ID)).toBe(GUEST_SESSION_ID);
  });

  it('resolveGuestSessionId retombe sur ?s= puis sessionId analyse', async () => {
    const { resolveGuestSessionId } = await import('./guestSessionStorage');
    expect(resolveGuestSessionId(GUEST_SESSION_ID)).toBe(GUEST_SESSION_ID);
    expect(resolveGuestSessionId(null, OTHER_SESSION_ID)).toBe(OTHER_SESSION_ID);
    expect(resolveGuestSessionId(null, null)).toBeNull();
  });

  it('resolveGuestSessionIdForClaim préfère l’argument explicite', async () => {
    const { setGuestSessionId, resolveGuestSessionIdForClaim } =
      await import('./guestSessionStorage');
    setGuestSessionId(GUEST_SESSION_ID);
    expect(resolveGuestSessionIdForClaim(OTHER_SESSION_ID)).toBe(OTHER_SESSION_ID);
    expect(resolveGuestSessionIdForClaim(null)).toBe(GUEST_SESSION_ID);
  });
});
