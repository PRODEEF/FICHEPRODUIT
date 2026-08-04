# Importer un catalogue produits dans Supabase (Excel → CSV)

Ce guide explique comment préparer un fichier CSV à importer dans la table **`catalog_products`** via le dashboard Supabase, **sans connaître le code du projet**.

> Pour faire corriger un CSV par Cursor, utilise le skill **`catalog-csv-import`** (voir [`.cursor/skills/catalog-csv-import/SKILL.md`](../.cursor/skills/catalog-csv-import/SKILL.md)).

---

## Vue d’ensemble

| Élément         | Détail                                                                                |
| --------------- | ------------------------------------------------------------------------------------- |
| **Table cible** | `catalog_products`                                                                    |
| **Où importer** | Supabase → Table Editor → `catalog_products` → **Import data from CSV**               |
| **Encodage**    | **UTF-8** obligatoire                                                                 |
| **Séparateur**  | **Virgule** `,` (pas point-virgule)                                                   |
| **Portée**      | Catalogue **global fabricant** — pas de boutique, pas de `shop_id`                    |
| **Droits**      | Import via dashboard Supabase (compte admin) ; l’app ne peut que **lire** cette table |

---

## Étape 1 — Préparer Excel

### Créer la feuille avec ces en-têtes (ligne 1)

Copie exactement ces noms de colonnes, **en minuscules**, **snake_case** :

```
name,brand,sector,category,sub_category,year,price,description,detailed_description,images,url,attributes
```

Un modèle vierge avec exemple est disponible : [`docs/templates/catalog_products_import_template.csv`](templates/catalog_products_import_template.csv).

### Ne pas inclure ces colonnes

Elles sont générées automatiquement par la base :

- `id`
- `created_at`
- `updated_at`

---

## Étape 2 — Remplir chaque colonne

### Colonnes obligatoires

