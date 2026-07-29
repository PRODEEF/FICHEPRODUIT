# Déploiement

## Checklist go-live (Production Vercel)

À valider **avant** d’ouvrir le trafic public :

### Backend (projet Vercel `backend/`)

| Variable | Obligatoire | Valeur attendue |
| -------- | ----------- | --------------- |
| `NODE_ENV` | Oui | `production` (échoue au boot si `VERCEL_ENV=production` et autre valeur) |
| `CORS_ORIGIN` | Oui | URL exacte du frontend (virgules si plusieurs). Jamais `*` |
| `TRUST_PROXY` | Oui | `true` sur Vercel |
| `SUPABASE_URL` | Oui | Projet Supabase prod |
| `SUPABASE_ANON_KEY` | Oui | Clé anon prod |
| `SUPABASE_SERVICE_ROLE_KEY` | Oui | Clé service_role prod (jamais côté front) |
| `OPENAI_API_KEY` | Oui | Clé OpenAI |
| `OPENAI_MODEL` | Non | Défaut `gpt-4o-mini` |
| `TAVILY_API_KEY` | Oui | Clé Tavily |
| `STRIPE_SECRET_KEY` | Si billing | `sk_live_...` en prod |
| `STRIPE_WEBHOOK_SECRET` | Si billing | Secret du endpoint webhook prod |
| `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL` | Si billing | URLs frontend prod |
| `STRIPE_PRICE_PLATINUM` | Si billing | Price ID Stripe prod |

### Frontend (projet Vercel `frontend/`)

| Variable | Obligatoire | Valeur attendue |
| -------- | ----------- | --------------- |
| `VITE_SUPABASE_URL` | Oui | Même projet Supabase que le backend |
| `VITE_SUPABASE_ANON_KEY` | Oui | Clé anon (publique) |
| `VITE_API_URL` | Oui si cross-origin | URL publique du backend, sans slash final |
| `VITE_SITE_URL` | Recommandé | URL publique du frontend (redirects auth) |
| `VITE_CONTACT_EMAIL` | Non | Email affiché pricing / contact |

### Après déploiement

1. Appliquer les migrations Supabase sur la base prod (`supabase db push` ou SQL Editor).
2. Vérifier `GET https://<backend>/health` → **200** et `"status":"ok"`.
3. Configurer un moniteur uptime externe sur `/health` (alerte si ≠ 200).
4. Stripe : webhook pointant vers `https://<backend>/api/billing/webhook` (ou chemin documenté), events checkout/subscription.
5. Tester manuellement : signup, analyse, export PrestaShop, checkout billing.
6. Confirmer le job cron `cleanup-guest-data-hourly` (migration `20240021_…`).

Liste complète des variables : [`.env.example`](.env.example) (backend) et [`../frontend/.env.example`](../frontend/.env.example).

---

## Backend (NestJS) sur Vercel

1. Projet Vercel pointant sur le dossier **`backend/`** (racine du build = `backend`).
2. **Framework Preset** : **NestJS** (zero-config Vercel) — détection automatique via [`src/main.ts`](src/main.ts).
3. **Build** : `npm run build` (`nest build`), lancé automatiquement par Vercel.
4. **Entrée** : [`src/main.ts`](src/main.ts) doit importer `@nestjs/core` et appeler `app.listen()` (voir doc [NestJS on Vercel](https://vercel.com/docs/frameworks/backend/nestjs)).
5. **Durée** : NestJS zero-config n’accepte pas `functions["src/main.ts"].maxDuration` dans `vercel.json` (erreur `unmatched-function-pattern`). Régler **Settings → Functions → Max Duration** (ex. 60 s) sur le projet Vercel backend, selon le plan.

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
- **`NODE_ENV`** = `production` sur Vercel (désactive Swagger, restreint les logs). Si `VERCEL_ENV=production` sans `NODE_ENV=production`, le boot échoue volontairement.
- **`TRUST_PROXY=true`** sur Vercel (ou derrière nginx) pour que le rate-limit utilise `X-Forwarded-For` ; sinon seule l’IP socket est prise en compte.

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

## Observabilité

### Health check

- Endpoint : `GET /health`
- **200** + `"status":"ok"` si la DB répond
- **503** + `"status":"degraded"` si Supabase est indisponible

Configurer un moniteur uptime (Better Stack, Checkly, UptimeRobot, Vercel Monitoring, etc.) :

1. URL : `https://<backend-prod>/health`
2. Intervalle : 1–5 minutes
3. Alerte si status HTTP ≠ 200 ou timeout
4. Canal : email / Slack de l’équipe

### Logs

- En production NestJS n’émet que `error` et `warn` (voir `main.ts`).
- Les tâches background (analyse IA) loguent un `warn` en cas d’échec (`scheduleBackgroundWork`).
- Les logs Vercel (Runtime Logs) suffisent pour démarrer ; intégrer Sentry (ou équivalent) quand le volume d’incidents le justifie :

```bash
# Backend (exemple)
# npm install @sentry/node
# Définir SENTRY_DSN dans les variables Vercel, initialiser dans main.ts / create-nest-app.ts
```

Tant que Sentry n’est pas branché : s’appuyer sur le moniteur `/health` + alertes Vercel (failed deployments, function errors).

## Migrations Supabase

Les SQL versionnés sont dans [`../supabase/migrations/`](../supabase/migrations/).

```bash
# Depuis la racine du dépôt, avec le CLI Supabase lié au projet prod
supabase db push
```

Ou coller les fichiers non appliqués dans le **SQL Editor** du dashboard Supabase (dans l’ordre chronologique des préfixes `202400…`).

La migration `20240021_schedule_guest_cleanup_cron.sql` active **pg_cron** pour appeler `cleanup_guest_data_older_than(24)` chaque heure.

## CI

Le dépôt inclut [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) pour valider lint, format, tests unitaires, e2e backend, audit npm et builds sur chaque PR.
