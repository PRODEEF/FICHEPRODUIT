# Skills Cursor — FicheProduit

Les **skills** sont des guides que l’agent Cursor lit automatiquement quand ta demande correspond à leur description. Ils complètent les **rules** (`.cursor/rules/`) avec des workflows concrets et des exemples du projet.

> **Nouveau sur le projet ?** Commence par [onboarding/SKILL.md](onboarding/SKILL.md).

---

## Par où commencer

| Situation                                    | Skill à consulter                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Premier jour, setup, comment parler à Cursor | [onboarding](onboarding/SKILL.md)                                                                       |
| **Avant d'implémenter** (mode Plan)          | Rule [410-plan-before-code.mdc](../rules/410-plan-before-code.mdc)                                      |
| Workflow complet (branche → code → PR)       | [work](work/SKILL.md)                                                                                   |
| Modifier une page ou un composant React      | [feature-structure](feature-structure/SKILL.md) + [shared-ui-components](shared-ui-components/SKILL.md) |
| Ajouter un appel API frontend                | [frontend-api-client](frontend-api-client/SKILL.md)                                                     |
| Formulaire ou validation client              | [frontend-validation](frontend-validation/SKILL.md)                                                     |
| Endpoint ou module backend                   | [nestjs](nestjs-backend/nestjs/SKILL.md) → skills spécialisés ci-dessous                                |
| Importer un CSV catalogue Supabase           | [catalog-csv-import](catalog-csv-import/SKILL.md) + rule [120-supabase](../rules/120-supabase.mdc)      |

---

## Catalogue complet

### Général

| Skill                                                   | Rôle                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------- |
| [onboarding](onboarding/SKILL.md)                       | Accueil nouveau dev, setup, **Plan avant code**, cartographie |
| [work](work/SKILL.md)                                   | Orchestration tâche → branche → agents → commit → PR          |
| [project-documentation](project-documentation/SKILL.md) | TSDoc et commentaires en français                             |

### Frontend

| Skill                                                 | Rôle                                  |
| ----------------------------------------------------- | ------------------------------------- |
| [feature-structure](feature-structure/SKILL.md)       | Arborescence `features/<nom>/`        |
| [frontend-api-client](frontend-api-client/SKILL.md)   | `nestHttpClient`, `@types-api`, hooks |
| [frontend-validation](frontend-validation/SKILL.md)   | Zod obligatoire, RHF vs safeParse     |
| [shared-ui-components](shared-ui-components/SKILL.md) | Primitives `@shared/ui`               |

### Backend (dossier `nestjs-backend/`)

| Skill                                                                          | Rôle                                             |
| ------------------------------------------------------------------------------ | ------------------------------------------------ |
| [nestjs](nestjs-backend/nestjs/SKILL.md)                                       | Vue d’ensemble, orientation vers les sous-skills |
| [nestjs-repository-pattern](nestjs-backend/nestjs-repository-pattern/SKILL.md) | Controller → Service → Repository, Supabase RLS  |
| [nestjs-controllers-dto](nestjs-backend/nestjs-controllers-dto/SKILL.md)       | DTO Zod, `createZodDto`, `ZodValidationPipe`     |
| [nestjs-swagger](nestjs-backend/nestjs-swagger/SKILL.md)                       | OpenAPI, `cleanupOpenApiDoc`, `@ApiBearerAuth`   |
| [nestjs-testing](nestjs-backend/nestjs-testing/SKILL.md)                       | Jest, mocks Supabase, e2e Supertest              |
| [billing-stripe](nestjs-backend/billing-stripe/SKILL.md)                       | Checkout, webhooks, crédits, export              |

### Données / ops

| Skill                                             | Rôle                                              |
| ------------------------------------------------- | ------------------------------------------------- |
| [catalog-csv-import](catalog-csv-import/SKILL.md) | Validation CSV `catalog_products` + script Python |

---

## Rules associées (toujours actives)

| Fichier                               | Contenu                                                           |
| ------------------------------------- | ----------------------------------------------------------------- |
| `400-contributeur.mdc`                | Workflow Git, pièges à éviter (lisible sans background technique) |
| `410-plan-before-code.mdc`            | **Plan avant implémentation** — mode Plan si tâche non triviale   |
| `120-supabase.mdc`                    | Migrations SQL, RLS, import CSV catalogue                         |
| `000-general.mdc`                     | TypeScript, commits, secrets, imports                             |
| `100-backend.mdc`                     | NestJS, Zod, Supabase                                             |
| `200-frontend.mdc`                    | React 19, Vite, Tailwind                                          |
| `210-frontend-feature-components.mdc` | Composants feature                                                |
| `211-frontend-form-controls.mdc`      | Champs de formulaire                                              |
| `300-tests.mdc`                       | Obligations de tests                                              |

---

## Agents spécialisés (`.cursor/agents/`)

| Agent               | Usage                 |
| ------------------- | --------------------- |
| `nestjs-backend.md` | Tâches backend NestJS |
| `react-frontend.md` | Tâches frontend React |

Ces agents **doivent** suivre les skills ci-dessus — ne pas s’appuyer sur des patterns génériques (TypeORM, TanStack Query, etc.) absents de ce dépôt.
