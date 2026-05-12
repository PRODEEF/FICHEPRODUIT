# Déploiement

## Backend (NestJS) sur Vercel

1. Projet Vercel pointant sur le dossier **`backend/`** (racine du build = `backend`).
2. **Build** : `npm run build` — sortie dans `dist/`.
3. **Fonction** : l’entrée est [api/index.js](api/index.js), qui charge `dist/serverless.js` après build.
4. **Durée** : [vercel.json](vercel.json) définit `maxDuration` (60 s au moment de la rédaction) pour la fonction `api/index.js`.

### Variables d’environnement

Reprendre la liste de [`.env.example`](.env.example). En production :

- Définir **`CORS_ORIGIN`** avec l’URL exacte du frontend (ou plusieurs origines séparées par des virgules). Éviter `*` avec cookies / credentials.
- Renseigner toutes les clés **Supabase**, **OpenAI** et **Tavily** (obligatoires au démarrage, voir `configuration.ts`).

## Frontend (Vite)

1. Build : `npm ci && npm run build` dans **`frontend/`**.
2. Servir le contenu du répertoire **`dist/`**.
3. **`VITE_API_URL`** : URL publique du backend si le front n’est pas servi derrière le même domaine que l’API (sinon laisser vide et utiliser le même hôte + préfixe `/api` si votre hébergeur le permet).

## CI

Le dépôt inclut [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) pour valider lint, tests et builds sur chaque PR.
