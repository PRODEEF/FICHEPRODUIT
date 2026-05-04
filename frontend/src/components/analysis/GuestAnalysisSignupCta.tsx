import { Link } from 'react-router';

export type GuestAnalysisSignupCtaProps = {
  websiteUrl: string;
};

/**
 * Rappelle qu’une analyse consultée hors compte n’est pas persistée pour l’utilisateur,
 * puis invite à créer un compte (URL du site transmise pour préremplissage du formulaire).
 */
export function GuestAnalysisSignupCta({ websiteUrl }: GuestAnalysisSignupCtaProps) {
  const signupHref = `/signup?${new URLSearchParams({ url: websiteUrl }).toString()}`;

  return (
    <section
      className="analysis-result-banner analyses-result-banner--wide analyses-guest-save-cta"
      aria-labelledby="analyses-guest-save-cta-title"
    >
      <h2 id="analyses-guest-save-cta-title" className="analyses-guest-save-cta-title">
        Cette analyse n&apos;est pas enregistrée sur un compte
      </h2>
      <p className="analyses-guest-save-cta-text">
        Sans inscription, tes résultats ne sont{' '}
        <strong>sauvegardés ni en base pour ton profil</strong> : tu les consultes tant que la
        session serveur les garde disponibles. Crée un compte pour retrouver ton historique
        d&apos;analyses et aller plus loin.
      </p>
      <div className="analyses-guest-save-cta-actions">
        <Link to={signupHref} className="analyses-back-link analyses-guest-save-cta-login">
          Créer un compte
        </Link>
      </div>
    </section>
  );
}
