# Backend

NestJS backend application with Fastify adapter.

## Setup

```bash
cp .env.example .env
npm install
```

## Running

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Documentation OpenAPI / Swagger

### Comportement

En environnement **non production** (`NODE_ENV` ≠ `production`), le document OpenAPI est **généré au démarrage** à partir des routes NestJS (`SwaggerModule.createDocument`) et des métadonnées des contrôleurs (`@ApiTags`, `@ApiOperation`, `@ApiOkResponse`, etc.). Les schémas des DTO **`nestjs-zod`** (`createZodDto`) sont pris en compte ; le document est ensuite passé dans **`cleanupOpenApiDoc`** pour un rendu OpenAPI correct.

- **Swagger UI** : `SwaggerModule.setup('api/docs', …)`.
- En **production**, la route `/api/docs` n’est pas exposée.

Pour détailler un nouvel endpoint : ajouter les décorateurs Swagger sur le contrôleur et utiliser des DTO Zod (`createZodDto`, `.describe()` sur les champs) pour les corps / réponses typées.

### Ouvrir la documentation

1. Démarrer le backend : `npm run start:dev` (ou `start` / `start:prod` selon le besoin).
2. Dans un navigateur : **`http://localhost:<PORT>/api/docs`**
   - `<PORT>` : variable **`PORT`** (voir `.env.example`), défaut **3000**.

Exemple en local : [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

### Spec YAML à la racine du monorepo

Le fichier **`openapi/api.yaml`** (racine du repo) peut toujours servir au script racine `npm run generate:types` (`openapi-typescript`) pour les clients TypeScript ; il n’est plus utilisé pour monter Swagger sur ce backend. Pour le garder aligné avec le code, il faudra le régénérer ou le mettre à jour manuellement (ou ajouter une étape CI qui exporte le JSON OpenAPI depuis Nest).

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

## Purge des données guest (24h)

La migration SQL ajoute la fonction `public.cleanup_guest_data_older_than(p_hours integer default 24)`.

- Elle supprime les `analyses` guest (`user_id IS NULL`) plus vieilles que 24h.
- Elle supprime ensuite les `shops` guest plus vieux que 24h.
- Elle retourne le nombre de lignes supprimées (`deleted_analyses`, `deleted_shops`).

Exemple d'exécution manuelle:

```sql
select * from public.cleanup_guest_data_older_than(24);
```

Planifier cette fonction via cron (Supabase Cron ou job externe) pour appliquer automatiquement la rétention 24h.
