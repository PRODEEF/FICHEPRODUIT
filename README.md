# ficheprod

**Génère tes fiches produits grâce à l’IA** en quelques secondes. MVP compatible PrestaShop et Shopify.

## Structure du dépôt

```markdown
FICHEPRODUIT/
├── frontend/          # React 19 + TypeScript + Vite + Tailwind
│   └── src/
├── backend/           # NestJS 11 + Fastify + Zod + Supabase
│   ├── src/
│   ├── api/index.js   # Point d’entrée Vercel → dist/serverless.js
│   └── vercel.json
├── .github/workflows/ # CI (lint, tests, build)
└── README.md
```

## Développement local

### Backend (port 3000)

```bash
cd backend
cp .env.example .env   # puis renseigner les clés
npm install
npm run start:dev
```

Variables obligatoires : voir [backend/.env.example](backend/.env.example).

### Frontend (port 5173, proxy `/api` → 3000)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Le proxy Vite envoie `/api` vers `http://localhost:3000` (voir [frontend/vite.config.ts](frontend/vite.config.ts)).

### Tests

- **Backend** : `cd backend && npm test` ; e2e : `npm run test:e2e` (variables d’environnement requises, voir [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).
- **Frontend** : `cd frontend && npm run test` (fichiers `*.vitest.ts` / `*.vitest.tsx` avec Vitest). Les tests existants au format `node:test` (`*.test.ts`) peuvent être lancés avec `node --test` sur les fichiers concernés.

## CI

Le workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) exécute lint, tests et build sur `backend/` et `frontend/` à chaque push ou pull request sur `main` / `master`.

## Déploiement (Vercel)

Détails pas à pas : **[backend/DEPLOY.md](backend/DEPLOY.md)**.

Résumé :

À configurer sur Vercel (entre autres) :

| Variable                                                         | Rôle                                                                              |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Base et auth                                                                      |
| `OPENAI_API_KEY`, `OPENAI_MODEL`                                 | IA (classification, export, templates)                                            |
| `TAVILY_API_KEY`                                                 | Suggestions d’URLs                                                                |
| `CORS_ORIGIN`                                                    | Origines autorisées, **séparées par des virgules** (en prod : ne pas laisser `*`) |
| `NODE_ENV`                                                       | `production` en prod                                                              |

Le pipeline d’analyse s’enregistre avec `waitUntil` ([`@vercel/functions`](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package)) pour laisser le scrape et l’IA se terminer après la réponse HTTP. `maxDuration` est à **60** secondes dans `vercel.json` (ajuster selon le plan Vercel).

Le frontend est une SPA Vite : build classique (`npm run build` dans `frontend/`), hébergement statique ou CDN, avec `VITE_API_URL` pointant vers l’URL du backend si le front et l’API ne sont pas sur la même origine.

---

© 2026 ficheproduct — BETA
