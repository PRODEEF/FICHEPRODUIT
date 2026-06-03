# Déploiement

## Backend (NestJS) sur Vercel

1. Projet Vercel pointant sur le dossier **`backend/`** (racine du build = `backend`).
2. **Framework Preset** : **NestJS** (zero-config Vercel) — détection automatique via [`src/main.ts`](src/main.ts).
3. **Build** : `npm run build` (`nest build`), lancé automatiquement par Vercel.
4. **Entrée** : [`src/main.ts`](src/main.ts) doit importer `@nestjs/core` et appeler `app.listen()` (voir doc [NestJS on Vercel](https://vercel.com/docs/frameworks/backend/nestjs)).
5. **Durée** : [`vercel.json`](vercel.json) définit `maxDuration` (60 s) sur la function générée depuis `src/main.ts`.

### Variables d'environnement

Reprendre la liste de [`.env.example`](.env.example). En production :

- Définir **`CORS_ORIGIN`** avec l'URL exacte du frontend (ou plusieurs origines séparées par des virgules). Éviter `*` avec cookies / credentials.
- Renseigner toutes les clés **Supabase**, **OpenAI** et **Tavily** (obligatoires au démarrage, voir `configuration.ts`).
- **`NODE_ENV`** = `production` sur Vercel (désactive Swagger, restreint les logs).

## Frontend (Vite)

1. Build : `npm ci && npm run build` dans **`frontend/`**.
2. Servir le contenu du répertoire **`dist/`**.
3. **`VITE_API_URL`** : URL publique du backend si le front n'est pas servi derrière le même domaine que l'API.

## CI

Le dépôt inclut [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) pour valider lint, tests et builds sur chaque PR.
