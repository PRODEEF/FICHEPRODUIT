import { describe, expect, it } from 'vitest';

import { ExportInsufficientCreditsError, parseInsufficientCreditsBody } from './export';

describe('parseInsufficientCreditsBody', () => {
  it('détecte le code erreur NestJS (filtre global)', () => {
    const result = parseInsufficientCreditsBody({
      statusCode: 402,
      message: 'INSUFFICIENT_CREDITS: Crédits insuffisants pour cet export.',
      error: 'INSUFFICIENT_CREDITS',
    });

    expect(result).toEqual({ isInsufficient: true });
  });

  it('extrait required et available quand présents dans le corps', () => {
    const result = parseInsufficientCreditsBody({
      statusCode: 402,
      message: 'INSUFFICIENT_CREDITS: Crédits insuffisants pour cet export.',
      error: 'INSUFFICIENT_CREDITS',
      required: 5,
      available: 2,
    });

    expect(result).toEqual({
      isInsufficient: true,
      required: 5,
      available: 2,
    });
  });

  it('ignore un corps non pertinent', () => {
    expect(parseInsufficientCreditsBody(null)).toEqual({ isInsufficient: false });
    expect(parseInsufficientCreditsBody({ message: 'Autre erreur' })).toEqual({
      isInsufficient: false,
    });
  });
});

describe('ExportInsufficientCreditsError', () => {
  it('expose required et available quand fournis', () => {
    const err = new ExportInsufficientCreditsError('Crédits insuffisants', {
      required: 5,
      available: 2,
    });

    expect(err.code).toBe('INSUFFICIENT_CREDITS');
    expect(err.status).toBe(402);
    expect(err.requiredCredits).toBe(5);
    expect(err.availableCredits).toBe(2);
  });

  it('n’assigne pas requiredCredits si absent (exactOptionalPropertyTypes)', () => {
    const err = new ExportInsufficientCreditsError('Crédits insuffisants');

    expect('requiredCredits' in err).toBe(false);
    expect('availableCredits' in err).toBe(false);
  });
});
