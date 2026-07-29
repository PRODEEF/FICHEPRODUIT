# Frontend — ficheproduit

SPA React 19 + Vite + TypeScript + Tailwind.

## Démarrage

```bash
cp .env.example .env   # renseigner VITE_SUPABASE_* au minimum
npm ci
npm run dev
```

Le proxy Vite envoie `/api` vers `http://localhost:3000` (voir `vite.config.ts`).

## Variables d’environnement

Voir [`.env.example`](.env.example) :

| Variable                 | Rôle                                        |
| ------------------------ | ------------------------------------------- |
| `VITE_SUPABASE_URL`      | Projet Supabase                             |
| `VITE_SUPABASE_ANON_KEY` | Clé anon (publique)                         |
| `VITE_API_URL`           | URL backend en cross-origin (vide en local) |
| `VITE_SITE_URL`          | Origine frontend pour redirects auth        |
| `VITE_CONTACT_EMAIL`     | Email contact / pricing (optionnel)         |

## Scripts

| Commande               | Description                             |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Serveur de développement                |
| `npm run build`        | `tsc -b` + build Vite                   |
| `npm run test`         | Vitest (`*.vitest.ts` / `*.vitest.tsx`) |
| `npm run lint`         | ESLint                                  |
| `npm run format:check` | Prettier                                |

## Déploiement

Hébergement Vercel (dossier `frontend/`), rewrite SPA dans `vercel.json`. Guide complet : [../backend/DEPLOY.md](../backend/DEPLOY.md).
