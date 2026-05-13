/**
 * Aucun produit catalogue après chargement réussi (liste vide).
 */
export function EmptyProducts() {
  return (
    <section className="rounded-xl border border-dashed border-border bg-white/60 px-5 py-6 shadow-sm">
      <h2 className="m-0 text-lg font-bold text-text-primary">Exemples de fiches produits</h2>
      <p className="mt-2 text-sm text-text-secondary">
        Aucun exemple n’est disponible pour le moment. Réessaie plus tard ou élargis les critères
        côté catalogue.
      </p>
    </section>
  );
}
