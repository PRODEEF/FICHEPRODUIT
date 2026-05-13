interface LoadingStateProps {
  label?: string | undefined;
}

export function LoadingState({ label = 'Chargement…' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-start gap-2 py-4" aria-busy="true">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600"
        aria-hidden
      />
      <p className="text-sm text-text-secondary">{label}</p>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div
      className="mb-4 rounded-xl border border-border-purple bg-purple-50 px-4 py-3 text-text-primary"
      role="alert"
    >
      {message}
    </div>
  );
}
