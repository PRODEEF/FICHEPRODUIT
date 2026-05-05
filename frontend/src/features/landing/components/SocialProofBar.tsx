export function SocialProofBar() {
  const universes = ['🏄 Surf', '🪁 Kitesurf', '🚵 Vélo', '🏕️ Outdoor', '🎿 Ski'];

  return (
    <section className="bg-purple-50 border-b border-purple-100 py-4 text-center">
      <p className="text-sm text-purple-700 font-medium">
        Déjà utilisé par des marchands dans ces univers
      </p>
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-2">
        {universes.map((universe) => (
          <span key={universe} className="text-sm text-gray-600">
            {universe}
          </span>
        ))}
      </div>
      <p className="mt-3 text-purple-700 font-extrabold text-lg">2 000+ marchands accompagnés</p>
    </section>
  );
}
