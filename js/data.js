// ===== DONNÉES PRODUITS =====
const products = [
  // F-ONE 2026 - Ailes
  { year: "2026", brand: "F-One", category: "Kitesurf", subcategory: "Ailes", title: "F-One Bandit 2026", desc: "Aile polyvalente tous niveaux", commercial: "La Bandit 2026 offre des performances exceptionnelles avec son profil redessiné.", price: "1 599 €", image: "https://placehold.co/100x100/a855f7/fff?text=Bandit" },
  { year: "2026", brand: "F-One", category: "Kitesurf", subcategory: "Ailes", title: "F-One Breeze V4 2026", desc: "Aile légère vent faible", commercial: "Décolle dès 8 nœuds. Stabilité et contrôle inégalés en lightwind.", price: "1 799 €", image: "https://placehold.co/100x100/a855f7/fff?text=Breeze" },
  { year: "2026", brand: "F-One", category: "Kitesurf", subcategory: "Ailes", title: "F-One Trigger 2026", desc: "Aile freestyle/wakestyle", commercial: "Puissance explosive et slack énorme pour le freestyle décroché.", price: "1 749 €", image: "https://placehold.co/100x100/a855f7/fff?text=Trigger" },
  { year: "2026", brand: "F-One", category: "Kitesurf", subcategory: "Ailes", title: "F-One Strike CWC 2026", desc: "Aile compacte convertible", commercial: "Hybride révolutionnaire compatible wing et kite.", price: "1 449 €", image: "https://placehold.co/100x100/a855f7/fff?text=Strike" },
  { year: "2026", brand: "F-One", category: "Kitesurf", subcategory: "Ailes", title: "F-One Diablo 2026", desc: "Aile race/freeride", commercial: "Rapport puissance/poids optimisé pour la vitesse.", price: "1 899 €", image: "https://placehold.co/100x100/a855f7/fff?text=Diablo" },

  // F-ONE 2026 - Planches
  { year: "2026", brand: "F-One", category: "Kitesurf", subcategory: "Planches", title: "F-One Trax HRD Carbon 2026", desc: "Twin-tip carbone", commercial: "Full carbon pour réactivité max. Pop explosif.", price: "899 €", image: "https://placehold.co/100x100/6d28d9/fff?text=Trax" },
  { year: "2026", brand: "F-One", category: "Kitesurf", subcategory: "Planches", title: "F-One Trax Lite Tech 2026", desc: "Twin-tip polyvalente", commercial: "Best-seller allégé. Confort et performance.", price: "699 €", image: "https://placehold.co/100x100/6d28d9/fff?text=Trax+LT" },
  { year: "2026", brand: "F-One", category: "Kitesurf", subcategory: "Planches", title: "F-One Slice Bamboo 2026", desc: "Surfboard strapless", commercial: "Construction bambou éco-responsable. Glisse pure.", price: "1 099 €", image: "https://placehold.co/100x100/6d28d9/fff?text=Slice" },
  { year: "2026", brand: "F-One", category: "Kitesurf", subcategory: "Planches", title: "F-One Mitu Pro Flex 2026", desc: "Surfboard signature", commercial: "Shape validé par le champion du monde Mitu.", price: "1 249 €", image: "https://placehold.co/100x100/6d28d9/fff?text=Mitu" },
  { year: "2026", brand: "F-One", category: "Kitesurf", subcategory: "Planches", title: "F-One Magnet Carbon 2026", desc: "Foilboard carbone", commercial: "Seulement 1.8kg ! Référence kitefoil racing.", price: "1 399 €", image: "https://placehold.co/100x100/6d28d9/fff?text=Magnet" },

  // DUOTONE 2026 - Ailes
  { year: "2026", brand: "Duotone", category: "Kitesurf", subcategory: "Ailes", title: "Duotone Evo SLS 2026", desc: "Aile polyvalente premium", commercial: "Rigidité, réactivité et hangtime. Construction Penta TX.", price: "2 199 €", image: "https://placehold.co/100x100/22c55e/fff?text=Evo" },
  { year: "2026", brand: "Duotone", category: "Kitesurf", subcategory: "Ailes", title: "Duotone Evo D/LAB 2026", desc: "Aile Aluula ultra légère", commercial: "Construction D/LAB en Aluula. Boost et hangtime démentiels.", price: "2 949 €", image: "https://placehold.co/100x100/22c55e/fff?text=Evo+DLAB" },
  { year: "2026", brand: "Duotone", category: "Kitesurf", subcategory: "Ailes", title: "Duotone Rebel SLS 2026", desc: "Aile big air premium", commercial: "Feedback direct, hangtime exceptionnel. Sauts vertigineux.", price: "2 099 €", image: "https://placehold.co/100x100/22c55e/fff?text=Rebel" },
  { year: "2026", brand: "Duotone", category: "Kitesurf", subcategory: "Ailes", title: "Duotone Neo SLS 2026", desc: "Aile vagues", commercial: "Drift incroyable, réactive et stable. Référence surf.", price: "2 099 €", image: "https://placehold.co/100x100/22c55e/fff?text=Neo" },
  { year: "2026", brand: "Duotone", category: "Kitesurf", subcategory: "Ailes", title: "Duotone Dice SLS 2026", desc: "Aile allrounder", commercial: "Pop explosif, drift fluide. Freestyle, vagues, big air.", price: "2 099 €", image: "https://placehold.co/100x100/22c55e/fff?text=Dice" },

  // DUOTONE 2026 - Planches
  { year: "2026", brand: "Duotone", category: "Kitesurf", subcategory: "Planches", title: "Duotone Jaime SLS 2026", desc: "Twin-tip freestyle", commercial: "Signature Jaime. Pop explosif pour le freestyle.", price: "799 €", image: "https://placehold.co/100x100/16a34a/fff?text=Jaime" },
  { year: "2026", brand: "Duotone", category: "Kitesurf", subcategory: "Planches", title: "Duotone Select SLS 2026", desc: "Twin-tip freeride", commercial: "Confort et performance Textreme.", price: "749 €", image: "https://placehold.co/100x100/16a34a/fff?text=Select" },
  { year: "2026", brand: "Duotone", category: "Kitesurf", subcategory: "Planches", title: "Duotone Soar SLS 2026", desc: "Foilboard carbone", commercial: "Rails ouverts, montage simplifié.", price: "1 199 €", image: "https://placehold.co/100x100/16a34a/fff?text=Soar" },

  // NORTH 2026
  { year: "2026", brand: "North", category: "Kitesurf", subcategory: "Ailes", title: "North Orbit 2026", desc: "Aile big air/freeride", commercial: "Redessinée pour 2026. Plus de lift, loops confiants.", price: "1 799 €", image: "https://placehold.co/100x100/3b82f6/fff?text=Orbit" },
  { year: "2026", brand: "North", category: "Kitesurf", subcategory: "Ailes", title: "North Reach 2026", desc: "Aile polyvalente", commercial: "Polyvalente pour twin-tip, surf et foil.", price: "1 449 €", image: "https://placehold.co/100x100/3b82f6/fff?text=Reach" },
  { year: "2026", brand: "North", category: "Kitesurf", subcategory: "Ailes", title: "North Carve 2026", desc: "Aile vagues/strapless", commercial: "Drift et depower pour les vagues.", price: "1 399 €", image: "https://placehold.co/100x100/3b82f6/fff?text=Carve" },
  { year: "2026", brand: "North", category: "Kitesurf", subcategory: "Ailes", title: "North Pulse 2026", desc: "Aile freestyle/wakestyle", commercial: "Pour le freestyle décroché et wakestyle.", price: "1 499 €", image: "https://placehold.co/100x100/3b82f6/fff?text=Pulse" },
  { year: "2026", brand: "North", category: "Kitesurf", subcategory: "Planches", title: "North Atmos Pro 2026", desc: "Twin-tip big air", commercial: "Tuned pour les boosts et le big air.", price: "699 €", image: "https://placehold.co/100x100/2563eb/fff?text=Atmos" },

  // CORE 2026
  { year: "2026", brand: "Core", category: "Kitesurf", subcategory: "Ailes", title: "Core XR Pro V2 2026", desc: "Aile big air Aluula", commercial: "L'aile big air ultime. Records de hauteur.", price: "2 599 €", image: "https://placehold.co/100x100/eab308/000?text=XR+Pro" },
  { year: "2026", brand: "Core", category: "Kitesurf", subcategory: "Ailes", title: "Core XR8 2026", desc: "Aile freeride/big air", commercial: "ExoTex 2 ultra rigide. Aérodynamique optimisée.", price: "1 899 €", image: "https://placehold.co/100x100/eab308/000?text=XR8" },
  { year: "2026", brand: "Core", category: "Kitesurf", subcategory: "Ailes", title: "Core Nexus V4 2026", desc: "Aile polyvalente", commercial: "Polyvalence ultime avec réglages CIT.", price: "1 799 €", image: "https://placehold.co/100x100/eab308/000?text=Nexus" },
  { year: "2026", brand: "Core", category: "Kitesurf", subcategory: "Ailes", title: "Core Section 5 2026", desc: "Aile vagues", commercial: "Drift exceptionnel pour le surf.", price: "1 699 €", image: "https://placehold.co/100x100/eab308/000?text=Section" },
  { year: "2026", brand: "Core", category: "Kitesurf", subcategory: "Ailes", title: "Core Pace 2026", desc: "Aile freeride/big air", commercial: "3 lattes, loops rapides, boost puissant.", price: "1 599 €", image: "https://placehold.co/100x100/eab308/000?text=Pace" },

  // CABRINHA 2026
  { year: "2026", brand: "Cabrinha", category: "Kitesurf", subcategory: "Ailes", title: "Cabrinha Switchblade Apex 2026", desc: "Aile freeride polyvalente", commercial: "20 ans de succès. Équilibre puissance et contrôle.", price: "1 699 €", image: "https://placehold.co/100x100/ef4444/fff?text=Switchblade" },
  { year: "2026", brand: "Cabrinha", category: "Kitesurf", subcategory: "Ailes", title: "Cabrinha Drifter Apex 2026", desc: "Aile vagues", commercial: "La référence surf. Drift et réactivité.", price: "1 599 €", image: "https://placehold.co/100x100/ef4444/fff?text=Drifter" },
  { year: "2026", brand: "Cabrinha", category: "Kitesurf", subcategory: "Ailes", title: "Cabrinha Nitro Apex 2026", desc: "Aile big air", commercial: "Hauteur, hangtime et megaloops.", price: "1 799 €", image: "https://placehold.co/100x100/ef4444/fff?text=Nitro" },
  { year: "2026", brand: "Cabrinha", category: "Kitesurf", subcategory: "Ailes", title: "Cabrinha Moto X Apex 2026", desc: "Aile crossover", commercial: "Polyvalente : big air, freeride, wave, freestyle.", price: "1 549 €", image: "https://placehold.co/100x100/ef4444/fff?text=Moto" },

  // NAISH 2026
  { year: "2026", brand: "Naish", category: "Kitesurf", subcategory: "Ailes", title: "Naish Pivot Q 2026", desc: "Aile freeride/big air", commercial: "Légendaire. 2x King of the Air. Polyvalence ultime.", price: "1 699 €", image: "https://placehold.co/100x100/f97316/fff?text=Pivot" },
  { year: "2026", brand: "Naish", category: "Kitesurf", subcategory: "Ailes", title: "Naish Boxer Q 2026", desc: "Aile mono-latte lightwind", commercial: "Mono-latte pour vent léger et foil.", price: "1 299 €", image: "https://placehold.co/100x100/f97316/fff?text=Boxer" },
  { year: "2026", brand: "Naish", category: "Kitesurf", subcategory: "Ailes", title: "Naish Psycho Q 2026", desc: "Aile big air 5 lattes", commercial: "Machine ultime pour les sauts massifs.", price: "1 799 €", image: "https://placehold.co/100x100/f97316/fff?text=Psycho" },
  { year: "2026", brand: "Naish", category: "Kitesurf", subcategory: "Ailes", title: "Naish Triad 2026", desc: "Aile freeride polyvalente", commercial: "Intuitive et stable. Parfaite progression.", price: "1 399 €", image: "https://placehold.co/100x100/f97316/fff?text=Triad" },

  // OZONE 2026
  { year: "2026", brand: "Ozone", category: "Kitesurf", subcategory: "Ailes", title: "Ozone Edge V12 2026", desc: "Aile race/big air", commercial: "Vitesse et contrôle. Référence compétition.", price: "1 899 €", image: "https://placehold.co/100x100/06b6d4/fff?text=Edge" },
  { year: "2026", brand: "Ozone", category: "Kitesurf", subcategory: "Ailes", title: "Ozone Enduro V4 2026", desc: "Aile freeride polyvalente", commercial: "Polyvalence et facilité d'utilisation.", price: "1 599 €", image: "https://placehold.co/100x100/06b6d4/fff?text=Enduro" },
  { year: "2026", brand: "Ozone", category: "Kitesurf", subcategory: "Ailes", title: "Ozone Catalyst V4 2026", desc: "Aile école/progression", commercial: "Stabilité et sécurité pour progresser.", price: "1 399 €", image: "https://placehold.co/100x100/06b6d4/fff?text=Catalyst" }
];
