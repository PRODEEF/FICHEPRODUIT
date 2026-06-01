# Contribuer à FicheProduit

## Prérequis

- Node.js 22+
- Compte Supabase + clés API (OpenAI, Tavily) pour le backend

## Démarrage rapide

```bash
# Racine ou backend
cd backend
cp .env.example .env
npm install
npm run start:dev
```

- API : `http://localhost:3000`
- Swagger (hors production) : `http://localhost:3000/api/docs`

## Commandes backend

| Commande               | Rôle                            |
| ---------------------- | ------------------------------- |
| `npm run lint`         | ESLint (0 warning toléré en CI) |
| `npm run format`       | Prettier (écriture)             |
| `npm run format:check` | Prettier (vérification CI)      |
| `npm test`             | Tests unitaires Jest            |
| `npm run test:e2e`     | Tests e2e (Fastify `inject`)    |
| `npm run test:cov`     | Couverture                      |
| `npm run build`        | Compilation NestJS              |

## Conventions

1. **Messages API** destinés au frontend : en **français** (`NotFoundException`, `BadRequestException`, etc.).
2. **Logs serveur** : peuvent rester en anglais ou français ; ne pas exposer les détails Supabase dans les réponses 500.
3. **Nouvel endpoint** : copier un contrôleur existant du même domaine, décorateurs Swagger (`@ApiOperation` en français), DTO Zod via `createZodDto`.
4. **Données** : pattern Repository (`I*Repository` + Symbol), pas d'appel direct à Supabase dans les services.
5. **Auth** : `@UseGuards(JwtGuard)` ou `OptionalJwtGuard` + `@CurrentUser()` pour les routes utilisateur.

## Tests

- Priorité : services métier et repositories (mocks Supabase via `src/test-utils/supabase-query.mock.ts`).
- E2e : `backend/test/*.e2e-spec.ts` — mocker les repositories ou services lourds (IA, scraping).

## Pull requests

- La CI exécute lint, format, tests unitaires, e2e et build backend + frontend.
- Décrire le « pourquoi » dans la PR ; joindre un plan de test manuel si pas de test auto.
