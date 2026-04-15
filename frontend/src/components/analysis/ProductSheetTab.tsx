import { useCallback, useEffect, useState } from 'react'

const TEMPLATE_STORAGE_KEY = 'ficheproduct_template'

const TEMPLATE_BLOCKS: {
  key: string
  label: string
  multiline: boolean
  placeholder: string
}[] = [
  {
    key: 'title',
    label: 'Titre',
    multiline: false,
    placeholder: 'Ex. Nom commercial + taille / année',
  },
  {
    key: 'short_description',
    label: 'Description courte',
    multiline: true,
    placeholder: 'Résumé affiché en liste / encart',
  },
  {
    key: 'description',
    label: 'Description détaillée',
    multiline: true,
    placeholder: 'Texte principal de la fiche',
  },
  {
    key: 'commercial',
    label: 'Accroche commerciale',
    multiline: true,
    placeholder: 'Arguments de vente, bénéfices client',
  },
  {
    key: 'technical',
    label: 'Bloc technique / specs',
    multiline: true,
    placeholder: 'Caractéristiques, tableau ou liste à puces',
  },
  {
    key: 'meta_title',
    label: 'Meta title (SEO)',
    multiline: false,
    placeholder: 'Titre balise <title>',
  },
  {
    key: 'meta_description',
    label: 'Meta description (SEO)',
    multiline: true,
    placeholder: 'Snippet moteurs de recherche',
  },
]

export function ProductSheetTab() {
  const [templateUrl, setTemplateUrl] = useState('')
  const [values, setValues] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY)
      if (!raw) return {}
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, string>
      }
    } catch {
      /* ignore */
    }
    return {}
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        setValues(parsed as Record<string, string>)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const setField = useCallback((key: string, v: string) => {
    setValues((prev) => ({ ...prev, [key]: v }))
  }, [])

  const analyzeTemplateUrl = useCallback(() => {
    window.alert(
      "Analyse de la structure par l'IA : à brancher (API dédiée). Pour l'instant tu peux remplir les blocs manuellement.",
    )
  }, [])

  const saveTemplate = useCallback(() => {
    const blocks: Record<string, string> = {}
    for (const b of TEMPLATE_BLOCKS) {
      blocks[b.key] = (values[b.key] ?? '').trim()
    }
    try {
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(blocks))
      window.alert(
        'Fiche type enregistrée. Elle sera utilisée pour formater les exports PrestaShop.',
      )
    } catch {
      window.alert('Impossible d’enregistrer (stockage local).')
    }
  }, [values])

  return (
    <section
      className="product-sheet-tab"
      aria-labelledby="product-sheet-heading"
    >
      <h2 id="product-sheet-heading" className="analyses-section-title">
        Ma fiche produit
      </h2>
      <p className="product-sheet-intro">
        Définis un modèle de contenu pour tes exports. Colle l&apos;URL d&apos;une
        fiche exemple pour une future analyse automatique.
      </p>

      <div className="product-sheet-url-row">
        <label className="analyses-field product-sheet-url-field">
          <span className="analyses-field-label">URL fiche produit exemple</span>
          <input
            type="url"
            className="analyses-input"
            id="template-url"
            placeholder="https://…"
            value={templateUrl}
            onChange={(e) => setTemplateUrl(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="product-sheet-analyze-btn"
          onClick={analyzeTemplateUrl}
        >
          Analyser l&apos;URL
        </button>
      </div>

      <div className="template-blocks">
        {TEMPLATE_BLOCKS.map((b) => (
          <div key={b.key} className="template-block" data-block={b.key}>
            <label className="analyses-field">
              <span className="analyses-field-label">{b.label}</span>
              {b.multiline ? (
                <textarea
                  className="analyses-input template-block-textarea"
                  rows={4}
                  placeholder={b.placeholder}
                  value={values[b.key] ?? ''}
                  onChange={(e) => setField(b.key, e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  className="analyses-input template-block-input"
                  placeholder={b.placeholder}
                  value={values[b.key] ?? ''}
                  onChange={(e) => setField(b.key, e.target.value)}
                />
              )}
            </label>
          </div>
        ))}
      </div>

      <div className="product-sheet-actions">
        <button
          type="button"
          className="product-sheet-save-btn"
          onClick={saveTemplate}
        >
          Enregistrer la fiche type
        </button>
      </div>
    </section>
  )
}
