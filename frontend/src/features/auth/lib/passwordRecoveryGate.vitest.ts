import { afterEach, describe, expect, it, vi } from 'vitest';

import { isPasswordRecoveryUrl } from './passwordRecoveryGate';

describe('isPasswordRecoveryUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retourne true si le hash contient type=recovery', () => {
    vi.stubGlobal('window', { location: { hash: '#access_token=x&type=recovery' } });
    expect(isPasswordRecoveryUrl()).toBe(true);
  });

  it('retourne false sans fragment recovery', () => {
    vi.stubGlobal('window', { location: { hash: '' } });
    expect(isPasswordRecoveryUrl()).toBe(false);
  });
});
