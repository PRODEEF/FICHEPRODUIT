import { describe, expect, it, vi } from 'vitest';

import {
  ApiError,
  extractRawServerMessage,
  isAbortError,
  isApiError,
  isNetworkError,
  NetworkError,
} from './apiError';

describe('ApiError', () => {
  it('expose status, body, url et method', () => {
    const err = new ApiError(404, 'raw', {
      body: { message: 'raw' },
      url: '/api/x',
      method: 'GET',
    });
    expect(err).toBeInstanceOf(Error);
    expect(isApiError(err)).toBe(true);
    expect(err.name).toBe('ApiError');
    expect(err.status).toBe(404);
    expect(err.message).toBe('raw');
    expect(err.body).toEqual({ message: 'raw' });
    expect(err.url).toBe('/api/x');
    expect(err.method).toBe('GET');
  });

  describe('from', () => {
    it('conserve le message serveur brut sur 4xx', () => {
      const err = ApiError.from(403, { message: 'Interdit' }, { url: '/a', method: 'POST' });
      expect(err.status).toBe(403);
      expect(err.message).toBe('Interdit');
      expect(err.body).toEqual({ message: 'Interdit' });
      expect(err.url).toBe('/a');
      expect(err.method).toBe('POST');
    });

    it('joint tous les messages de validation Nest', () => {
      const body = { message: ['Champ A invalide', 'Champ B requis'] };
      const err = ApiError.from(422, body);
      expect(err.message).toBe('Champ A invalide; Champ B requis');
      expect(err.body).toEqual(body);
    });

    it('logue le message brut sur 5xx sans le masquer sur Error.message', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const err = ApiError.from(500, { message: 'Error: nest stack\n  at Foo' });
      expect(err.message).toBe('Error: nest stack\n  at Foo');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});

describe('isApiError', () => {
  it('détecte via le marqueur, pas seulement instanceof', () => {
    const duck = Object.assign(new Error('x'), {
      __ficheproductApiError: true,
      status: 400,
    });
    expect(isApiError(duck)).toBe(true);
    expect(isApiError(new Error('x'))).toBe(false);
  });
});

describe('NetworkError', () => {
  it('est détectable via isNetworkError', () => {
    const err = new NetworkError('Network request failed', { url: '/x', method: 'GET' });
    expect(isNetworkError(err)).toBe(true);
    expect(isApiError(err)).toBe(false);
    expect(err.url).toBe('/x');
  });
});

describe('isAbortError', () => {
  it('détecte AbortError', () => {
    const err = new DOMException('Aborted', 'AbortError');
    expect(isAbortError(err)).toBe(true);
    expect(isAbortError(new Error('x'))).toBe(false);
  });
});

describe('extractRawServerMessage', () => {
  it('retourne vide si le corps est vide', () => {
    expect(extractRawServerMessage(null)).toBe('');
  });

  it('extrait un message string', () => {
    expect(extractRawServerMessage({ message: 'Erreur métier' })).toBe('Erreur métier');
  });

  it('joint tous les éléments d’un tableau', () => {
    expect(extractRawServerMessage({ message: ['A', 'B'] })).toBe('A; B');
  });
});
