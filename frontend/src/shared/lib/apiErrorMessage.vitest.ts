import { describe, expect, it, vi } from 'vitest';

import { ApiError, NetworkError } from '@api/apiError';

import { apiErrorMessage } from './apiErrorMessage';

describe('apiErrorMessage', () => {
  it('fait confiance au message serveur sur 4xx', () => {
    expect(apiErrorMessage(ApiError.from(422, { message: 'URL invalide' }))).toBe('URL invalide');
  });

  it('utilise le fallback status si 4xx sans message', () => {
    expect(apiErrorMessage(ApiError.from(404))).toBe('Ressource introuvable.');
  });

  it('ignore le message serveur sur 5xx', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const err = ApiError.from(500, { message: 'Error: Internal nest stack' });
    expect(apiErrorMessage(err)).toBe('Erreur interne du serveur.');
    spy.mockRestore();
  });

  it('mappe NetworkError', () => {
    expect(apiErrorMessage(new NetworkError('Network request failed'))).toBe(
      'Impossible de contacter le serveur. Vérifie ta connexion et réessaie.',
    );
  });

  it('retourne une chaîne vide pour AbortError', () => {
    expect(apiErrorMessage(new DOMException('Aborted', 'AbortError'))).toBe('');
  });

  it('utilise le fallback pour une erreur inconnue', () => {
    expect(apiErrorMessage('boom', 'Fallback')).toBe('Fallback');
  });
});
