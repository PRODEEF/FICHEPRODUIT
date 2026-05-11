# TODO — Fiches produits exemples

## 1. ✅ Vérif RLS (Row Level Security)

- [ ] Auditer toutes les tables concernées par les fiches exemples
- [x] Vérifier que les politiques RLS permettent la lecture publique (ou par rôle approprié)
- [ ] Tester les requêtes en mode anon vs authenticated
- [ ] Vérifier cohérence RLS entre tables liées (produits, marques, catégories, analyses)

---

## 2. 🖊️ Modif wording

- [x] Revoir le titre de la section (ex: "Exemples de fiches par marque")
- [x] Revoir le sous-titre explicatif (ton, longueur, clarté)
- [ ] Vérifier tous les labels des filtres (MARQUE, ANNÉE, CATÉGORIE, SOUS-CATÉGORIE)
- [x] Harmoniser les placeholders (ex: "Marque, catégorie, titre...")

---

## 3. 🔧 Modif filtres + ajout titres

- [x] Ajouter un titre/label au-dessus de chaque filtre (déjà présent pour certains, vérifier cohérence)
- [x] Vérifier l'ordre des filtres (Recherche → Marque → Année → Catégorie → Sous-catégorie)
- [x] S'assurer que les dropdowns sont bien liés aux données réelles
- [x] Ajouter filtre **Prix min / Prix max** (voir section 4)
- [x] Vérifier comportement des filtres combinés (AND entre tous)
- [x] Gérer l'état "Toutes" (valeur nulle / reset)

---

## 4. 💰 Ajout filtres prix (min / max)

- [x] Ajouter deux inputs numériques : Prix min et Prix max
- [x] Ajouter les labels au-dessus ("PRIX MIN", "PRIX MAX")
- [x] Brancher sur le champ prix dans la query (vérif nom du champ en BDD)
- [x] Gérer les cas : min vide, max vide, min > max
- [x] Décider du format : €, arrondi, placeholder ("0 €", "999 €")

---

## 5. 🐛 Debug — Analyse qui fait de la merde

- [ ] Reproduire le bug / identifier le cas qui échoue
- [ ] Vérifier les logs côté API / Supabase
- [ ] Vérifier les prompts envoyés au modèle d'analyse
- [ ] Vérifier la structure de la réponse parsée (JSON attendu vs reçu)
- [x] Vérifier les RLS sur la table `analyses` (lié à todo #1 ?)
- [ ] Check timeouts ou erreurs silencieuses
- [ ] Ajouter logs/erreurs visibles en dev pour faciliter le debug

## 6. Autres

- [x] Remettre exporter sur le catalog
