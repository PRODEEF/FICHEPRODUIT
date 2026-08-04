---
name: onboarding
description: >
  Guide d'accueil pour un nouveau développeur sur FicheProduit : setup local, cartographie du repo,
  mode Plan avant implémentation, comment utiliser Cursor efficacement, quels skills et rules consulter.
  Utilise ce skill quand un nouveau dev rejoint l'équipe, pour l'onboarding, le setup initial,
  ou quand l'utilisateur demande comment démarrer sur le projet.
---

# Onboarding — FicheProduit

Guide pour **rejoindre le projet avec peu ou pas d'expérience code**. Cursor écrit le code ; ton rôle est de **décrire précisément** ce que tu veux et de **vérifier** le résultat avant de committer.

Index complet des skills : [../README.md](../README.md)

---

## Jour 1 — Checklist

```
- [ ] Cloner le repo, installer Node.js LTS
- [ ] Lire ce skill + .cursor/rules/400-contributeur.mdc
- [ ] Backend : cd backend && cp .env.example .env (demander les clés à l'équipe)
- [ ] Frontend : cd frontend && cp .env.example .env
- [ ] npm install dans backend/ et frontend/
- [ ] npm run start:dev (backend, port 3000) + npm run dev (frontend, port 5173)
- [ ] Ouvrir http://localhost:5173 — la home doit s'afficher
- [ ] Créer une branche feat/test-onboarding (ne jamais coder sur main)
- [ ] Lire la rule Plan avant code : `.cursor/rules/410-plan-before-code.mdc`
- [ ] Parcourir `.cursor/rules/120-supabase.mdc` si tu touches à la base ou aux imports CSV
```

Variables et déploiement : [README.md](../../../README.md) à la racine, [backend/DEPLOY.md](../../../backend/DEPLOY.md).

---

## Workflow obligatoire : Plan → validation → code

**Ne laisse pas Cursor coder tout de suite.** Pour toute tâche autre qu'une micro-correction, passe d'abord par le **mode Plan**.

### Comment faire dans Cursor

1. Ouvre le chat (Agent ou Composer).
2. Dans le **sélecteur de mode** en haut, choisis **Plan** (à côté de Agent / Ask).
3. Décris ta tâche avec le plus de détails possible (fichiers, comportement, contraintes).
4. Cursor propose un **plan** : fichiers à toucher, étapes, skills à suivre, risques.
5. **Relis le plan**, pose des questions, demande des ajustements si besoin.
6. Quand tu es d'accord, dis explicitement : **« OK, implémente »** ou repasse en mode **Agent**.

### Exemples de prompts Plan

**Feature frontend**

> « Mode Plan : je veux un bandeau "Crédits restants" dans la page Catalog, visible seulement si l'utilisateur est connecté. Indique les fichiers, hooks et appels API avant de coder. »

**Endpoint backend**

> « Mode Plan : ajouter GET /api/catalog/brands (liste distincte). Suis nestjs-repository-pattern. Liste les DTO, repository et tests à écrire. »

**Bug ou comportement flou**

> « Mode Plan : l'export CSV échoue quand je sélectionne 0 produit. Aide-moi à diagnostiquer et propose un plan de fix. »

### Quand le Plan n'est pas nécessaire

| OK sans Plan                                           | Plan recommandé                   |
| ------------------------------------------------------ | --------------------------------- |
| Typo, commentaire                                      | Nouvelle page ou feature          |
| Fix d'une ligne déjà identifiée                        | Nouvel endpoint API               |
| « Applique exactement le plan qu'on vient de valider » | Plusieurs fichiers front + back   |
|                                                        | Toucher billing, auth, ou `core/` |
|                                                        | Tu n'es pas sûr(e) de l'approche  |

Rule associée (agent + humain) : [410-plan-before-code.mdc](../../rules/410-plan-before-code.mdc)

---

## Le produit en une phrase

FicheProduit analyse l'URL d'une boutique e-commerce, détecte le secteur, propose des produits issus de **catalogues fabricants**, et permet l'**export CSV** (PrestaShop notamment).

---

## Cartographie du dépôt

```
FICHEPRODUIT/
├── frontend/          React 19 + Vite + Tailwind — ce que voit l'utilisateur
│   └── src/
│       ├── features/  ← une feature = un domaine métier (auth, catalog, store…)
│       ├── api/       ← appels HTTP vers le backend (consommés par les hooks)
│       ├── shared/    ← UI réutilisable, hooks globaux, lib
│       └── app/       ← router, providers
├── backend/           NestJS 11 + Fastify + Zod + Supabase
│   └── src/
│       ├── domain/    ← modules métier (user, shop, analysis, catalog, billing)
│       ├── feature/   ← orchestration (export CSV, suggest-urls, health)
│       └── core/      ← ⚠️ infrastructure — ne pas modifier sans accord
├── docs/              ← documentation humaine (import CSV, templates)
└── .cursor/
    ├── skills/        ← guides agent (ce dossier)
    ├── rules/         ← règles automatiques Cursor
    └── agents/        ← profils agents backend / frontend
```

