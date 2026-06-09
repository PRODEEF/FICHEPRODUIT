export interface PricingFaqItem {
  id: string;
  question: string;
  answer: string;
}

export const PRICING_FAQ_ITEMS: PricingFaqItem[] = [
  {
    id: 'credit-definition',
    question: "Qu'est-ce qu'un crédit ?",
    answer:
      'Un crédit correspond à la génération d\'une fiche produit complète (texte SEO, attributs et export). Chaque fiche consomme un crédit, sauf pour les offres incluant les fiches à moins de 200 €.',
  },
  {
    id: 'credit-expiry',
    question: 'Les crédits expirent-ils ?',
    answer:
      "Non, vos crédits sont valables 12 mois à compter de l'achat. Pour le Platinium, les crédits sont mensuels et non reportables.",
  },
  {
    id: 'sector-pricing',
    question: 'Pourquoi le tarif change selon mon secteur ?',
    answer:
      'La rédaction technique varie selon votre univers produit (vocabulaire, niveau de détail, conformité). ficheproduct adapte le tarif pour refléter cette complexité et vous proposer un prix juste.',
  },
  {
    id: 'free-low-price',
    question: 'Les fiches < 200 € sont-elles vraiment offertes ?',
    answer:
      'Oui, à partir du pack Business Silver, les fiches produits dont le prix catalogue est inférieur à 200 € ne consomment pas de crédit. Idéal pour compléter rapidement votre catalogue accessoires.',
  },
  {
    id: 'trial',
    question: "Puis-je tester avant d'acheter ?",
    answer:
      'Oui. Créez un compte gratuitement et analysez votre site pour voir le rendu sur vos produits. Aucune carte bancaire requise pour démarrer.',
  },
];
