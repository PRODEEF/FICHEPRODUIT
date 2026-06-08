# Scraper Duotone Kiteboarding

Script Playwright qui collecte les fiches produit Duotone (section kiteboarding FR) et produit un CSV compatible avec la table Supabase `catalog_products`.

## Installation

```bash
cd scrappers
pip install -r requirements.txt
playwright install chromium
```

Variables d’environnement : aucune (pas d’écriture Supabase).

## Utilisation

```bash
# Lister les URLs sans scraper les fiches (recommandé en premier)
python scrape_duotone.py --dry-run --headed

# Scrape complet → duotone_catalog.csv
python scrape_duotone.py --headed

# Headless (peut échouer si anti-bot)
python scrape_duotone.py
```

Sous Windows, si les emojis/accents posent problème en console :

```powershell
$env:PYTHONIOENCODING="utf-8"
python scrape_duotone.py --dry-run
```

## Périmètre

6 pages catégorie sous `https://www.duotonesports.com/fr/kiteboarding/` :

- `kites`, `planches/twintips`, `planches/surfboards`, `foils`, `bares`, `equipement`

Seules les URLs `/products/duotone-*-{article}` sont conservées (référence `#####-####` en suffixe).

## Fichier de sortie

`duotone_catalog.csv` — colonnes :

| CSV                        | Table `catalog_products`                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `name`                     | `name`                                                                                              |
| `brand`                    | `brand`                                                                                             |
| `sector`                   | `sector`                                                                                            |
| `category`                 | `category`                                                                                          |
| `sub_category`             | `sub_category`                                                                                      |
| `year`                     | `year`                                                                                              |
| `price`                    | `price`                                                                                             |
| `description`              | `description`                                                                                       |
| `images` (JSON array)      | `images` (`text[]`)                                                                                 |
| `url`                      | `url`                                                                                               |
| `attributes` (JSON object) | `attributes` (`jsonb`)                                                                              |
| `detailed_description`     | **non présent** en migration 003 — fusionner dans `description` à l’import ou ajouter une migration |

## Import manuel dans Supabase

1. Table Editor → `catalog_products` → Import CSV
2. Mapper les colonnes ; pour `images` / `attributes`, caster en array / jsonb selon l’outil
3. Éviter les doublons : pas d’index unique sur `url` — filtrer les URLs déjà présentes avant import

## Dépannage

- **0 produit** : relancer avec `--headed`, vérifier la connexion, accepter les cookies dans le navigateur
- **Prix à 0** : normal pour certaines fiches ; la colonne DB est `NOT NULL`, `0.00` est accepté
- **Timeout** : augmenter `DELAY` ou réduire `CONCUR` dans `scrape_duotone.py`