| Colonne    | Type   | Exemple                                       | Règles                                                              |
| ---------- | ------ | --------------------------------------------- | ------------------------------------------------------------------- |
| `name`     | Texte  | `Aile Rebel SLS`                              | Nom commercial du produit                                           |
| `brand`    | Texte  | `Duotone`                                     | Marque exacte (sert au filtrage par boutique)                       |
| `sector`   | Texte  | `Glisse`                                      | Secteur métier — voir [valeurs recommandées](#secteurs-recommandés) |
| `category` | Texte  | `Kitesurf`                                    | Catégorie fabricant                                                 |
| `price`    | Nombre | `1299.50`                                     | Décimal avec `.` ; `0` si prix inconnu                              |
| `url`      | URL    | `https://duotonesports.com/fr/products/rebel` | Lien fiche source ; **doit être unique** dans le lot                |

### Colonnes optionnelles

| Colonne                | Type           | Exemple                                     | Si vide                               |
| ---------------------- | -------------- | ------------------------------------------- | ------------------------------------- |
| `sub_category`         | Texte          | `Ailes kitesurf`                            | Laisser la cellule vide               |
| `year`                 | Entier         | `2024`                                      | Laisser vide (pas `0`)                |
| `description`          | Texte          | `Aile freeride performante`                 | Texte court (~500 car. max conseillé) |
| `detailed_description` | Texte / HTML   | `<p>Fiche technique…</p>`                   | Peut contenir du HTML                 |
| `images`               | JSON (tableau) | `["https://cdn.example/a.jpg"]`             | `[]` ou cellule vide                  |
| `attributes`           | JSON (objet)   | `{"reference":"44260-3012","taille":"9m²"}` | `{}` ou cellule vide                  |

---

## Étape 3 — Formats sensibles (images et attributes)

### `images` — liste d’URLs

Format **JSON tableau** dans une seule cellule :

```json
["https://cdn.example.com/produit-1.jpg", "https://cdn.example.com/produit-2.jpg"]
```

- Chaque URL entre guillemets doubles `"`.
- Pas d’URL = `[]` ou cellule vide.

### `attributes` — caractéristiques libres

Format **JSON objet** : clés et valeurs en **chaînes de caractères**.

```json
{ "reference": "44260-3012", "taille": "9m², 10m²", "couleur": "Rouge", "condition": "Neuf" }
```

#### Clés recommandées

| Clé                  | Obligatoire ?                      | Usage                                                                        |
| -------------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| `reference`          | **Oui** si export PrestaShop prévu | Référence fabricant, max **64 caractères**, sans JSON ni virgules excessives |
| `taille` ou `size`   | Non                                | Variantes taille, séparées par `,` (ex. `S, M, L`)                           |
| `couleur` ou `color` | Non                                | Variantes couleur, séparées par `,`                                          |
| `condition`          | Non                                | Ex. `Neuf`, `Occasion`                                                       |
| Autres clés          | Non                                | Libre (ex. `construction`, `discipline`, `statut`)                           |

> Sans `attributes.reference`, le produit apparaît dans le catalogue mais **l’export vers PrestaShop échouera** pour ce produit.

---

## Secteurs recommandés

Utiliser de préférence l’une de ces valeurs (orthographe exacte) :

`Nautisme`, `Glisse`, `Vélo`, `Outdoor`, `Montagne`, `Mode`, `Maison`, `Animalerie`, `Sport`, `Jardin`, `Bricolage`, `Puériculture`, `Bijoux`, `Montres`, `Gastronomie`, `Gaming`, `Autres`

La base accepte d’autres textes, mais des valeurs hors liste peuvent compliquer le filtrage dans l’app.

---

## Étape 4 — Exporter depuis Excel

1. **Fichier → Enregistrer sous → CSV UTF-8 (délimité par des virgules)**
   - Sur Excel Windows : choisir **CSV UTF-8**, pas « CSV (séparateur point-virgule) ».
2. Ouvrir le CSV dans un éditeur de texte et vérifier :
   - la **première ligne** contient bien les 12 en-têtes ;
   - le séparateur est une **virgule** ;
   - les champs contenant des virgules ou des guillemets sont entourés de `"`.

### Exemple de ligne complète

```csv
name,brand,sector,category,sub_category,year,price,description,detailed_description,images,url,attributes
"Aile Rebel SLS","Duotone","Glisse","Kitesurf","Ailes kitesurf",2024,1299.50,"Aile freeride","<p>Description détaillée</p>","[""https://cdn.example/a.jpg""]","https://duotonesports.com/fr/products/rebel","{""reference"":""44260-3012"",""taille"":""9m²"",""condition"":""Neuf""}"
```

> Dans un CSV, les guillemets à l’intérieur d’un champ sont doublés : `""`.

---

## Étape 5 — Importer dans Supabase

1. Ouvrir le projet Supabase → **Table Editor** → table **`catalog_products`**.
2. Cliquer **Import data from CSV** (ou **Insert → Import from CSV**).
3. Sélectionner le fichier UTF-8.
4. Vérifier le mapping colonnes :
   - `images` → type **text[]** (tableau texte)
   - `attributes` → type **jsonb**
5. Lancer l’import.

### En cas d’erreur d’import

| Erreur fréquente                      | Cause                                     | Correction                                      |
| ------------------------------------- | ----------------------------------------- | ----------------------------------------------- |
| Invalid JSON                          | `images` ou `attributes` mal formés       | Valider le JSON (guillemets, accolades)         |
| Invalid input syntax for type numeric | `price` avec virgule française `1299,50`  | Remplacer par `1299.50`                         |
| null value in column "name"           | Colonne obligatoire vide                  | Remplir ou supprimer la ligne                   |
| Duplicate key / conflit               | Rare (pas de contrainte unique sur `url`) | Vérifier les doublons manuellement avant import |

---

## Checklist avant import

- [ ] 12 colonnes avec les bons noms (`snake_case`)
- [ ] Encodage UTF-8, séparateur virgule
- [ ] Champs obligatoires remplis : `name`, `brand`, `sector`, `category`, `price`, `url`
- [ ] `price` avec point décimal (ex. `99.90`)
- [ ] `year` entier ou vide (pas `0` sauf intention explicite)
- [ ] `images` = JSON tableau valide ou vide
- [ ] `attributes` = JSON objet valide ; `reference` présent si export PrestaShop
- [ ] Pas de doublons évidents sur `url`
- [ ] `brand` cohérente (même orthographe pour une même marque)

---

## Corriger un CSV avec Cursor

1. Placer le CSV dans le projet (ex. `docs/imports/mon-catalogue.csv`).
2. Demander à Cursor :

   > Corrige ce CSV pour l’import Supabase `catalog_products` en suivant le skill **catalog-csv-import**.

3. Cursor valide, corrige et produit un rapport + fichier prêt à importer.

Script de validation en ligne de commande (optionnel) :

```bash
python .cursor/skills/catalog-csv-import/scripts/validate-catalog-csv.py docs/imports/mon-catalogue.csv
```

---

## FAQ

**Faut-il un `shop_id` ?**  
Non. Le catalogue est global. Les boutiques filtrent par `brand` (table `shops`, colonne `brands`).

**Peut-on mettre plusieurs marques dans `brand` ?**  
Non. Une seule marque par ligne.

**Un produit avec plusieurs tailles : une ou plusieurs lignes ?**  
Une seule ligne, avec `attributes.taille` = `"S, M, L"` (l’export PrestaShop génère les combinaisons).

**Prix TTC ou HT ?**  
Le projet stocke un prix catalogue unique ; documenter la convention dans `description` si besoin.

**Limite de lignes ?**  
L’app charge jusqu’à **2500** produits par recherche. Au-delà, scinder par marque ou secteur.
