---
name: project-documentation
description: >
  Documentation du code en français pour l'équipe : blocs TSDoc sur les symboles exportés,
  commentaires ciblés sur le non-évident, explication des paramètres lorsque nécessaire.
  Utilise ce skill lors d'une demande explicite de documentation ou lorsque le code manipule
  des flux complexes (auth, règles métier, async, erreurs, cas limites).
paths:
  - "frontend/src/**/*.ts"
  - "frontend/src/**/*.tsx"
  - "backend/src/**/*.ts"
---

# Documentation projet — équipe française

## Relation avec les autres skills

Ce skill complète [.cursor/skills/feature-structure/SKILL.md](.cursor/skills/feature-structure/SKILL.md) : il ne définit pas l'arborescence des features ; il impose où et comment documenter les symboles une fois le code aux bons emplacements.

## Quand appliquer

Applique ce skill dans **l'un** des cas suivants :

1. **Demande explicite** : l'utilisateur demande de documenter, d'expliquer le comportement, ou de détailler des paramètres / retours / erreurs.
2. **Complexité manifeste** : le code n'est pas trivial à lire sans contexte, par exemple :
   - orchestration en plusieurs étapes (workflows, state machines simples mais opaques) ;
   - **async** / promesses imbriquées, annulation, debounce, files d'attente ;
   - **règles métier** ou invariants qui ne se déduisent pas des types ;
   - gestion d'**erreurs** (retry, codes, mapping Supabase/API) ;
   - **guards** multiples ou conditions non évidentes ;
   - cas limites importants pour la sécurité ou l'intégrité des données.

Ne force pas une couche de documentation sur du code déjà auto-explicite via des noms et des types clairs.

## Langue

- **TSDoc** et **commentaires d'explication** : **français** (équipe francophone).
- **Chaînes UI / i18n** : respecter les conventions existantes du projet (clés, fichiers de traduction) ; ne pas renommer des clés ou des contrats d'API sans demande.

## TSDoc pour les symboles exportés

Documente au minimum les **exports publics** : fonctions, types/interfaces partagés, hooks exportés, classes utilitaires.

Contenu attendu :

- **Résumé** : une ligne ; paragraphe supplémentaire seulement si le comportement mérite du contexte métier.
- **`@param`** : pour chaque paramètre dont le rôle n'est pas évident (unions, flags, unités, préconditions, valeurs implicites).
- **`@returns`** : quand la sémantique du retour n'est pas évidente (discriminated unions, sentinelles, « tuple » signifiant plusieurs choses).
- **`@throws` / erreurs** : quand des erreurs métier ou des échecs réseau sont pertinents pour l'appelant.
- **`@example`** : uniquement si un court exemple clarifie un usage non intuitif ; évite les exemples triviaux du type `add(1, 2)`.

Les tags exacts peuvent suivre la convention TSDoc du projet ; l'important est la **clarté en français** et la **couverture des paramètres non évidents**.

## Commentaires inline

Réserve les commentaires **dans le corps** du code à :

- **invariants** et hypothèses (« on suppose que… », « ne pas appeler si… ») ;
- le **pourquoi** d'un choix non standard (workaround, limitation d'une lib) ;
- **cas limites** et pièges (SSR/hydratation, races, timeouts, états concurrents).

Évite de répéter ce que le code ou les types expriment déjà.

## Ce qu'il ne faut pas faire

- Pas de narration **ligne à ligne** du flux évident.
- Pas de duplication systématique des signatures TypeScript dans la prose.
- Pas de **nouveaux fichiers Markdown** de documentation (README par feature, guides) **sauf demande explicite** de l'utilisateur.

## Résumé opérationnel

| Situation                         | Action                                              |
| --------------------------------- | --------------------------------------------------- |
| Export complexe ou demande « doc » | TSDoc FR + `@param` / `@returns` / erreurs si utile |
| Branche ou calcul opaque          | Commentaire court FR (pourquoi / invariant / piège) |
| Code trivial et types clairs      | Pas de bruit documentaire                          |
