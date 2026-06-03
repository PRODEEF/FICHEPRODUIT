# Backend FicheProduit

API NestJS (Fastify) pour l'analyse de boutiques e-commerce, les gabarits produit et l'export CSV.

## Installation

```bash
cp .env.example .env
npm install
```

Renseigner au minimum : `SUPABASE_*`, `OPENAI_API_KEY`, `TAVILY_API_KEY`.

En **production**, `CORS_ORIGIN` doit être une liste d'origines explicites (séparées par des virgules) — `*` est refusé au démarrage.

## Lancer l'application

```bash
# Développement (watch)
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Documentation API (Swagger)

Hors production (`NODE_ENV` ≠ `production`), la doc est générée au démarrage :

**http://localhost:3000/api/docs**

Les schémas proviennent des DTO Zod (`nestjs-zod` + `createZodDto`). Pour un nouvel endpoint, ajouter `@ApiOperation`, `@ApiOkResponse`, etc. sur le contrôleur.

## Tests et qualité

```bash
npm run lint
npm run format:check
npm test
npm run test:e2e
npm run test:cov
```

## Architecture

Voir [ARCHITECTURE.md](./ARCHITECTURE.md) à la racine du dossier `backend` et [../CONTRIBUTING.md](../CONTRIBUTING.md) pour les conventions d'équipe.

## Déploiement

[Vercel et variables d'environnement](./DEPLOY.md)

## Purge des données invité (24 h)

Fonction SQL `public.cleanup_guest_data_older_than(p_hours integer default 24)` — supprime analyses et shops invités plus vieux que 24 h.

```sql
select * from public.cleanup_guest_data_older_than(24);
```

À planifier via Supabase Cron ou job externe.
