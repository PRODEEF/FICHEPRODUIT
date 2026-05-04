export type HeroSearchFormProps = {
  siteInput: string;
  setSiteInput: (value: string) => void;
  suggestionsLoading: boolean;
  searchEmptyError: boolean;
  handleSubmit: () => void;
};

export function HeroSearchForm({
  siteInput,
  setSiteInput,
  suggestionsLoading,
  searchEmptyError,
  handleSubmit,
}: HeroSearchFormProps) {
  return (
    <>
      <form
        className="search-container"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        <input
          className="search-bar"
          placeholder="Indique moi ton site internet"
          value={siteInput}
          onChange={(e) => setSiteInput(e.target.value)}
          disabled={suggestionsLoading}
          aria-busy={suggestionsLoading}
          aria-invalid={searchEmptyError}
          aria-describedby={searchEmptyError ? 'landing-site-empty-error' : undefined}
        />
        <button type="submit" className="search-btn" disabled={suggestionsLoading}>
          {suggestionsLoading ? '…' : 'Analyser'}
        </button>
      </form>

      {searchEmptyError ? (
        <p id="landing-site-empty-error" className="landing-search-error" role="alert">
          Veuillez entrer le nom ou l&apos;URL de votre site
        </p>
      ) : null}

      {suggestionsLoading ? (
        <p className="landing-suggestions-hint">
          Analyse de ta saisie et recherche d&apos;adresses…
        </p>
      ) : null}
    </>
  );
}
