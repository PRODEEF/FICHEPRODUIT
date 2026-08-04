---
name: catalog-csv-import
description: >-
  Valide et corrige un CSV d'import catalogue pour la table Supabase catalog_products
  (Excel → CSV UTF-8). Utilise ce skill quand l'utilisateur prépare, corrige ou vérifie
  un CSV catalogue, mentionne import Supabase catalog_products, conversion Excel vers CSV
  fabricant, ou demande de rendre un fichier prêt pour le dashboard Supabase.
---

# Import CSV catalogue (`catalog_products`)

Skill pour **valider, corriger et normaliser** un CSV avant import Supabase.

Documentation humaine complète : [`docs/import-catalog-csv.md`](../../../docs/import-catalog-csv.md)  
Modèle vierge : [`docs/templates/catalog_products_import_template.csv`](../../../docs/templates/catalog_products_import_template.csv)

## Quand appliquer

- L'utilisateur fournit un CSV (ou Excel exporté) à importer dans `catalog_products`.
- Demande de vérifier colonnes, formats JSON, prix, secteurs, références.
- Demande de convertir un tableur Excel en CSV prêt Supabase.

## Workflow agent

```
Task Progress:
- [ ] 1. Lire le fichier source (CSV ou demander export UTF-8 virgule)
- [ ] 2. Exécuter le script de validation
- [ ] 3. Corriger les erreurs bloquantes
- [ ] 4. Normaliser (secteurs, prix, JSON, références)
- [ ] 5. Ré-exécuter validation jusqu'à OK
- [ ] 6. Livrer CSV corrigé + rapport
```

### Étape 1 — Lire le fichier

- CSV attendu : **UTF-8**, délimiteur **`,`**.
- Si Excel `;` : convertir en virgule et ré-encoder UTF-8.
- En-têtes attendus (exactement, snake_case) :

```
name,brand,sector,category,sub_category,year,price,description,detailed_description,images,url,attributes
```

Colonnes auto-générées à **retirer** si présentes : `id`, `created_at`, `updated_at`.

### Étape 2 — Validation automatique

```bash
python .cursor/skills/catalog-csv-import/scripts/validate-catalog-csv.py <chemin.csv>
```

- Exit code `0` = prêt pour import.
- Exit code `1` = erreurs bloquantes à corriger.
- Warnings = corriger si possible (références, secteurs, doublons URL).

### Étape 3 — Règles de correction

| Problème                              | Action                                                               |
| ------------------------------------- | -------------------------------------------------------------------- |
| En-têtes camelCase (`subCategory`)    | Renommer en snake_case                                               |
| Prix `1299,50`                        | → `1299.50` (point décimal)                                          |
| `year` = `0` ou texte                 | Vider si inconnu, sinon entier                                       |
| `images` vide                         | → `[]`                                                               |
| `attributes` vide                     | → `{}` ou ajouter `reference` si connue                              |
| `images` / `attributes` invalides     | Reconstruire JSON valide                                             |
| Guillemets CSV cassés                 | Ré-échapper (`""` dans les champs)                                   |
| Secteur proche d'une valeur canonique | Normaliser (voir liste ci-dessous)                                   |
| `reference` > 64 car. ou JSON-like    | Tronquer / nettoyer ; signaler en warning                            |
| URL dupliquée                         | Signaler ; garder une ligne ou suffixer URL après accord utilisateur |
| HTML / texte avec virgules            | Entourer le champ de `"`                                             |

### Étape 4 — Mapping Excel → colonnes DB

Guide rapide pour aider l'utilisateur sans contexte projet :

| Colonne Excel typique                | → Colonne CSV                               |
| ------------------------------------ | ------------------------------------------- |
| Nom / Produit / Désignation          | `name`                                      |
| Marque / Brand                       | `brand`                                     |
| Secteur                              | `sector`                                    |
| Catégorie                            | `category`                                  |
| Sous-catégorie                       | `sub_category`                              |
| Année / Millésime                    | `year`                                      |
| Prix / PV                            | `price`                                     |
| Description courte                   | `description`                               |
| Description longue / Fiche technique | `detailed_description`                      |
| Image(s) / URL photo                 | `images` (JSON array)                       |
| Lien / URL produit                   | `url`                                       |
| Référence / SKU / Ref                | `attributes.reference`                      |
| Taille(s)                            | `attributes.taille` (virgules si plusieurs) |
| Couleur(s)                           | `attributes.couleur`                        |

### Secteurs canoniques

```
Nautisme, Glisse, Vélo, Outdoor, Montagne, Mode, Maison, Animalerie,
Sport, Jardin, Bricolage, Puériculture, Bijoux, Montres, Gastronomie,
Gaming, Autres
```

Match insensible à la casse ; corriger l'orthographe vers la forme canonique.

### Attributs export PrestaShop

- `attributes.reference` **obligatoire** pour l'export PrestaShop (max 64 car., pas de dump JSON).
- Variantes : `taille` / `size`, `couleur` / `color` — valeurs multiples séparées par `,`.

## Livrables

1. **Fichier corrigé** : `<nom>_supabase_ready.csv` à côté du source ou dans `docs/imports/`.
2. **Rapport markdown** :
   - lignes traitées / rejetées ;
   - corrections appliquées ;
   - warnings restants ;
   - checklist pré-import (voir doc).

## Import Supabase (rappel)

Table **`catalog_products`** → Import CSV → caster `images` en **text[]**, `attributes` en **jsonb**.

## Référence détaillée

Contraintes DB, exemples CSV, pièges Excel : [reference.md](reference.md)
