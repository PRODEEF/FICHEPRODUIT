/**
 * useUrlSearch — résolution de saisie URL + suggestions.
 *
 * Placé dans shared/hooks/ car utilisé par plusieurs features
 * (home, catalogue, et tout futur point d'entrée d'analyse).
 *
 * ─── Ce que fait ce hook ────────────────────────────────────────────────────
 *
 * Il gère UNE interaction utilisateur : "l'utilisateur tape quelque chose
 * dans une barre de recherche, et on doit en tirer une URL à analyser".
 *
 * Deux cas :
 *  1. La saisie EST déjà une URL ou un domaine → on appelle onSubmit(url)
 *     directement, sans passer par les suggestions.
 *
 *  2. La saisie est du texte libre ("Décathlon", "shop de kitesurf") →
 *     on appelle /api/suggest-urls pour obtenir des URLs candidates,
 *     et l'utilisateur en choisit une.
 *
 * ─── Ce que ce hook ne fait PAS ─────────────────────────────────────────────
 *
 * Il ne sait pas ce qu'est une "analyse". Il reçoit onSubmit en paramètre
 * et l'appelle avec une URL. C'est le composant/page parent qui décide quoi
 * faire avec cette URL (lancer une analyse, naviguer, etc.).
 *
 * ─── Utilisation type ───────────────────────────────────────────────────────
 *
 * ```tsx
 * // Dans Home.tsx :
 * const { runAnalysis } = useSiteAnalysis({ onSuccess: ... });
 * const search = useUrlSearch({ onSubmit: runAnalysis });
 *
 * // Dans Catalogue.tsx (futur) :
 * const search = useUrlSearch({ onSubmit: (url) => navigate(`/catalogue?url=${url}`) });
 * ```
 *
 * ─── Interface publique ──────────────────────────────────────────────────────
 *
 * - input / setInput : valeur de la barre de saisie
 * - suggestedUrls    : liste d'URLs proposées par le backend (vide si URL directe)
 * - suggestionsLoading : true pendant l'appel /api/suggest-urls
 * - inputEmptyError  : true si handleSubmit appelé avec saisie vide
 * - handleSubmit     : appelé au clic sur "Analyser" ou Enter
 * - handlePickSuggestion : appelé quand l'utilisateur clique une suggestion
 */

import { useCallback, useState } from 'react';

import { fetchSuggestUrls } from '@api/suggestUrls';
import { parseAsSiteUrl } from '@lib/siteUrl';

interface UseUrlSearchOptions {
  /**
   * Callback appelé avec l'URL résolue, que ce soit une URL directe
   * ou une suggestion choisie par l'utilisateur.
   */
  onSubmit: (url: string) => Promise<unknown>;
}

export function useUrlSearch({ onSubmit }: UseUrlSearchOptions) {
  const [urlInput, setUrlInput] = useState('');
  const [suggestedUrls, setSuggestedUrls] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [inputEmptyError, setInputEmptyError] = useState(false);

  /** Met à jour la saisie et réinitialise les suggestions et erreurs associées. */
  const setInput = useCallback((value: string) => {
    setUrlInput(value);
    setSuggestedUrls([]);
    setInputEmptyError(false);
  }, []);

  /**
   * Soumission principale.
   *
   * - Saisie vide → positionne inputEmptyError, ne fait rien de plus.
   * - URL/domaine reconnu → appelle onSubmit directement.
   * - Texte libre → appelle /api/suggest-urls et expose les résultats.
   */
  const handleSubmit = useCallback(async () => {
    const raw = urlInput.trim();

    if (!raw) {
      setInputEmptyError(true);
      return;
    }

    setInputEmptyError(false);

    // Cas 1 : c'est déjà une URL ou un domaine valide
    const directUrl = parseAsSiteUrl(raw);
    if (directUrl) {
      setSuggestedUrls([]);
      await onSubmit(directUrl);
      return;
    }

    // Cas 2 : texte libre → suggestions
    setSuggestionsLoading(true);
    setSuggestedUrls([]);

    try {
      const urls = await fetchSuggestUrls(raw);
      if (urls.length > 0) {
        setSuggestedUrls(urls);
      } else {
        window.alert(
          'Aucune adresse proposée. Essaie une URL complète (ex. https://…) ou un nom plus précis.',
        );
      }
    } catch {
      window.alert('Impossible de récupérer des suggestions pour le moment.');
    } finally {
      setSuggestionsLoading(false);
    }
  }, [urlInput, onSubmit]);

  /**
   * L'utilisateur clique une suggestion parmi les résultats proposés.
   * On efface les suggestions, on met à jour la saisie, et on soumet.
   */
  const handlePickSuggestion = useCallback(
    async (url: string) => {
      setSuggestedUrls([]);
      setUrlInput(url);
      await onSubmit(url);
    },
    [onSubmit],
  );

  return {
    input: urlInput,
    setInput,
    suggestedUrls,
    suggestionsLoading,
    inputEmptyError,
    handleSubmit,
    handlePickSuggestion,
  };
}
