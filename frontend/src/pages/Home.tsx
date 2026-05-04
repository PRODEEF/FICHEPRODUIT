import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../features/auth/useAuth';
import { clearPendingAutoAnalyzeForUser } from '../features/auth/lib/userProfile';
import { AnalysisProgress } from '../components/analysis/AnalysisProgress';
import { useSiteAnalysis } from '../hooks/useSiteAnalysis';
import { fetchSuggestUrls } from '../lib/suggestUrls';
import { parseAsSiteUrl } from '../lib/siteUrl';

export function Home() {
  const navigate = useNavigate();
  const { user, profile, profileLoading, loading: authLoading } = useAuth();
  const signupAutoTriggeredRef = useRef(false);
  const [siteInput, setSiteInput] = useState('');
  const [landingSuggestedUrls, setLandingSuggestedUrls] = useState<string[]>([]);
  const [landingSuggestionsLoading, setLandingSuggestionsLoading] = useState(false);
  const [searchEmptyError, setSearchEmptyError] = useState(false);
  const { runAnalysis, analysisOpen, siteAnalysis, dismissError } = useSiteAnalysis({
    onSuccess: (summary) => {
      navigate(`/analyses/${summary.id}`);
    },
  });

  useEffect(() => {
    signupAutoTriggeredRef.current = false;
  }, [user?.id]);

  useEffect(() => {
    if (authLoading || profileLoading || !user || signupAutoTriggeredRef.current) return;
    if (!profile?.pending_auto_analyze) return;

    const rawUrl = profile.website_url?.trim() ?? '';

    signupAutoTriggeredRef.current = true;

    if (!rawUrl) {
      void clearPendingAutoAnalyzeForUser(user.id);
      return;
    }

    void (async () => {
      try {
        await runAnalysis(rawUrl);
      } finally {
        await clearPendingAutoAnalyzeForUser(user.id);
      }
    })();
  }, [authLoading, profileLoading, user, profile, runAnalysis]);

  const setSiteInputAndClearSuggestions = useCallback((value: string) => {
    setSiteInput(value);
    setLandingSuggestedUrls([]);
    setSearchEmptyError(false);
  }, []);

  const handleLandingSubmitSearch = useCallback(async () => {
    const raw = siteInput.trim();
    if (!raw) {
      setSearchEmptyError(true);
      return;
    }

    if (!authLoading && !user) {
      window.alert('Connecte-toi pour lancer l’analyse de ton site (API sécurisée).');
      navigate('/login');
      return;
    }

    setSearchEmptyError(false);
    const directUrl = parseAsSiteUrl(raw);
    if (directUrl) {
      setLandingSuggestedUrls([]);
      await runAnalysis(directUrl);
      return;
    }

    setLandingSuggestionsLoading(true);
    setLandingSuggestedUrls([]);
    try {
      const urls = await fetchSuggestUrls(raw);
      if (urls.length) {
        setLandingSuggestedUrls(urls);
      } else {
        window.alert(
          'Aucune adresse proposée. Essaie une URL complète (ex. https://…) ou un nom plus précis.',
        );
      }
    } catch {
      window.alert('Impossible de récupérer des suggestions pour le moment.');
    } finally {
      setLandingSuggestionsLoading(false);
    }
  }, [authLoading, user, siteInput, runAnalysis, navigate]);

  const handlePickLandingSuggestion = useCallback(
    async (url: string) => {
      if (!authLoading && !user) {
        window.alert('Connecte-toi pour lancer l’analyse de ton site (API sécurisée).');
        navigate('/login');
        return;
      }
      setLandingSuggestedUrls([]);
      setSiteInput(url);
      await runAnalysis(url);
    },
    [authLoading, user, runAnalysis, navigate],
  );

  return (
    <>
      {analysisOpen && siteAnalysis ? (
        <AnalysisProgress analysis={siteAnalysis} onDismiss={dismissError} />
      ) : null}
      <div className="app-content">
        <section className="hero">
          <h1>
            <span className="highlight">Génère tes fiches produits</span>
            <br />
            en quelques secondes
          </h1>
          <p className="hero-sub">
            Laisse-toi guider. Transforme ton catalogue en fiches produits optimisées SEO.
          </p>
          <form
            className="search-container"
            onSubmit={(e) => {
              e.preventDefault();
              void handleLandingSubmitSearch();
            }}
          >
            <input
              className="search-bar"
              placeholder="Indique moi ton site internet"
              value={siteInput}
              onChange={(e) => setSiteInputAndClearSuggestions(e.target.value)}
              disabled={landingSuggestionsLoading}
              aria-busy={landingSuggestionsLoading}
              aria-invalid={searchEmptyError}
              aria-describedby={searchEmptyError ? 'landing-site-empty-error' : undefined}
            />
            <button type="submit" className="search-btn" disabled={landingSuggestionsLoading}>
              {landingSuggestionsLoading ? '…' : 'Analyser'}
            </button>
          </form>

          {searchEmptyError ? (
            <p id="landing-site-empty-error" className="landing-search-error" role="alert">
              Veuillez entrer le nom ou l&apos;URL de votre site
            </p>
          ) : null}

          {landingSuggestionsLoading ? (
            <p className="landing-suggestions-hint">
              Analyse de ta saisie et recherche d&apos;adresses…
            </p>
          ) : null}

          {landingSuggestedUrls.length > 0 ? (
            <div className="landing-suggestions" role="list" aria-label="Sites proposés">
              <p className="landing-suggestions-title">Choisis le site à analyser :</p>
              <ul className="landing-suggestions-list">
                {landingSuggestedUrls.map((url) => (
                  <li key={url} role="listitem">
                    <button
                      type="button"
                      className="landing-suggestion-btn"
                      onClick={() => void handlePickLandingSuggestion(url)}
                    >
                      {url}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Compatible PrestaShop & Shopify
          </p>
        </section>
      </div>
    </>
  );
}
