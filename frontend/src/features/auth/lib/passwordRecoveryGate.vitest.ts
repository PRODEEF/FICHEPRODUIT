import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  capturePasswordRecoveryIntent,
  clearPasswordRecoveryHash,
  establishPasswordRecoverySession,
  hasPasswordRecoveryIntent,
  isPasswordRecoveryUrl,
  subscribePasswordRecoveryGate,
} from './passwordRecoveryGate';

function createSessionStorageMock() {
  const storage = new Map<string, string>();
  return {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => {
      storage.set(k, v);
    },
    removeItem: (k: string) => {
      storage.delete(k);
    },
  };
}

function stubWindow(location: {
  hash: string;
  pathname: string;
  search: string;
}) {
  const sessionStorage = createSessionStorageMock();
  vi.stubGlobal('sessionStorage', sessionStorage);
  vi.stubGlobal('window', {
    location,
    sessionStorage,
    history: { replaceState: vi.fn() },
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    setInterval: globalThis.setInterval.bind(globalThis),
    clearInterval: globalThis.clearInterval.bind(globalThis),
  });
}

describe('isPasswordRecoveryUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('détecte type=recovery dans le hash', () => {
    stubWindow({
      hash: '#access_token=x&type=recovery',
      pathname: '/auth/reset-password',
      search: '',
    });
    expect(isPasswordRecoveryUrl()).toBe(true);
  });

  it('détecte ?code= sur la route reset-password (PKCE)', () => {
    stubWindow({
      hash: '',
      pathname: '/auth/reset-password',
      search: '?code=abc',
    });
    expect(isPasswordRecoveryUrl()).toBe(true);
  });

  it('ignore ?code= sur une autre route', () => {
    stubWindow({
      hash: '',
      pathname: '/login',
      search: '?code=abc',
    });
    expect(isPasswordRecoveryUrl()).toBe(false);
  });
});

describe('capturePasswordRecoveryIntent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mémorise l’intention quand l’URL est un lien recovery', () => {
    stubWindow({
      hash: '#access_token=x&type=recovery',
      pathname: '/auth/reset-password',
      search: '',
    });
    capturePasswordRecoveryIntent();
    expect(hasPasswordRecoveryIntent()).toBe(true);
  });
});

describe('clearPasswordRecoveryHash', () => {
  const replaceState = vi.fn();

  afterEach(() => {
    vi.unstubAllGlobals();
    replaceState.mockReset();
  });

  it('retire le fragment recovery de l’URL', () => {
    vi.stubGlobal('window', {
      location: {
        hash: '#access_token=x&type=recovery',
        pathname: '/auth/reset-password',
        search: '',
      },
      history: { replaceState },
    });
    clearPasswordRecoveryHash();
    expect(replaceState).toHaveBeenCalledWith(null, '', '/auth/reset-password');
  });

  it('retire ?code= de la query sur la route reset-password', () => {
    vi.stubGlobal('window', {
      location: {
        hash: '',
        pathname: '/auth/reset-password',
        search: '?code=abc',
      },
      history: { replaceState },
    });
    clearPasswordRecoveryHash();
    expect(replaceState).toHaveBeenCalledWith(null, '', '/auth/reset-password');
  });
});

describe('establishPasswordRecoverySession', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('échange le code PKCE présent dans l’URL', async () => {
    stubWindow({
      hash: '',
      pathname: '/auth/reset-password',
      search: '?code=pkce-code',
    });

    const session = { access_token: 't' };
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null });
    const getSession = vi.fn().mockResolvedValue({ data: { session } });

    const supabase = {
      auth: { exchangeCodeForSession, getSession, verifyOtp: vi.fn() },
    };

    const result = await establishPasswordRecoverySession(supabase as never);
    expect(exchangeCodeForSession).toHaveBeenCalledWith('pkce-code');
    expect(result).toBe(session);
  });
});

describe('subscribePasswordRecoveryGate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepte SIGNED_IN quand l’intention recovery est mémorisée', () => {
    stubWindow({
      hash: '#access_token=x&type=recovery',
      pathname: '/auth/reset-password',
      search: '',
    });
    capturePasswordRecoveryIntent();

    const onState = vi.fn();
    const session = { access_token: 't' };
    const getSession = vi.fn().mockResolvedValue({ data: { session } });
    const onAuthStateChange = vi.fn((cb: (event: string, s: typeof session) => void) => {
      cb('SIGNED_IN', session);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const supabase = {
      auth: {
        onAuthStateChange,
        getSession,
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
        verifyOtp: vi.fn(),
      },
    };

    subscribePasswordRecoveryGate(supabase as never, onState, { timeoutMs: 100 });

    expect(onState).toHaveBeenCalledWith(true);
  });

  it('refuse une session sans contexte recovery', async () => {
    const sessionStorage = createSessionStorageMock();
    vi.stubGlobal('sessionStorage', sessionStorage);
    vi.stubGlobal('window', {
      location: {
        hash: '',
        pathname: '/auth/reset-password',
        search: '',
      },
      sessionStorage,
      history: { replaceState: vi.fn() },
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
      setInterval: globalThis.setInterval.bind(globalThis),
      clearInterval: globalThis.clearInterval.bind(globalThis),
    });

    const onState = vi.fn();
    const session = { access_token: 't' };
    const getSession = vi.fn().mockResolvedValue({ data: { session } });
    const onAuthStateChange = vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    }));

    const supabase = {
      auth: {
        onAuthStateChange,
        getSession,
        exchangeCodeForSession: vi.fn(),
        verifyOtp: vi.fn(),
      },
    };

    const cleanup = subscribePasswordRecoveryGate(supabase as never, onState, { timeoutMs: 80 });
    await vi.waitFor(() => {
      expect(onState).toHaveBeenCalledWith(false);
    });
    cleanup();
  });
});
