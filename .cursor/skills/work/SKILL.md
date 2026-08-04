---
name: work
description: >
  Orchestration end-to-end sur FicheProduit : analyse la tâche, crée une branche, délègue aux agents
  nestjs-backend / react-frontend, commit et ouvre une PR. Utilise quand l'utilisateur décrit une
  feature, un bug fix ou une tâche complète. Pour un nouveau dev, orienter d'abord vers onboarding.
---

# Work on Project — FicheProduit

End-to-end : tâche → branche → implémentation → commit → PR.

> Nouveau sur le projet ? Lire [onboarding/SKILL.md](onboarding/SKILL.md) et [README.md](README.md).

## Step 1: Understand the Task

Parse the user's request to extract:

- **What**: feature, bug fix, refactor, chore
- **Scope**: backend only, frontend only, or full-stack
- **Acceptance criteria**: any specific requirements or constraints mentioned

If the task is ambiguous or missing key details, **ask the user for clarification** before proceeding. Use the `AskQuestion` tool for structured questions when possible.

**Do not guess.** It is always better to ask one good question than to implement the wrong thing.

### Planning for Complex Tasks

If the task is consequential, **switch to Plan mode** before implementing (rule [410-plan-before-code.mdc](../rules/410-plan-before-code.mdc)). Wait for user validation, then continue.

**Skip planning** for small, well-scoped tasks (single-file fix, straightforward CRUD endpoint, simple UI tweak) — see exceptions in the rule.

## Step 2: Prepare the Branch

1. Ensure the base branch is up to date:
   ```bash
   git checkout main && git pull origin main
   ```
2. Create a feature branch:
   ```bash
   git checkout -b <branch-name>
   ```

   - Format: `<type>/<short-slug>` (e.g. `feat/export-pdf`, `fix/login-redirect`)
   - Types: `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`

## Step 3: Understand the Project Structure

| Area     | Path        | Stack                                        | Agent            |
| -------- | ----------- | -------------------------------------------- | ---------------- |
| Backend  | `backend/`  | NestJS, Fastify, TypeScript, Supabase, Zod   | `nestjs-backend` |
| Frontend | `frontend/` | React 19, TypeScript, Tailwind, react-router | `react-frontend` |

**État réel frontend** : Context (`AuthContext`, `BillingContext`), hooks maison, appels API via `src/api/` + `nestHttpClient`. Pas de TanStack Query ni Zustand.

Consulte les skills `.cursor/skills/` (index : [README.md](README.md)) et rules `.cursor/rules/` avant de déléguer.

| Scope           | Skills prioritaires                                              |
| --------------- | ---------------------------------------------------------------- |
| Frontend UI     | `feature-structure`, `shared-ui-components`                      |
| Frontend API    | `frontend-api-client`                                            |
| Frontend forms  | `frontend-validation`                                            |
| Backend module  | `nestjs` → `nestjs-repository-pattern`, `nestjs-controllers-dto` |
| Backend billing | `billing-stripe`                                                 |
| CSV catalogue   | `catalog-csv-import`                                             |

## Step 4: Implement the Work

### Available Agents

| Agent                 | `subagent_type`  | Scope                                                                              |
| --------------------- | ---------------- | ---------------------------------------------------------------------------------- |
| **Backend Engineer**  | `nestjs-backend` | `backend/` — API, services, repositories, DTOs, guards, Supabase, tests            |
| **Frontend Engineer** | `react-frontend` | `frontend/` — composants, pages, Tailwind, hooks, formulaires (RHF + Zod), routing |

When launching an agent, include: task description, acceptance criteria, scope, relevant file paths, **and the skill(s) to follow**.

## Step 4b: Verify Before Commit

Avant commit (obligatoire — surtout pour un nouveau dev) :

```bash
cd backend && npm run lint && npm test
cd frontend && npm run lint && npm run test
```

Ne pas committer si une commande échoue. Corriger d'abord.

### Parallelization

- Full-stack → lancer backend + frontend en parallèle si indépendants
- Max **4 agents** par message ; tâches dépendantes en séquentiel

## Step 5: Commit Changes

1. Review with `git diff` and `git status`
2. Stage relevant changes
3. Commit message en **français**, format Conventional Commits (voir `000-general.mdc`) :

   ```
   feat: ajouter l'endpoint profil utilisateur
   fix: corriger la redirection après login
   ```

   - Préfixes : `feat`, `fix`, `refactor`, `chore`, `test`, `docs`
   - Messages atomiques, jamais `fix`, `wip`, `update`

## Step 6: Create the PR

1. Push :

   ```bash
   git push -u origin HEAD
   ```

2. Create PR with `gh pr create` :
   - **Title** : description concise
   - **Body** : Summary (1–3 bullets) + Test plan
   - Utiliser `.github/pull_request_template.md` s'il existe
   - Ne pas mentionner d'outillage IA dans la PR

3. Return the PR URL to the user.
