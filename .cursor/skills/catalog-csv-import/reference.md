# Référence — import `catalog_products`

Source de vérité schéma : `supabase/migrations/20240003_create_catalog_products.sql`

## Schéma PostgreSQL

| Colonne                | Type PG       | NOT NULL | Default             |
| ---------------------- | ------------- | -------- | ------------------- |
| `id`                   | UUID          | oui      | `gen_random_uuid()` |
| `name`                 | TEXT          | oui      | —                   |
| `brand`                | TEXT          | oui      | —                   |
| `sector`               | TEXT          | oui      | —                   |
| `category`             | TEXT          | oui      | —                   |
| `sub_category`         | TEXT          | non      | —                   |
| `year`                 | SMALLINT      | non      | —                   |
| `price`                | NUMERIC(12,2) | oui      | —                   |
| `description`          | TEXT          | non      | —                   |
| `detailed_description` | TEXT          | non      | —                   |
| `images`               | TEXT[]        | oui      | `'{}'`              |
| `url`                  | TEXT          | oui      | —                   |
| `attributes`           | JSONB         | oui      | `'{}'`              |
| `created_at`           | TIMESTAMPTZ   | oui      | `now()`             |
| `updated_at`           | TIMESTAMPTZ   | oui      | `now()`             |

Pas de FK, pas de `shop_id`. RLS : SELECT seulement pour l'app.

## Comportement applicatif (post-import)

| Champ DB null/vide          | Affichage API |
| --------------------------- | ------------- |
| `year` null                 | `0`           |
| `description` null          | `""`          |
| `detailed_description` null | `""`          |
| `sub_category` null         | `null`        |
| `attributes` invalide       | `{}`          |

## Format CSV Supabase

### Encodage et délimiteur

- UTF-8 avec ou sans BOM (préférer UTF-8 sans BOM).
- Virgule `,` comme séparateur de champs.
- Fin de ligne LF ou CRLF acceptée.

### Échappement CSV (RFC 4180)

- Champ contenant virgule, guillemet ou saut de ligne → entouré de `"`.
- Guillemet literal dans un champ → doublé `""`.

### Colonnes JSON dans CSV

Supabase interprète la cellule comme JSON puis cast vers `text[]` / `jsonb`.

**images** (text[]) :

```json
["https://a.jpg", "https://b.jpg"]
```

**attributes** (jsonb) — valeurs string uniquement :

```json
{ "reference": "SKU-1", "taille": "S,M,L", "couleur": "Noir", "condition": "Neuf" }
```

## Validation `reference` (export PrestaShop)

Règles dans `backend/src/feature/export/prestashop/prestashop-reference.ts` :

- Longueur 1–64 caractères.
- Rejette si contient `{"` ou `Choose your region`.
- Max 5 virgules dans la référence.
- Doublons dans une sélection export → suffixe UUID auto (pas bloquant à l'import).

## Constantes limites

| Limite                  | Valeur | Fichier                                                                |
| ----------------------- | ------ | ---------------------------------------------------------------------- |
| Recherche catalogue max | 2500   | `backend/src/domain/catalog/catalog.constants.ts`                      |
| Export PrestaShop max   | 1000   | `backend/src/feature/export/prestashop/prestashop-export.constants.ts` |

## Exemples de lignes valides

### Produit minimal

```csv
name,brand,sector,category,sub_category,year,price,description,detailed_description,images,url,attributes
"Produit Test","MaMarque","Sport","Cat A","","",10.00,"","","[]","https://example.com/p1","{""reference"":""REF-001""}"
```

### Produit complet avec variantes

```csv
name,brand,sector,category,sub_category,year,price,description,detailed_description,images,url,attributes
"Veste Alpine","OutdoorCo","Outdoor","Vêtements","Vestes",2025,249.99,"Veste imperméable","<ul><li>Gore-Tex</li></ul>","[""https://cdn.example/v1.jpg"",""https://cdn.example/v2.jpg""]","https://example.com/veste-alpine","{""reference"":""OC-VEST-2025"",""taille"":""S, M, L, XL"",""couleur"":""Noir, Bleu"",""condition"":""Neuf""}"
```

## Pièges Excel (France)

| Piège                      | Symptôme                       | Solution                                                |
| -------------------------- | ------------------------------ | ------------------------------------------------------- |
| CSV séparateur `;`         | Colonnes fusionnées à l'import | Exporter « CSV UTF-8 (virgule) » ou remplacer `;` → `,` |
| Prix formaté `1 299,50 €`  | Erreur numeric                 | Nettoyer : `1299.50`                                    |
| Dates Excel serial (45231) | `year` invalide                | Convertir en année 4 chiffres                           |
| Retours ligne dans cellule | Ligne CSV cassée               | Garder les `"` autour du champ                          |
| Formule `=HYPERLINK(...)`  | URL invalide                   | Coller la valeur URL seule                              |
| Smart quotes `“` `”`       | JSON invalide                  | Remplacer par `"` ASCII                                 |

## Dédoublonnage

Pas de contrainte UNIQUE sur `url` en base. Avant import :

- détecter les `url` identiques ;
- fusionner ou supprimer les doublons selon consigne utilisateur.

## Filtre boutique (contexte)

Les boutiques (`shops.brands`) filtrent le catalogue par `brand` (ilike, insensible casse).  
Utiliser la **même orthographe** de marque que dans `shops.brands` pour que les produits apparaissent.
