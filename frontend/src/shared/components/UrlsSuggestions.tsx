export type UrlsSuggestionsProps = {
  urls: string[];
  onPick: (url: string) => void;
};

export function UrlsSuggestions({ urls, onPick }: UrlsSuggestionsProps) {
  if (urls.length === 0) return null;

  return (
    <div
      className="mb-6 mt-[-0.25rem] w-full max-w-[620px] text-left"
      role="list"
      aria-label="Sites proposés"
    >
      <p className="mb-3 text-sm font-semibold text-text-secondary">
        Choisissez le site à analyser :
      </p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {urls.map((url) => (
          <li key={url} role="listitem">
            <button
              type="button"
              className="w-full rounded-xl border border-soft bg-bg-white px-4 py-3 text-left font-sans text-sm text-purple-600 transition hover:border-purple-400 hover:bg-purple-50"
              onClick={() => void onPick(url)}
            >
              {url}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
