import { TextLink } from '@shared/ui';
import { LEGAL_LINKS } from '@lib/legalLinks';

const COPYRIGHT_YEAR = 2026;

export function HomeFooter() {
  return (
    <footer className="relative z-[1] border-t border-soft px-6 py-3">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="m-0 text-xs text-text-muted">
          © {COPYRIGHT_YEAR} Fiche Produit. Tous droits réservés.
        </p>
        <nav
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
          aria-label="Informations légales"
        >
          {LEGAL_LINKS.map((link) => (
            <TextLink
              key={link.href}
              to={link.href}
              className="text-xs font-medium text-text-secondary hover:text-purple-600"
            >
              {link.label}
            </TextLink>
          ))}
        </nav>
      </div>
    </footer>
  );
}
