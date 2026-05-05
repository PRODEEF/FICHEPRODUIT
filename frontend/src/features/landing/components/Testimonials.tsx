import { Button } from '@shared/ui/Button';

const testimonials = [
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

export function Testimonials() {
  return (
    <section className="bg-gray-50 py-20 px-4">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-12 text-center">Ce que disent nos marchands</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {testimonials.map((item) => (
          <article key={item.author} className="bg-white rounded-2xl p-6 border border-purple-100 shadow-sm">
            <p className="text-yellow-400 text-lg mb-3">★★★★★</p>
            <p className="text-gray-700 italic mb-4 leading-relaxed">{item.quote}</p>
            <p className="text-sm font-bold text-gray-900">{item.author}</p>
            <p className="text-xs text-gray-400">{item.details}</p>
          </article>
        ))}
      </div>
      <div className="text-center mt-10">
        <Button href="/signup" variant="ghost">
          Rejoindre 2 000 marchands →
        </Button>
      </div>
    </section>
  );
}
