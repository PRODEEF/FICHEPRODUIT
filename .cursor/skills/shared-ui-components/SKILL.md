---
name: shared-ui-components
description: >
  Rappelle d'utiliser les composants UI partagés du frontend FicheProduit (`@shared/ui`, etc.),
  d’étendre les primitives quand il manque une variante, et de créer un nouveau composant
  (shared ou feature) quand c’est pertinent. À consulter dès qu’on ajoute ou modifie de l’UI
  React dans `frontend/src`.
paths:
  - "frontend/src/**/*.tsx"
  - "frontend/src/shared/ui/**/*.tsx"
---

# Composants UI partagés — frontend FicheProduit

## Règle

Pour toute interface dans `frontend/src/`, **réutiliser d'abord** ce qui existe dans `frontend/src/shared/ui/` (exporté via `@ui` ou `@shared/ui`).

- **Bouton** → `Button` (`variant`, `size`, `tooltip`, `href`, etc.). Ne pas introduire de `<button className="...">` ad hoc dans les features si `Button` peut couvrir le besoin.
- **Champ de saisie** → `InputField` (label intégré, focus purple).
- **Liste déroulante** → `SelectField` (chevron intégré — voir `211-frontend-form-controls.mdc`).
- **Carte / encadré** → `Card`.
- **Lien texte** → `TextLink`.
- **Badge** → `Badge`.
- **Étiquette compacte** → `Tag` (`TagVariant`).
- **Bannière** → `Banner`.
- **Modal** → `Modal`.
- **Section de page** → `PageSection`.
- **Menu déroulant actions** → `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`.
- **Notifications toast** → `toast` / `Toaster` de **sonner** (déjà monté dans `app/App.tsx`) — pas de système toast maison.

## Quand un composant manque

1. Vérifier `shared/ui/` et les usages existants (`grep` sur le nom du composant).
2. Si le design nécessite une variante manquante : **étendre** `Button` (nouvelle `variant` / props) ou le composant concerné, plutôt que dupliquer les classes dans un feature.
3. Si le bloc est vraiment spécifique à un seul écran : le garder dans `features/<x>/components/`, mais **réutiliser** les primitives (`Button`, `cn`, tokens `text-text-primary`, `border-soft`, etc.).

## Créer un nouveau composant quand c’est pertinent

Ne pas tout mettre dans un seul fichier ni tout éclater en micro-composants : viser la **clarté** et la **réutilisation**.

**Créer un composant dans `shared/ui/`** (et l’exporter depuis `@shared/ui/index.ts`) lorsque :

- le même bloc UI est (ou sera) utilisé par **au moins deux features**, ou
- c’est une **primitive visuelle** réutilisable (ex. un type de liste, un en-tête de section récurrent), ou
- étendre `Button` / `Card` / etc. **alourdirait** le composant existant (trop de props ou de branches).

**Créer un composant dans `features/<nom>/components/`** lorsque :

- le bloc est **métier ou navigation** propre au feature, mais réutilisé **plusieurs fois** dans ce feature (éviter copier-coller entre pages du même domaine), ou
- il regroupe plusieurs primitives partagées en un **sous-ensemble stable** (ex. barre d’actions d’un écran catalogue).

**Éviter** un nouveau composant si : une seule occurrence, ou un simple assemblage ponctuel de 2–3 `Button` / `Card` sans logique ni répétition — un JSX local suffit.

Après création : nom explicite, props typées, composition avec `@shared/ui` et `cn`.

## Imports

- Préférer : `import { Button, … } from '@shared/ui';`
- Utilitaires de classe : `import { cn } from '@shared/lib/cn';`

## Anti-patterns

- Bouton « custom » avec uniquement des classes Tailwind copiées depuis un autre fichier.
- Même interaction (tooltip sur bouton désactivé) réimplémentée alors que `Button` expose déjà `tooltip`.
