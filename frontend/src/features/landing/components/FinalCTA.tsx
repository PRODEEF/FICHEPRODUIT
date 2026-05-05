import { Button } from '@shared/ui/Button';

export function FinalCTA() {
  return (
    <section className="bg-purple-700 py-24 px-4 text-center text-white">
      <h2 className="text-4xl font-extrabold mb-4">
        Lance-toi — 14 jours gratuits, sans carte bancaire
      </h2>
      <p className="text-purple-200 mb-10 text-lg">
        Crée ton compte et commence à générer des fiches en quelques minutes.
      </p>
      <Button href="/signup" variant="secondary" size="lg">
        S&apos;inscrire gratuitement
      </Button>
      <p className="mt-6 text-purple-300 text-sm">
        Annulation en 1 clic · Support inclus · Compatible PrestaShop & Shopify
      </p>
    </section>
  );
}
