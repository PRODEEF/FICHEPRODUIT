# Architecture backend FicheProduit

## Vue d'ensemble

Le backend suit une organisation en **trois couches** :

```markdown
src/
├── core/ # Infrastructure (Supabase, auth, scraper, config HTTP)
├── domain/ # Métier : CRUD + règles par entité (shop, user, analysis…)
└── feature/ # Orchestration transverse (export CSV, health, suggest-urls)
```

**Règle de dépendance :** `feature/` → `domain/` → `core/`. Jamais l'inverse.

## Glossaire métier

| Terme                          | Description                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| **Shop / boutique**            | Site e-commerce analysé (URL, CMS, secteur, marques).                                       |
| **Analysis / analyse**         | Job d'analyse d'une URL ; statuts `pending` → `running` → `done` / `failed`.                |
| **Guest / invité**             | Utilisateur sans compte ; identifié par `session_id` (cookie `ficheproduct_guest_session`). |
| **Product template / gabarit** | Modèle de champs pour exporter des fiches produit en CSV.                                   |
| **Catalog**                    | Produits fabricants scrappés (lecture seule côté API).                                      |

## Authentification

- **JWT Supabase** : header `Authorization: Bearer <token>`.
- **Invité** : cookie httpOnly ou header `x-session-id` (tests).
- Les **repositories** utilisent `supabase.forUser(token)` (RLS actives) ; le client **admin** est réservé au parcours invité et aux transferts au signup.

## Où modifier quoi

| Besoin                             | Dossier                                                             |
| ---------------------------------- | ------------------------------------------------------------------- |
| Infos boutique                     | `domain/shop/`                                                      |
| Analyse de site                    | `domain/analysis/` (+ pipeline dans `analysis-pipeline.service.ts`) |
| Gabarits produit                   | `domain/product-template/`                                          |
| Export CSV                         | `feature/export/`                                                   |
| Suggestions d'URL                  | `feature/suggest-urls/`                                             |
| Sécurité HTTP (rate limit, Helmet) | `core/http/fastify-security-plugins.ts`                             |
| Politique SSRF scraping            | `core/scraper/scrape-url-policy.ts`                                 |

## API et documentation

- Préfixe manuel `api/` sur chaque contrôleur (pas de `setGlobalPrefix` global).
- **Swagger** (dev) : `http://localhost:3000/api/docs` après `npm run start:dev`.
- Messages d'erreur exposés au client : **français** (exceptions NestJS dans services/contrôleurs).

## Dette technique connue (hors scope actuel)

- Module `product-template` : `sub-services/` (scrape/refine), fichier `scrape-fields.service.ts` volumineux — refacto structurelle prévue séparément.
- `openapi/api.yaml` à la racine du monorepo peut être désynchronisé du Swagger live.

## Déploiement

Voir [DEPLOY.md](./DEPLOY.md) et [README.md](./README.md).
