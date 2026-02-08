# Enrichissement des catalogues fabricants

## Vision : outil IA / automatique pour alimenter l’app

L’idée est de **lancer un outil** (automatisé, éventuellement assisté IA) qui va **récupérer les infos catalogue** de plusieurs marques sur le web, en les **structurant par secteur et par marque**.

### Secteurs ciblés (dans l’ordre)

1. **Sport de glisse** (kitesurf, surf, snowboard, etc.) — **priorité immédiate**.
2. **Vélo** (VTT, route, urbain, pièces, etc.).

### Sources possibles

- **API fabricant** : quand une marque expose une API catalogue (produits, prix, fiches), on l’appelle et on mappe les données vers notre format.
- **Sites B2B** : portails revendeurs / B2B où les marques mettent leurs catalogues (export, flux, ou pages à parser).
- **Sites publics** : pages catalogue / listing produits des marques (scraping ou extraction structurée). À utiliser en respectant les CGU et le droit (usage raisonnable, pas de surcharge des serveurs).

### Structure cible

- **Par secteur** : `catalogs/kitesurf/`, `catalogs/velo/`, etc.
- **Par marque** : dans chaque secteur, une config (liste de marques + source : URL catalogue, URL API, ou fichier CSV/XML).
- **Fichier de sortie** : par secteur (ex. `catalogs/kitesurf/products.json`) contenant tous les produits normalisés (titre, marque, catégorie, sous-catégorie, année, prix si dispo, image, description, etc.).

---

## Immédiat : focus kitesurf, enrichir la base des principales marques

En premier, on se concentre sur le **kitesurf** et on met en place un **outil d’enrichissement** qui :

1. S’appuie sur une **config des marques** kitesurf et leurs **sources** (URL catalogue, API ou B2B si dispo).
2. **Lance des récupérations** (fetch des pages ou appels API), **parse** le HTML ou le JSON, et **extrait** les produits (nom, lien, image, prix, catégorie…).
3. **Fusionne** le tout dans un fichier **`catalogs/kitesurf/products.json`** au format attendu par l’app.
4. L’app peut ensuite **charger ce fichier** (via une API ou un import) pour afficher un catalogue kitesurf bien plus riche que l’extrait actuel (F-One, Duotone, North, Core, Cabrinha, Naish, Ozone, etc.).

### Marques kitesurf prioritaires (exemples)

- F-One, Duotone, North, Core, Cabrinha, Naish, Ozone, etc.  
Les URLs / APIs sont définies dans **`catalogs/kitesurf/brands.json`** (et éventuellement dans un fichier de config partagé).

### Exécution de l’outil

- **En local** : `node scripts/enrich-kitesurf.js` (après `npm install`).
- **Plus tard** : tâche planifiée (cron, GitHub Action, ou Vercel Cron) pour rafraîchir les catalogues régulièrement (ex. avant chaque nouvelle collection).

---

## Suite : sport de glisse élargi + vélo

- **Sport de glisse** : réutiliser la même logique (config par marque, même format de sortie) pour d’autres sous-secteurs (surf, snowboard, wing, etc.) dans `catalogs/glisse/` ou sous-dossiers par discipline.
- **Vélo** : même principe avec `catalogs/velo/`, marques et sources (API / B2B / pages catalogue) à documenter et ajouter au fur et à mesure.

L’outil d’enrichissement reste **le même** (secteur + marques en config, fetch + parse + merge), seul le contenu de la config et les parsers spécifiques (sélecteurs HTML ou format API) changent par marque / par source.
