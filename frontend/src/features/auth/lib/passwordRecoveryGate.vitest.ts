import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearPasswordRecoveryHash } from './passwordRecoveryGate';

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

  it('ne modifie pas l’URL sans fragment recovery', () => {
    vi.stubGlobal('window', {
      location: { hash: '', pathname: '/auth/reset-password', search: '' },
      history: { replaceState },
    });
    clearPasswordRecoveryHash();
    expect(replaceState).not.toHaveBeenCalled();
  });
});
