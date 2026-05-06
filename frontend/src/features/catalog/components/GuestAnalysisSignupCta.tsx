import { Link } from 'react-router';

type GuestAnalysisSignupCtaProps = {
  websiteUrl: string;
};

export function GuestAnalysisSignupCta({ websiteUrl }: GuestAnalysisSignupCtaProps) {
  const signupHref = `/signup?${new URLSearchParams({ url: websiteUrl }).toString()}`;

  return (
    <section
      className="mb-5 rounded-2xl border border-border-purple bg-purple-50 px-5 py-4 text-left"
      aria-labelledby="analyses-guest-save-cta-title"
    >
      <h2 id="analyses-guest-save-cta-title" className="mb-2 text-base font-bold text-text-primary">
        Cette analyse n&apos;est pas enregistrée sur un compte
      </h2>
      <p className="mb-4 text-sm leading-6 text-text-secondary">
        Sans inscription, tes résultats ne sont <strong>pas sauvegardés sur ton profil</strong> : tu
        les consultes tant que la session serveur les garde disponibles. Crée un compte pour
        retrouver ton historique d&apos;analyses et aller plus loin.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Link to={signupHref} className="text-sm font-semibold text-purple-600 no-underline hover:underline">
          Créer un compte
        </Link>
      </div>
    </section>
  );
}
