export interface AboutValueItem {
  id: string;
  title: string;
  description: string;
}

export interface AboutDifferentiatorItem {
  id: string;
  badge: string;
  title: string;
  description: string;
}

export interface AboutQuickLinkItem {
  id: string;
  label: string;
  href: string;
  variant: 'primary' | 'secondary' | 'neutral-outline';
}

export const ABOUT_HERO = {
  badge: '✦ Conçu pour les marchands PrestaShop & Shopify',
  title: 'Nous aidons les e-commerçants',
  titleHighlight: 'à scaler leur catalogue',
  subtitle:
    'Fiche Produit génère des fiches produits spécialisées par secteur, optimisées SEO et exportables en un clic vers votre boutique en ligne.',
} as const;

export const ABOUT_MISSION = {
  title: 'Notre mission',
  paragraphs: [
    'Rédiger des centaines de fiches produits à la main, c’est des semaines de travail répétitif — et des descriptions souvent génériques qui ne convertissent pas.',
    'Nous avons créé Fiche Produit pour que les marchands PrestaShop et Shopify gagnent ce temps sans sacrifier la qualité : un outil métier qui connaît votre secteur produit, pas une IA générique.',
    'En version BETA, nous affinons chaque jour le moteur de rédaction et les exports pour coller au terrain des e-commerçants.',
  ],
} as const;

export const ABOUT_VALUES: AboutValueItem[] = [
  {
    id: 'sector-expertise',
    title: 'Expertise sectorielle',
    description:
      'Ton, vocabulaire et niveau de technicité adaptés à votre niche — comme un vrai rédacteur de votre secteur.',
  },
  {
    id: 'seo-quality',
    title: 'Qualité SEO',
    description:
      'Titres, méta-descriptions et mots-clés intégrés dès la génération pour des fiches prêtes à ranker.',
  },
  {
    id: 'ecommerce-workflow',
    title: 'Workflow e-commerce',
    description:
      'De l’analyse de votre catalogue au CSV importable : un parcours pensé pour PrestaShop et Shopify.',
  },
];

export const ABOUT_DIFFERENTIATORS: AboutDifferentiatorItem[] = [
  {
    id: 'adapted-sector',
    badge: 'Positionnement',
    title: 'Adapté à votre secteur',
    description:
      'Pas une IA générique — les descriptions sonnent comme un vrai rédacteur de votre niche, avec le bon vocabulaire et les bons arguments.',
  },
  {
    id: 'seo-ready',
    badge: 'Performance',
    title: 'SEO-ready dès la génération',
    description:
      'Balises titre, méta-description et mots-clés intégrés automatiquement à chaque fiche, sans étape supplémentaire.',
  },
  {
    id: 'direct-export',
    badge: 'Workflow',
    title: 'Export direct PrestaShop & Shopify',
    description:
      'CSV prêt à importer, zéro copier-coller, zéro friction entre la génération et votre boutique.',
  },
];

export const ABOUT_QUICK_LINKS: AboutQuickLinkItem[] = [
  {
    id: 'demo',
    label: 'Demander une démo',
    href: '/demo',
    variant: 'neutral-outline',
  },
  // Pricing temporairement désactivé
  // {
  //   id: 'pricing',
  //   label: 'Voir les tarifs',
  //   href: '/pricing',
  //   variant: 'neutral-outline',
  // },
  {
    id: 'signup',
    label: 'Essayer gratuitement',
    href: '/signup',
    variant: 'primary',
  },
];
