# Déploiement

## Backend (NestJS) sur Vercel

1. Projet Vercel pointant sur le dossier **`backend/`** (racine du build = `backend`).
2. **Framework Preset** : **NestJS** (zero-config Vercel) — détection automatique via [`src/main.ts`](src/main.ts).
3. **Build** : `npm run build` (`nest build`), lancé automatiquement par Vercel.
4. **Entrée** : [`src/main.ts`](src/main.ts) doit importer `@nestjs/core` et appeler `app.listen()` (voir doc [NestJS on Vercel](https://vercel.com/docs/frameworks/backend/nestjs)).
5. **Durée** : [`vercel.json`](vercel.json) définit `maxDuration` (60 s) sur la function générée depuis `src/main.ts`.

### Deployment Protection (preview cross-origin)

Si le front et le backend sont sur **deux projets Vercel** (origines différentes), le navigateur envoie un preflight `OPTIONS` vers l’API. Avec **Vercel Authentication** active sur les previews backend, ce preflight reçoit un **401 HTML** (cookie `_vercel_sso_nonce`) **avant** NestJS — le navigateur affiche alors une erreur CORS.

**Correctif (dashboard Vercel, projet backend)** :

1. **Settings → Deployment Protection** (ou **Security → Deployment Protection**)
2. Vérifier aussi **Team Settings → Security** (une règle d’équipe peut overrider le projet)
3. Appliquer la protection SSO **uniquement en Production**, pas en **Preview**

**Vérification** après changement :

```bash
curl -i -X OPTIONS "https://VOTRE-BACKEND-PREVIEW.vercel.app/api/suggest-urls" \
  -H "Origin: https://VOTRE-FRONT-PREVIEW.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization"
```

Attendu : **204** + en-têtes `access-control-allow-origin` (pas 401 HTML).

### Variables d'environnement

Reprendre la liste de [`.env.example`](.env.example). En production :

- Définir **`CORS_ORIGIN`** avec l'URL exacte du frontend (ou plusieurs origines séparées par des virgules). Éviter `*` avec cookies / credentials.
- Renseigner toutes les clés **Supabase**, **OpenAI** et **Tavily** (obligatoires au démarrage, voir `configuration.ts`).
- **`NODE_ENV`** = `production` sur Vercel (désactive Swagger, restreint les logs).

**CORS en preview** : Vercel expose `VERCEL_ENV=preview`. Le backend autorise alors automatiquement les origines `*.vercel.app` et `localhost` en plus de `CORS_ORIGIN` (voir [`cors-origin.ts`](src/core/http/cors-origin.ts)).

## Frontend (Vite)

1. Build : `npm ci && npm run build` dans **`frontend/`**.
2. Servir le contenu du répertoire **`dist/`**.
3. **`VITE_API_URL`** : URL publique du backend si le front n'est pas servi derrière le même domaine que l'API.

### Preview Vercel (front + back séparés)

Sur le projet **frontend**, définir **`VITE_API_URL`** pour l’environnement **Preview** :

- Valeur : URL publique du déploiement backend preview (ex. `https://ficheproduit-backend-xxx.vercel.app`, sans slash final).
- Si le front preview appelle le backend **production**, s’assurer que `CORS_ORIGIN` côté backend prod inclut l’origine preview ou utiliser le backend preview correspondant.

Sans `VITE_API_URL`, le front tente des URLs relatives `/api/...` (même origine) — cela ne fonctionne pas quand l’API est sur un autre projet Vercel.

## CI

Le dépôt inclut [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) pour valider lint, tests et builds sur chaque PR.
