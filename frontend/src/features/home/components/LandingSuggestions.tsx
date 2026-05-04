export type LandingSuggestionsProps = {
  urls: string[];
  onPick: (url: string) => void;
};

export function LandingSuggestions({ urls, onPick }: LandingSuggestionsProps) {
  if (urls.length === 0) return null;

  return (
    <div className="landing-suggestions" role="list" aria-label="Sites proposés">
      <p className="landing-suggestions-title">Choisis le site à analyser :</p>
      <ul className="landing-suggestions-list">
        {urls.map((url) => (
          <li key={url} role="listitem">
            <button
              type="button"
              className="landing-suggestion-btn"
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
