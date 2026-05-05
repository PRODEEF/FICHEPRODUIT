import {
  Baby,
  Bike,
  Dog,
  Dumbbell,
  Flower2,
  Gamepad2,
  Gem,
  Hammer,
  Home,
  Mountain,
  Shirt,
  Tent,
  UtensilsCrossed,
  Watch,
  Waves,
  Wind,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Universe = {
  label: string;
  icon: LucideIcon;
  color: string;
  example: string;
};

export const universes: Universe[] = [
  {
    label: 'Nautisme',
    icon: Waves,
    color: 'text-cyan-400',
    example: 'Combinaisons néoprène, planches, accessoires',
  },
  {
    label: 'Glisse',
    icon: Wind,
    color: 'text-sky-400',
    example: 'Ailes, barres, harnais, sécurité',
  },
  {
    label: 'Vélo',
    icon: Bike,
    color: 'text-lime-400',
    example: 'VTT, route, gravel, composants',
  },
  {
    label: 'Outdoor',
    icon: Tent,
    color: 'text-emerald-400',
    example: 'Tentes, sacs, lampes, randonnée',
  },
  {
    label: 'Montagne',
    icon: Mountain,
    color: 'text-slate-300',
    example: 'Ski, alpinisme, équipement technique',
  },
  {
    label: 'Mode',
    icon: Shirt,
    color: 'text-pink-400',
    example: 'Collections, matières, tailles, looks',
  },
  {
    label: 'Maison',
    icon: Home,
    color: 'text-amber-400',
    example: 'Déco, cuisine, rangement, entretien',
  },
  {
    label: 'Animalerie',
    icon: Dog,
    color: 'text-orange-400',
    example: 'Chiens, chats, accessoires, nutrition',
  },
  {
    label: 'Sport',
    icon: Dumbbell,
    color: 'text-red-400',
    example: 'Musculation, cardio, performance',
  },
  {
    label: 'Jardin',
    icon: Flower2,
    color: 'text-green-400',
    example: 'Plantes, outils, arrosage, extérieur',
  },
  {
    label: 'Bricolage',
    icon: Hammer,
    color: 'text-yellow-400',
    example: 'Outillage, rénovation, atelier',
  },
  {
    label: 'Puériculture',
    icon: Baby,
    color: 'text-rose-300',
    example: 'Bébé, sécurité, éveil, quotidien',
  },
  {
    label: 'Bijoux',
    icon: Gem,
    color: 'text-violet-400',
    example: 'Bagues, colliers, matières précieuses',
  },
  {
    label: 'Montres',
    icon: Watch,
    color: 'text-zinc-300',
    example: 'Horlogerie, style, précision',
  },
  {
    label: 'Gastronomie',
    icon: UtensilsCrossed,
    color: 'text-orange-300',
    example: 'Épicerie fine, art de table, saveurs',
  },
  {
    label: 'Gaming',
    icon: Gamepad2,
    color: 'text-indigo-400',
    example: 'Consoles, accessoires, univers joueurs',
  },
];

export type Testimonial = {
  quote: string;
  author: string;
  details: string;
};

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
