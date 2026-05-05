const universes = [
  {
    emoji: '🏄',
    name: 'Surf',
    example: "Planche shortboard Lost 5'10, rocker prononcé, idéale vagues creuses...",
  },
  {
    emoji: '🪁',
    name: 'Kitesurf',
    example: 'Aile Duotone Evo 12m², allwind, parfaite riders intermédiaires...',
  },
  {
    emoji: '🚵',
    name: 'Vélo',
    example: 'Cadre carbone Trek Madone SL, geometry race, 1 050g, taille 56cm...',
  },
  {
    emoji: '👗',
    name: 'Mode',
    example: 'Robe lin Sézane col V, coupe loose, coloris terracotta, tailles XS-XL...',
  },
  {
    emoji: '🏕️',
    name: 'Outdoor',
    example: 'Tente MSR Hubba NX 2P, 1,3kg, résistante 3 saisons, montage rapide...',
  },
  {
    emoji: '🎿',
    name: 'Ski',
    example: 'Skis Salomon QST 98, rocker mixte, polyvalent hors-piste, 178cm...',
  },
  {
    emoji: '🐾',
    name: 'Animalerie',
    example: 'Croquettes Royal Canin Medium Adult 15kg, poulet & riz, 1-7 ans...',
  },
  {
    emoji: '🏠',
    name: 'Maison',
    example: 'Canapé tissu bouclette 3 places, structure chêne massif, L.220cm...',
  },
];

export function ExpertiseGrid() {
  return (
    <section className="py-20 px-4 max-w-5xl mx-auto">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-4 text-center">ficheproduct connaît ton univers</h2>
      <p className="text-gray-500 mb-12 text-center">
        Notre moteur adapte le ton, la technicité et les arguments selon ta niche e-commerce.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {universes.map((item) => (
          <article
            key={item.name}
            className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-purple-300 hover:shadow-md transition-all duration-200"
          >
            <p className="text-3xl mb-3">{item.emoji}</p>
            <h3 className="font-bold text-gray-900 text-sm mb-2">{item.name}</h3>
            <p className="text-xs text-gray-400 italic leading-relaxed">{item.example}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
