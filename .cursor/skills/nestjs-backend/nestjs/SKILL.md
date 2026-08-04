---
name: nestjs
description: >
  Skill principal NestJS (TypeScript). Consulte ce skill dès qu'on travaille sur le backend NestJS :
  création d'un module, d'un endpoint, un service, un repository, un DTO, ou toute question
  sur l'architecture, les conventions, ou les bonnes pratiques. Oriente vers les skills spécialisés
  selon le besoin. Stack : NestJS, TypeScript, Zod + nestjs-zod (validation + OpenAPI), Supabase JS.
  REST endpoints, controllers, repositories.
paths:
  - "backend/**/*.ts"
---

# NestJS — Conventions & Vue d'ensemble (FicheProduit)

## Source de vérité — validation et OpenAPI

**Un seul flux** : schémas Zod → classes DTO avec `createZodDto(nestjs-zod)` → validation runtime via `ZodValidationPipe` (provider `APP_PIPE` dans `AppModule`), documentée dans Swagger avec `@nestjs/swagger`, document OpenAPI post-traité par `cleanupOpenApiDoc()`. Voir skills `nestjs-controllers-dto` et `nestjs-swagger`.

---

## Stack technique

| Couche          | Outil                                                    |
| --------------- | -------------------------------------------------------- |
| Framework       | NestJS + Fastify (TypeScript strict)                     |
| Validation      | Zod + `nestjs-zod` (`createZodDto`, `ZodValidationPipe`) |
| OpenAPI         | `@nestjs/swagger` + `nestjs-zod` (`cleanupOpenApiDoc`)   |
| Base de données | Supabase via `@supabase/supabase-js`                     |
| Pattern         | REST — Controller → Service → Repository                 |

---

## Organisation globale de `backend/src/`

```
src/
├── core/                        # Infrastructure partagée — ne pas modifier sans validation
│   ├── supabase/                # SupabaseModule @Global
│   ├── auth/                    # JwtGuard, OptionalJwtGuard, @CurrentUser
│   ├── config/                  # configuration.ts (seul accès process.env)
│   └── scraper/                 # SiteScraperService
│
├── domain/                      # Modules métier — Controller / Service / Repository
│   ├── user/
│   ├── shop/
│   ├── analysis/
│   ├── catalog/
│   └── billing/                 # Stripe, crédits, webhooks
│
├── feature/                     # Orchestration transverse — pas de Repository direct
│   ├── suggest-urls/
│   ├── export/
│   └── health/
│
├── test-utils/                  # Mocks partagés (ex. supabase-query.mock.ts)
└── app.module.ts
```

**Règle de dépendance** : `feature/` → `domain/` → `core/`. Jamais l'inverse.

> Pour l'architecture détaillée (entités, guards, mappers, billing) → skill **`nestjs-repository-pattern`** (commencer ici pour tout nouveau module domaine).

---

## Structure d'un module domaine type

```
src/domain/shop/
├── shop.module.ts
├── shop.controller.ts
├── shop.service.ts
├── shop.repository.interface.ts   # Interface + Symbol (SHOP_REPOSITORY)
├── shop.repository.ts           # Implémentation Supabase + toEntity/toRow
├── dto/
│   ├── create-shop.dto.ts
│   └── shop-response.dto.ts
└── types/
    └── shop.types.ts
```

Les modules `feature/` (export, suggest-urls) n'ont pas forcément de Repository — ils orchestrent des Services domaine.

---

## Flux d'une requête

```
HTTP Request
    → Controller        (DTO Zod ; délègue ; @CurrentUser)
    → Service           (logique métier, ownership)
    → Repository        (Supabase via forUser(accessToken) ou admin)
    → Supabase Client
```

Chaque couche a **une seule responsabilité**. Le Controller ne connaît pas Supabase. Le Repository ne contient pas de logique métier.

---

## Conventions de nommage

| Élément       | Convention           | Exemple            |
| ------------- | -------------------- | ------------------ |
| Fichiers      | kebab-case           | `shop.service.ts`  |
| Classes       | PascalCase           | `ShopService`      |
| Méthodes      | camelCase            | `findById`         |
| DTOs          | PascalCase + suffixe | `CreateShopDto`    |
| Schémas Zod   | camelCase + Schema   | `createShopSchema` |
| Repository    | Symbol SCREAMING     | `SHOP_REPOSITORY`  |
| Variables env | SCREAMING_SNAKE      | `SUPABASE_URL`     |

---

## Skills spécialisés — quand les consulter

| Besoin                                                | Skill à lire                |
| ----------------------------------------------------- | --------------------------- |
| Architecture domain/feature, Repository, Supabase RLS | `nestjs-repository-pattern` |
| Créer un Controller, un DTO, valider avec Zod         | `nestjs-controllers-dto`    |
| Documenter l'API avec Swagger/OpenAPI                 | `nestjs-swagger`            |
| Écrire des tests Jest (unit) ou Supertest (e2e)       | `nestjs-testing`            |
| Billing Stripe, crédits, webhooks                     | `billing-stripe`            |

Règles complémentaires dans `.cursor/rules/100-backend.mdc` et `300-tests.mdc`.

Index skills : [../../README.md](../../README.md) · Onboarding : [../../onboarding/SKILL.md](../../onboarding/SKILL.md)

---

## Principe directeur : pas d'overengineering

- Ajoute une abstraction seulement si elle résout un problème réel.
- Un module `feature/` simple peut n'avoir qu'un Controller + Service.
- Préfère les DTO dérivés d'un schéma Zod (`createZodDto`) plutôt que des types dupliqués.
- Évite les décorateurs custom sauf si la logique est réutilisée 3+ fois.

---

## Ce qu'on évite (anti-patterns)

- ❌ Logique métier dans le Controller
- ❌ Appels Supabase directs dans le Service (passer par le Repository)
- ❌ Modifier `backend/src/core/` sans validation explicite
- ❌ DTOs avec `any`
- ❌ Injection du Repository concret — toujours interface + Symbol
- ❌ `try/catch` dans chaque méthode — utiliser un ExceptionFilter global
