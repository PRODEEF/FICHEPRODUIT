import { Button } from '@shared/ui/Button';

const steps = [
  {
    title: 'Colle ton URL',
    description: 'ficheproduct analyse ton catalogue en quelques secondes',
  },
  {
    title: 'On détecte ton univers',
    description: 'Surf, vélo, mode… la rédaction est adaptée à ton secteur',
  },
  {
    title: 'Tu exportes',
    description: 'Fiches optimisées SEO, prêtes pour PrestaShop ou Shopify',
  },
];

export function HowItWorks() {
  return (
    <section className="bg-white py-20 px-4">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-4 text-center">Comment ça marche</h2>
      <p className="text-gray-500 text-center mb-12">
        Trois étapes simples pour passer de ton catalogue brut à des fiches prêtes à publier.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {steps.map((step, index) => (
          <article key={step.title}>
            <div className="bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold mb-4 mx-auto">
              {index + 1}
            </div>
            <h3 className="font-bold text-gray-900 text-center mb-2">{step.title}</h3>
            <p className="text-gray-500 text-sm text-center">{step.description}</p>
          </article>
        ))}
      </div>
      <div className="text-center mt-12">
        <Button href="/signup" variant="primary" size="lg">
          Essayer maintenant — c&apos;est gratuit
        </Button>
      </div>
    </section>
  );
}
