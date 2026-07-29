import { beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'ficheproduct_guest_session_id';
const GUEST_SESSION_ID = '550e8400-e29b-41d4-a716-446655440000';

function mockSessionStorage(): Map<string, string> {
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
  return store;
}

describe('guestSessionStorage', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('clearGuestSessionId retire la clé sessionStorage', async () => {
    const store = mockSessionStorage();
    store.set(STORAGE_KEY, GUEST_SESSION_ID);

    const { clearGuestSessionId } = await import('./guestSessionStorage');
    clearGuestSessionId();

    expect(store.has(STORAGE_KEY)).toBe(false);
  });

  it('clearGuestSessionId ne lève pas si sessionStorage est indisponible', async () => {
    vi.stubGlobal('sessionStorage', {
      removeItem: () => {
        throw new Error('blocked');
      },
    });

    const { clearGuestSessionId } = await import('./guestSessionStorage');
    expect(() => {
      clearGuestSessionId();
    }).not.toThrow();
  });
});
