# Limites actuelles du MVP et solutions

## Ce que fait vraiment l’outil (vision produit)

- **Analyse du site du magasin** : comprendre le **domaine d’activité** du site (kitesurf, vélos, électroménager, mode…), éventuellement extraire les marques déjà présentes et une fiche produit type. L’analyse ne sert **pas** à importer le catalogue du magasin ; elle sert à **adapter ce qu’on lui propose** (quelles marques, quel secteur).

- **Source des fiches produits** : les fiches proposées viennent des **catalogues fabricants** (marques). L’outil permet au magasin d’**enrichir** son site avec des **nouveaux produits** ou des **nouvelles collections** (ex. collection été 2026 en avril), ou à un **nouveau site** de se remplir avec les produits qu’il veut vendre. La source est donc : **catalogues des marques**, pas le site du marchand.

---

## Question 1 : Est-ce que cela fonctionne pour tout type de site e‑commerce ? (électroménager, vélos, etc.)

**Oui sur le principe, mais en pratique seulement pour les secteurs pour lesquels on a des catalogues fabricants en entrée.**

| Élément | Tout type de site (électroménager, vélos, mode…) ? |
|--------|----------------------------------------------------|
| **Analyse du site** | Oui. On peut analyser n’importe quel site (PrestaShop, Shopify, etc.) pour détecter le **domaine d’activité** et adapter les marques à proposer. |
| **Proposition de fiches produits** | Dépend des **catalogues fabricants** qu’on met en entrée. Aujourd’hui on n’a qu’**un seul secteur** : kitesurf (un fichier avec F-One, Duotone, North, etc.). Pour qu’un vendeur d’électroménager ou de vélos en profite, il faut **ajouter des catalogues fabricants** pour ces secteurs (marques d’électroménager, marques de vélos, etc.). |

En résumé : la **logique** (analyser le site → proposer des marques → proposer des fiches à partir de catalogues fabricants) fonctionne pour tout type de site. **Concrètement**, ça “fonctionne” aujourd’hui surtout pour le kitesurf, car c’est le seul secteur pour lequel on a un catalogue fabricants en entrée. Dès qu’on alimente l’outil avec des catalogues fabricants pour l’électroménager, les vélos, la mode, etc., ces secteurs seront couverts de la même façon.

---

## Question 2 : Pourquoi seulement 8 produits (ex. F-One sans critère) ? Limites et solutions

### Raison directe

Les fiches proposées viennent d’**un seul fichier figé** (`js/data.js`) : un **extrait** de catalogues fabricants kitesurf (F-One, Duotone, North, etc.). Dans ce fichier il n’y a qu’**environ 10 produits F-One** (5 Ailes + 5 Planches) et ~37 produits au total. Si tu n’en vois que 8, c’est que 2 sont exclus par un filtre (année, etc.). La limite vient donc du fait que **tout ce qu’on propose** = ce petit extrait, pas le catalogue complet des marques.

### Les limites (pourquoi ces limites)

1. **Un seul secteur en entrée**  
   On n’a qu’un jeu de données “kitesurf”. Pas encore d’entrée pour électroménager, vélos, mode, etc. Donc on ne peut proposer des fiches que pour le kitesurf.

2. **Extrait fabricant, pas catalogue complet**  
   Le fichier actuel est un **échantillon** (ex. 10 refs F-One, 37 au total). Un vrai catalogue F-One (ou toute marque) contient des **centaines** de références : tailles, couleurs, déclinaisons, années. Tant qu’on n’alimente pas l’outil avec les **catalogues complets** des fabricants, le nombre de produits proposés restera ce petit extrait.

3. **Pas de “mise en input des catalogues de tous les produits”**  
   Aujourd’hui aucun flux (fichier, API, CSV) ne remplit l’outil avec les catalogues fabricants. Tout est codé en dur dans un tableau. Pour proposer toute la collection F-One 2026, ou toute la collection été 2026 d’une marque de vêtements, il faut **mettre en entrée** ces catalogues (voir solutions ci‑dessous).

### Solutions pour ne plus avoir ces limites (mettre en input les catalogues fabricants)

Pour que l’outil propose **tous** les produits des marques (nouvelles collections, toutes références) et fonctionne pour **tout** type de site (électroménager, vélos, mode…) :

1. **Alimenter l’outil avec les catalogues fabricants, par secteur et par marque**  
   - Format possible : **CSV**, **API fabricant**, **flux XML** (ex. flux PrestaShop fournisseur), export fournisseur, etc.  
   - Un catalogue = une liste de produits (référence, titre, prix, description, images, marque, catégorie, sous-catégorie, année…) pour une marque donnée (ex. F-One 2026, collection été 2026 d’une marque de mode).

2. **Structurer par secteur et par marque**  
   - Secteurs : kitesurf, électroménager, vélos, mode, etc.  
   - Pour chaque secteur : marques + catalogues (fichiers ou API).  
   - L’**analyse du site** sert à choisir **quel secteur / quelles marques** proposer au magasin ; la **liste des fiches** vient de ces catalogues en entrée.

3. **Résultat attendu**  
   - Pour F-One : des centaines de produits (toute la gamme, tailles, déclinaisons) au lieu de 10.  
   - Pour d’autres secteurs : même logique dès qu’on a les catalogues (électroménager, vélos, mode…).  
   - Les magasins peuvent enrichir leur site avec les **nouveaux produits / nouvelles collections** (ex. été 2026 en avril), ou remplir un **nouveau site** avec les produits qu’ils veulent vendre.

En résumé : les limites viennent du fait qu’on n’a **pas encore mis en input les catalogues complets des fabricants**. Dès qu’on alimente l’outil avec ces catalogues (par secteur et par marque), on lève la limite du nombre de produits (ex. F-One) et on peut couvrir tout type de site e‑commerce (électroménager, vélos, etc.) en fonction des secteurs pour lesquels on a des catalogues.
