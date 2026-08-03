import { describe, expect, it } from 'vitest';

import {
  ANALYSIS_DNS_NOT_FOUND_MESSAGE,
  ANALYSIS_SITE_TIMEOUT_MESSAGE,
  ANALYSIS_SITE_UNREACHABLE_MESSAGE,
  toUserFacingAnalysisError,
} from './analysisErrorMessage';

describe('toUserFacingAnalysisError', () => {
  it('masque une erreur DNS technique derrière un message clair', () => {
    expect(
      toUserFacingAnalysisError('SITE_UNREACHABLE', 'DNS: getaddrinfo ENOTFOUND www.glisstestk.fr'),
    ).toBe(ANALYSIS_DNS_NOT_FOUND_MESSAGE);
  });

  it('traduit un timeout technique', () => {
    expect(toUserFacingAnalysisError('SITE_UNREACHABLE', 'Timeout')).toBe(
      ANALYSIS_SITE_TIMEOUT_MESSAGE,
    );
  });

  it('utilise le message du code si errorMessage est vide', () => {
    expect(toUserFacingAnalysisError('SITE_UNREACHABLE', null)).toBe(
      ANALYSIS_SITE_UNREACHABLE_MESSAGE,
    );
  });

  it('conserve un message déjà lisible', () => {
    expect(
      toUserFacingAnalysisError(
        'SITE_UNREACHABLE',
        'Impossible de joindre ce site : l’adresse n’existe pas ou est incorrecte.',
      ),
    ).toBe(ANALYSIS_DNS_NOT_FOUND_MESSAGE);
  });

  it('mappe UNANALYZABLE sans message', () => {
    expect(toUserFacingAnalysisError('UNANALYZABLE', '')).toBe(
      "Le site n'a pas pu être analysé (structure non reconnue).",
    );
  });
});
