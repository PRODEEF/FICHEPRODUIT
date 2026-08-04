---
name: feature-structure
description: >
  Structure de dossiers à appliquer systématiquement lors de la création d'une nouvelle feature
  dans le frontend React/TypeScript de FicheProduit. Utilise ce skill dès qu'on
  crée un nouveau feature, qu'on ajoute une page, un composant, un hook ou toute logique
  liée à un domaine métier. S'applique aussi quand on réorganise du code existant.
paths:
  - "frontend/src/features/**/*.ts"
  - "frontend/src/features/**/*.tsx"
---

# Feature structure — FicheProduit frontend

## Features existantes (référence)

| Feature     | Rôle                                      |
| ----------- | ----------------------------------------- |
| `auth`      | Login, signup, profil, guards de route    |
| `landing`   | Page d'accueil                            |
| `catalog`   | Catalogue produits, filtres, export       |
| `store`     | Configuration boutique (secteur, marques) |
| `billing`   | Pages retour Stripe                       |
| `marketing` | Pages légales, démo, à propos             |

Nouvelle feature → créer `features/<nom>/` + enregistrer la page dans `app/router.tsx` (lazy import).

## Convention principale

Chaque feature vit dans `frontend/src/features/<nom-feature>/`.

### Sous-dossiers obligatoires (toujours créés, même vides au départ)

```
features/<nom>/
├── components/   ← toujours présent
└── pages/        ← toujours présent
```

### Sous-dossiers conditionnels

| Dossier  | Créer quand                                     |
| -------- | ----------------------------------------------- |
| `hooks/` | 2 hooks ou plus propres au feature              |
| `lib/`   | helpers/schemas privés au feature (pas globaux) |

### Fichiers à la racine du feature

| Fichier                          | Quand                                               |
| -------------------------------- | --------------------------------------------------- |
| `types.ts`                       | Types internes au feature (pas de dossier `types/`) |
| `useXxx.ts`                      | 1 seul hook — reste à plat, pas de dossier `hooks/` |
| `AuthContext.tsx` + `useAuth.ts` | Context + hook indissociables → à plat              |

---

## Règles immuables

- **`pages/`** : uniquement les composants montés par `app/router.tsx`. Jamais importés par d'autres features.
- **`components/`** : UI propre au feature. Si utilisé par 2+ features → `shared/`.
- **Pas de barrel `index.ts`** à la racine du feature.
- **1 hook seul** → fichier à plat. **2+ hooks** → dossier `hooks/`.
- **`lib/` dans le feature** seulement si privé. Helpers partagés → `src/shared/lib/` ou `src/api/`.
- **`types.ts`** à la racine. **Pas de dossier `types/`** dans un feature.

---

## Structure de référence par taille

### Petit feature (ex. auth)

```
features/auth/
├── AuthContext.tsx
├── components/
│   ├── PasswordField.tsx
│   └── ProfileForm.tsx
├── lib/
│   └── authSchemas.ts
└── pages/
    ├── Login.tsx
    ├── Signup.tsx
    └── Profile.tsx
```

### Feature moyen (ex. landing)

```
features/landing/
├── types.ts
├── hooks/
│   └── useGuestSiteAnalysis.ts
├── components/
│   └── HowItWorks.tsx
└── pages/
    └── Home.tsx
```

### Feature dense (ex. catalog)

```
features/catalog/
├── types.ts
├── components/
│   ├── ProductPreview.tsx
│   └── ProductResultsToolbar.tsx
├── hooks/
│   ├── useProductFilters.ts
│   └── useCatalogProductExport.ts
├── lib/
│   ├── catalogWorkflowStatus.ts
│   └── productUtils.ts
└── pages/
    ├── Catalog.tsx
    └── PublicCatalog.tsx
```

---

## Shared, API et types globaux

```
src/
├── api/                 ← fonctions async vers le backend Nest (consommées par les hooks)
├── shared/
│   ├── ui/              ← primitives (@shared/ui)
│   ├── lib/             ← cn, parseZodErrors, guestSessionStorage, etc.
│   └── layout/          ← Navbar, BackgroundGlow
├── app/
│   └── router.tsx
└── api/types/
    └── api.types.ts     ← types API partagés (@types-api)
```

Types API : importer depuis `@types-api`, pas depuis un dossier `generated/` (n'existe plus).

---

## Checklist à la création d'un nouveau feature

1. Créer `features/<nom>/components/` et `features/<nom>/pages/`.
2. Enregistrer la page dans `app/router.tsx`.
3. Si 1 hook → à plat. Si 2+ → `hooks/`.
4. Helpers privés → `lib/` du feature. Helpers globaux → `shared/lib/` ou `api/`.
5. Types locaux → `types.ts` à la racine.
6. Pas de `index.ts` barrel.
