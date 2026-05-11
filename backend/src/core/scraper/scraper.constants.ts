export const HEURISTIC_RULES: {
  patterns: RegExp[];
  categories: string[];
  verticalSummary: string;
}[] = [
  {
    patterns: [/kitesurf/i, /kite surf/i, /kiteboard/i, /wing\s*foil/i, /wakestyle/i, /\bkite\b/i],
    categories: ["Kitesurf"],
    verticalSummary: "des produits liés au kitesurf",
  },
  {
    patterns: [/vélo/i, /velo/i, /\bbike\b/i, /cyclisme/i, /\bvtt\b/i],
    categories: ["Vélo"],
    verticalSummary: "des produits liés au cyclisme",
  },
  {
    patterns: [/bijoux/i, /bracelet/i, /boucle/i, /pendant/i, /collier/i],
    categories: ["Bijoux"],
    verticalSummary: "des bijoux",
  },
  // TODO: Ajouter les secteurs ici au fur et à mesure
];
