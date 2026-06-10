export interface Testimonial {
  quote: string;
  author: string;
  details: string;
}

export const testimonials: Testimonial[] = [
  {
    quote: "En 10 minutes j'avais 40 fiches prêtes à importer.",
    author: 'Marine D.',
    details: 'boutique kitesurf, Montpellier',
  },
  {
    quote: 'Le vocabulaire technique vélo est bluffant, on dirait un vrai rédacteur.',
    author: 'Thibault R.',
    details: 'shop vélo/gravel, Lyon',
  },
  {
    quote: 'Enfin un outil qui comprend la mode outdoor sans écrire du texte générique.',
    author: 'Camille V.',
    details: 'prêt-à-porter outdoor, Bordeaux',
  },
];
