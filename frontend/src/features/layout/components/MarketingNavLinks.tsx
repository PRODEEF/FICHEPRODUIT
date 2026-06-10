import { Button } from '@shared/ui';

export function MarketingNavLinks() {
  return (
    <nav className="flex items-center gap-3" aria-label="Pages marketing">
      <Button href="/pricing" variant="neutral-outline" size="sm">
        Tarifs
      </Button>
      <Button href="/demo" variant="neutral-outline" size="sm">
        Demander une démo
      </Button>
      <Button href="/about" variant="neutral-outline" size="sm">
        Qui sommes-nous
      </Button>
    </nav>
  );
}
