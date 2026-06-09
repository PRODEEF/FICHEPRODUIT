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
  LayoutGrid,
  Mountain,
  Shirt,
  Tent,
  UtensilsCrossed,
  Watch,
  Waves,
  Wind,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { SHOP_SECTOR_LABELS, type ShopSectorLabel } from '@shared/lib/shopSectors';

export interface Universe {
  label: ShopSectorLabel;
  icon: LucideIcon;
  color: string;
  example: string;
}

const UNIVERSE_META: Record<ShopSectorLabel, Pick<Universe, 'icon' | 'color' | 'example'>> = {
  Nautisme: {
    icon: Waves,
    color: 'text-cyan-400',
    example: 'Combinaisons néoprène, planches, accessoires',
  },
  Glisse: {
    icon: Wind,
    color: 'text-sky-400',
    example: 'Ailes, barres, harnais, sécurité',
  },
  Vélo: {
    icon: Bike,
    color: 'text-lime-400',
    example: 'VTT, route, gravel, composants',
  },
  Outdoor: {
    icon: Tent,
    color: 'text-emerald-400',
    example: 'Tentes, sacs, lampes, randonnée',
  },
  Montagne: {
    icon: Mountain,
    color: 'text-slate-300',
    example: 'Ski, alpinisme, équipement technique',
  },
  Mode: {
    icon: Shirt,
    color: 'text-pink-400',
    example: 'Collections, matières, tailles, looks',
  },
  Maison: {
    icon: Home,
    color: 'text-amber-400',
    example: 'Déco, cuisine, rangement, entretien',
  },
  Animalerie: {
    icon: Dog,
    color: 'text-orange-400',
    example: 'Chiens, chats, accessoires, nutrition',
  },
  Sport: {
    icon: Dumbbell,
    color: 'text-red-400',
    example: 'Musculation, cardio, performance',
  },
  Jardin: {
    icon: Flower2,
    color: 'text-green-400',
    example: 'Plantes, outils, arrosage, extérieur',
  },
  Bricolage: {
    icon: Hammer,
    color: 'text-yellow-400',
    example: 'Outillage, rénovation, atelier',
  },
  Puériculture: {
    icon: Baby,
    color: 'text-rose-300',
    example: 'Bébé, sécurité, éveil, quotidien',
  },
  Bijoux: {
    icon: Gem,
    color: 'text-violet-400',
    example: 'Bagues, colliers, matières précieuses',
  },
  Montres: {
    icon: Watch,
    color: 'text-zinc-300',
    example: 'Horlogerie, style, précision',
  },
  Gastronomie: {
    icon: UtensilsCrossed,
    color: 'text-orange-300',
    example: 'Épicerie fine, art de table, saveurs',
  },
  Gaming: {
    icon: Gamepad2,
    color: 'text-indigo-400',
    example: 'Consoles, accessoires, univers joueurs',
  },
  Autres: {
    icon: LayoutGrid,
    color: 'text-gray-400',
    example: 'Catalogues hors secteurs listés',
  },
};

export const universes: Universe[] = SHOP_SECTOR_LABELS.flatMap((label) => {
  const meta = UNIVERSE_META[label];
  if (!meta) return [];
  return [{ label, ...meta }];
});
