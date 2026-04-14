import { useCallback, useState } from 'react'
import { BackgroundGlow } from '../components/layout/BackgroundGlow'
import { fetchSuggestUrls } from '../lib/suggestUrls'
import { parseAsSiteUrl } from '../lib/siteUrl'

export function Home() {
    const [siteInput, setSiteInput] = useState('')
    const [landingSuggestedUrls, setLandingSuggestedUrls] = useState<string[]>(
        [],
    )
    const [landingSuggestionsLoading, setLandingSuggestionsLoading] =
        useState(false)

    const setSiteInputAndClearSuggestions = useCallback((value: string) => {
        setSiteInput(value)
        setLandingSuggestedUrls([])
    }, [])

    const onAnalyzeUrl = useCallback((url: string) => {
        const trimmed = url.trim()
        if (!trimmed) return
        window.alert(
            `Analyse à brancher (auth + API). URL retenue :\n${trimmed}`,
        )
    }, [])

    const handleLandingSubmitSearch = useCallback(async () => {
        const raw = siteInput.trim()
        if (!raw) {
            window.alert(
                'Indique le nom de ton site ou son adresse (ex. ultimate glisse)',
            )
            return
        }

        const directUrl = parseAsSiteUrl(raw)
        if (directUrl) {
            setLandingSuggestedUrls([])
            onAnalyzeUrl(directUrl)
            return
        }

        setLandingSuggestionsLoading(true)
        setLandingSuggestedUrls([])
        try {
            const urls = await fetchSuggestUrls(raw)
            if (urls.length) {
                setLandingSuggestedUrls(urls)
            } else {
                window.alert(
                    'Aucune adresse proposée. Essaie une URL complète (ex. https://…) ou un nom plus précis.',
                )
            }
        } catch {
            window.alert('Impossible de récupérer des suggestions pour le moment.')
        } finally {
            setLandingSuggestionsLoading(false)
        }
    }, [siteInput, onAnalyzeUrl])

    const handlePickLandingSuggestion = useCallback(
        (url: string) => {
            setLandingSuggestedUrls([])
            setSiteInput(url)
            onAnalyzeUrl(url)
        },
        [onAnalyzeUrl],
    )

    return (
        <>
            <BackgroundGlow />
            <div className="app-content">
                <section className="hero">
                    <div className="gift-banner">
                        {'\u{1F381}'} 10 crédits offerts à l&apos;inscription
                    </div>
                    <h1>
                        <span className="highlight">Génère tes fiches produits</span>
                        <br />
                        en quelques secondes
                    </h1>
                    <p className="hero-sub">
                        Laisse-toi guider. Transforme ton catalogue en fiches produits
                        optimisées SEO.
                    </p>
                    <form
                        className="search-container"
                        onSubmit={(e) => {
                            e.preventDefault()
                            void handleLandingSubmitSearch()
                        }}
                    >
                        <input
                            className="search-bar"
                            placeholder="Indique moi ton site internet"
                            value={siteInput}
                            onChange={(e) =>
                                setSiteInputAndClearSuggestions(e.target.value)
                            }
                            disabled={landingSuggestionsLoading}
                            aria-busy={landingSuggestionsLoading}
                        />
                        <button
                            type="submit"
                            className="search-btn"
                            disabled={landingSuggestionsLoading}
                        >
                            {landingSuggestionsLoading ? '…' : 'Analyser'}
                        </button>
                    </form>

                    {landingSuggestionsLoading ? (
                        <p className="landing-suggestions-hint">
                            Analyse de ta saisie et recherche d&apos;adresses…
                        </p>
                    ) : null}

                    {landingSuggestedUrls.length > 0 ? (
                        <div
                            className="landing-suggestions"
                            role="list"
                            aria-label="Sites proposés"
                        >
                            <p className="landing-suggestions-title">
                                Choisis le site à analyser :
                            </p>
                            <ul className="landing-suggestions-list">
                                {landingSuggestedUrls.map((url) => (
                                    <li key={url} role="listitem">
                                        <button
                                            type="button"
                                            className="landing-suggestion-btn"
                                            onClick={() => handlePickLandingSuggestion(url)}
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
    )
}