### Features frontend actuelles

| Dossier     | Rôle                                                  |
| ----------- | ----------------------------------------------------- |
| `auth`      | Login, signup, profil, vérification email             |
| `landing`   | Page d'accueil marketing                              |
| `catalog`   | Catalogue produits, filtres, export                   |
| `store`     | Configuration boutique (secteur, marques, catégories) |
| `billing`   | Retour Stripe (success/cancel)                        |
| `marketing` | Pages légales, démo, à propos                         |

### Modules backend actuels

| Dossier                | Rôle                               |
| ---------------------- | ---------------------------------- |
| `user`                 | Profil utilisateur                 |
| `shop`                 | Boutique rattachée à l'utilisateur |
| `analysis`             | Pipeline d'analyse du site (IA)    |
| `catalog`              | Recherche produits fabricants      |
| `billing`              | Stripe, crédits, plans             |
| `feature/export`       | Génération CSV PrestaShop          |
| `feature/suggest-urls` | Suggestions d'URLs (Tavily)        |
| `feature/health`       | Healthcheck                        |

---

## Comment parler à Cursor (exemples)

**❌ Trop vague**

> « Ajoute un bouton »

**✅ Précis — Cursor fera moins d'erreurs**

> « Dans `frontend/src/features/catalog/pages/Catalog.tsx`, ajoute un bouton "Exporter" en haut à droite qui appelle `exportSelectedProducts` du hook `useCatalogProductExport` »

**✅ Backend**

> « Ajoute un endpoint GET /api/catalog/brands qui retourne la liste des marques distinctes. Suis le pattern Repository de `catalog.repository.ts` et documente Swagger comme dans `catalog.controller.ts` »

Indique toujours : **fichier**, **comportement attendu**, **skill à suivre** si tu le connais.

---

## Quel skill pour quelle tâche ?

| Tu veux…                                | Skill                                                             |
| --------------------------------------- | ----------------------------------------------------------------- |
| Créer une nouvelle page / feature React | `feature-structure`                                               |
| Bouton, champ, modal                    | `shared-ui-components`                                            |
| Appeler le backend depuis le front      | `frontend-api-client`                                             |
| Formulaire avec validation              | `frontend-validation`                                             |
| Nouvel endpoint NestJS                  | `nestjs` → `nestjs-controllers-dto` + `nestjs-repository-pattern` |
| Tests backend                           | `nestjs-testing`                                                  |
| Billing / Stripe                        | `billing-stripe`                                                  |
| Importer un CSV produits                | `catalog-csv-import`                                              |
| Tâche complète avec PR                  | `work`                                                            |

---

## Stack réelle (à ne pas confondre)

| Couche              | Ce qu'on utilise              | Ce qu'on **n'utilise pas**                 |
| ------------------- | ----------------------------- | ------------------------------------------ |
| Frontend state      | React Context, hooks maison   | TanStack Query, Zustand                    |
| Frontend API        | `src/api/` + `nestHttpClient` | `fetch()` direct dans les composants       |
| Frontend validation | Zod v4 (+ RHF pour l'auth)    | Validation manuelle if/regex               |
| Backend DB          | Supabase JS + RLS             | TypeORM, Prisma                            |
| Backend validation  | Zod + `nestjs-zod`            | class-validator                            |
| OpenAPI             | Généré depuis les DTO Zod     | Fichier OpenAPI séparé en source de vérité |

---

## Workflow Git obligatoire

1. `git checkout main && git pull`
2. `git checkout -b feat/ma-tache`
3. **Mode Plan** → décrire la tâche, valider le plan avec Cursor (voir section « Plan → validation → code »)
4. **Mode Agent** → implémenter seulement après validation
5. Vérifier avant commit :

   ```bash
   cd backend && npm run lint && npm test
   cd frontend && npm run lint && npm run test
   ```

6. Commit en français : `feat: ajouter …` / `fix: corriger …`
7. Push + Pull Request sur GitHub (jamais push direct sur `main`)

Détails : `.cursor/rules/400-contributeur.mdc`

---

## Les 5 interdictions (rappel)

1. **Jamais** de clé API dans le code → uniquement `.env`
2. **Jamais** modifier `backend/src/core/` sans accord
3. **Jamais** push sur `main`
4. **Jamais** supprimer un `*.spec.ts` ou `*.vitest.ts`
5. **Jamais** committer si lint ou tests échouent

---

## Commandes utiles

```bash
# Backend
cd backend && npm run start:dev   # dev
cd backend && npm test            # tests unitaires
cd backend && npm run test:e2e    # e2e (env requis)

# Frontend
cd frontend && npm run dev        # dev
cd frontend && npm run test        # Vitest

# Swagger (backend lancé, hors prod)
# http://localhost:3000/api/docs
```

---

## En cas de blocage

1. Copier l'erreur du terminal et demander à Cursor : « Explique cette erreur et corrige-la »
2. Demander : « Est-ce que cette modification est safe ? »
3. Ouvrir quand même une PR avec tes questions — la relecture est faite pour ça
