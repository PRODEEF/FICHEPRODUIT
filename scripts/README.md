# Scripts d'enrichissement catalogues

## Kitesurf

Enrichit le catalogue kitesurf à partir des URLs configurées dans `catalogs/kitesurf/brands.json`.

**Prérequis :** Node 18+ et dépendances installées à la racine du projet.

```bash
cd "/chemin/vers/FICHEPRODUIT"
npm install
npm run enrich:kitesurf
```

Résultat : génération de `catalogs/kitesurf/products.json`. L’app (ou l’API `/api/catalog?section=kitesurf`) utilisera ce fichier s’il existe et contient des produits ; sinon elle garde le catalogue statique de `js/data.js`.

Pour ajouter des marques ou des URLs : éditer `catalogs/kitesurf/brands.json`.
