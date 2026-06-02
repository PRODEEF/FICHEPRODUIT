import { Button } from '@shared/ui';

interface GuestCatalogCTAProps {
  websiteUrl: string;
}

export function GuestCatalogCTA({ websiteUrl }: GuestCatalogCTAProps) {
  const trimmedUrl = websiteUrl.trim();
  const signupHref =
    trimmedUrl === ''
      ? '/signup'
      : `/signup?${new URLSearchParams({ url: trimmedUrl }).toString()}`;

  return (
    <section
      className="mb-5 rounded-2xl border border-border-purple bg-purple-50 px-5 py-4 text-left"
      aria-labelledby="analyses-guest-save-cta-title"
    >
      <h2 id="analyses-guest-save-cta-title" className="mb-2 text-base font-bold text-text-primary">
        Cette analyse n&apos;est pas enregistrée sur un compte
      </h2>
      <p className="mb-4 text-sm leading-6 text-text-secondary">
        Sans inscription, vos résultats ne sont <strong>pas sauvegardés sur votre profil</strong> :
        vous les consultez tant que la session serveur les garde disponibles. Créez un compte pour
        retrouver votre historique d&apos;analyses et aller plus loin.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button href={signupHref} variant="primary" size="sm" glow>
          S&apos;inscrire gratuitement
        </Button>
      </div>
    </section>
  );
}
