export type HeroSearchFormProps = {
  siteInput: string;
  setSiteInput: (value: string) => void;
  suggestionsLoading: boolean;
  searchEmptyError: boolean;
  handleSubmit: () => void;
  align?: 'left' | 'center';
};

export function HeroSearchForm({
  siteInput,
  setSiteInput,
  suggestionsLoading,
  searchEmptyError,
  handleSubmit,
  align = 'center',
}: HeroSearchFormProps) {
  const alignmentClass = align === 'center' ? 'mx-auto' : '';

  return (
    <>
      <form
        className={`relative mb-6 w-full max-w-[620px] ${alignmentClass}`}
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        <input
          className="w-full rounded-2xl border border-soft bg-bg-white px-6 py-[18px] pr-[140px] font-sans text-base text-text-primary outline-none transition focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.12)] disabled:cursor-not-allowed disabled:bg-bg-main disabled:opacity-85 aria-[invalid=true]:border-red-500 aria-[invalid=true]:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
          placeholder="Indiquez l’adresse de votre site internet"
          value={siteInput}
          onChange={(e) => setSiteInput(e.target.value)}
          disabled={suggestionsLoading}
          aria-busy={suggestionsLoading}
          aria-invalid={searchEmptyError}
          aria-describedby={searchEmptyError ? 'landing-site-empty-error' : undefined}
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-xl border-0 bg-gradient-to-br from-purple-600 to-purple-500 px-6 py-3 font-sans text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-65"
          disabled={suggestionsLoading}
        >
          {suggestionsLoading ? '…' : 'Analyser'}
        </button>
      </form>

      {searchEmptyError ? (
        <p
          id="landing-site-empty-error"
          className={`mb-4 mt-[-0.5rem] w-full max-w-[620px] px-1 text-left text-sm font-medium text-red-500 ${alignmentClass}`}
          role="alert"
        >
          Veuillez entrer le nom ou l&apos;URL de votre site
        </p>
      ) : null}

      {suggestionsLoading ? (
        <p className={`mb-4 mt-[-0.5rem] max-w-[620px] text-sm text-purple-600 ${alignmentClass}`}>
          Analyse de votre saisie et recherche d&apos;adresses…
        </p>
      ) : null}
    </>
  );
}
