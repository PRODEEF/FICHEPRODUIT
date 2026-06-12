import { Loader2 } from 'lucide-react';

import { InputField } from '@shared/ui/InputField';
import { cn } from '@shared/lib/cn';

export interface UrlSearchFormProps {
  siteInput: string;
  setSiteInput: (value: string) => void;
  suggestionsLoading: boolean;
  searchEmptyError: boolean;
  handleSubmit: () => void;
  align?: 'left' | 'center';
}

export function UrlSearchForm({
  siteInput,
  setSiteInput,
  suggestionsLoading,
  searchEmptyError,
  handleSubmit,
  align = 'center',
}: UrlSearchFormProps) {
  const alignmentClass = align === 'center' ? 'mx-auto' : '';

  return (
    <>
      <form
        className={`relative mb-6 w-full max-w-[620px] ${alignmentClass}`}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <InputField
          id="landing-site-url"
          label="Adresse du site"
          labelClassName="sr-only"
          containerClassName="m-0"
          inputClassName={cn(
            'w-full rounded-2xl border border-soft bg-bg-white px-6 py-[18px] font-sans text-base text-text-primary outline-none transition focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.12)] disabled:cursor-not-allowed disabled:bg-bg-main disabled:opacity-85 aria-[invalid=true]:border-red-500 aria-[invalid=true]:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]',
            suggestionsLoading ? 'pr-[220px]' : 'pr-[140px]',
          )}
          placeholder="Indiquez l’adresse de votre site internet"
          value={siteInput}
          onChange={(e) => void setSiteInput(e.target.value)}
          disabled={suggestionsLoading}
          aria-busy={suggestionsLoading}
          aria-invalid={searchEmptyError}
          aria-describedby={searchEmptyError ? 'landing-site-empty-error' : undefined}
        />
        <button
          type="submit"
          className={cn(
            'absolute right-1.5 top-1/2 -translate-y-1/2 rounded-xl border-0 bg-gradient-to-br from-purple-600 to-purple-500 py-3 font-sans text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-65',
            suggestionsLoading ? 'px-4' : 'px-6',
          )}
          disabled={suggestionsLoading}
          aria-busy={suggestionsLoading}
        >
          {suggestionsLoading ? (
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <Loader2
                className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
                aria-hidden
              />
              Recherche en cours
            </span>
          ) : (
            'Analyser'
          )}
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
