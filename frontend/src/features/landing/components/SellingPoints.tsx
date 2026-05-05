const points = [
  {
    badge: 'Positionnement',
    title: 'Adapté à ton univers',
    description:
      'Pas une IA générique — les descriptions sonnent comme un vrai rédacteur de ta niche.',
    visual: `Produit: Aile de kitesurf "Storm V3" 10m²
Accroche: Aile polyvalente allround pour riders intermédiaires.
Usage: Vent 16-28 noeuds, très stable en rafales.
Bénéfice: Relance rapide et excellent drift en surf.`,
  },
  {
    badge: 'Performance',
    title: 'SEO-ready dès la génération',
    description:
      'Balises titre, méta-description, mots-clés intégrés automatiquement à chaque fiche.',
    visual: `<title>Aile Kitesurf Storm V3 10m² | Freeride & Wave</title>
<meta name="description" content="Aile allwind stable, idéale freeride et vague. Livraison rapide." />
Mots-clés: aile kitesurf 10m2, freeride, kite wave, allwind`,
  },
  {
    badge: 'Workflow',
    title: 'Export direct PrestaShop & Shopify',
    description: 'CSV prêt à importer, zéro copier-coller, zéro friction.',
    visual: `handle, title, body_html, tags, seo_title
storm-v3-10m2, Aile Kitesurf Storm V3 10m², <p>...</p>, kitesurf|freeride|wave, Aile Storm V3 10m²
storm-v3-12m2, Aile Kitesurf Storm V3 12m², <p>...</p>, kitesurf|allwind, Aile Storm V3 12m²`,
  },
];

export function SellingPoints() {
  return (
    <section className="py-20 px-4 max-w-5xl mx-auto">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-16 text-center">Pourquoi ficheproduct fait la différence</h2>
      <div className="space-y-14">
        {points.map((point, index) => (
          <article
            key={point.title}
            className={`flex flex-col md:items-center md:gap-10 gap-6 ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'}`}
          >
            <div className="flex-1">
              <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-3">{point.badge}</p>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-4">{point.title}</h3>
              <p className="text-gray-500 leading-relaxed">{point.description}</p>
            </div>
            <div className="flex-1 bg-purple-50 border border-purple-200 rounded-2xl p-6">
              <pre className="font-mono text-sm text-purple-800 whitespace-pre-wrap">{point.visual}</pre>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
