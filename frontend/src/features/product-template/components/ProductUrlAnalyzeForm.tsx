import { InputField } from '@shared/ui/InputField';

export interface ProductUrlAnalyzeFormProps {
  scrapeUrl: string;
  onScrapeUrlChange: (value: string) => void;
  scraping: boolean;
  urlEmptyError: boolean;
  disabled?: boolean;
  onSubmit: () => void;
}

export function ProductUrlAnalyzeForm({
  scrapeUrl,
  onScrapeUrlChange,
  scraping,
  urlEmptyError,
  disabled = false,
  onSubmit,
}: ProductUrlAnalyzeFormProps) {
  return (
    <>
      <form
        className="relative w-full min-w-[12rem] flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <InputField
          id="product-template-scrape-url"
          label="URL produit"
          labelClassName="sr-only"
          containerClassName="m-0"
          inputClassName="w-full rounded-2xl border border-soft bg-bg-white px-6 py-[18px] pr-[140px] font-sans text-base text-text-primary outline-none transition focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.12)] disabled:cursor-not-allowed disabled:bg-bg-main disabled:opacity-85 aria-[invalid=true]:border-red-500 aria-[invalid=true]:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
          type="url"
          placeholder="URL d'une fiche produit à analyser"
          value={scrapeUrl}
          onChange={(e) => void onScrapeUrlChange(e.target.value)}
          disabled={scraping || disabled}
          aria-busy={scraping}
          aria-invalid={urlEmptyError}
          aria-describedby={urlEmptyError ? 'product-template-url-empty' : undefined}
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-xl border-0 bg-gradient-to-br from-purple-600 to-purple-500 px-6 py-3 font-sans text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-65"
          disabled={scraping || disabled}
        >
          {scraping ? '…' : 'Analyser'}
        </button>
      </form>

      {urlEmptyError ? (
        <p
          id="product-template-url-empty"
          className="mt-2 w-full text-sm font-medium text-red-500"
          role="alert"
        >
          Indiquez une URL à analyser
        </p>
      ) : null}
    </>
  );
}
