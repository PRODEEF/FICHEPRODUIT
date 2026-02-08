# ficheproduct

**Génère tes fiches produits** en quelques secondes. MVP compatible PrestaShop & Shopify.

## Structure

```
FICHEPRODUIT/
├── index.html          # Structure HTML
├── css/
│   └── style.css       # Styles (variables, composants, responsive)
├── js/
│   ├── data.js         # Données produits (array)
│   └── app.js          # Logique : navigation, analyse, recherche, sélection
├── .gitignore
└── README.md
```

## Développement local

```bash
cd FICHEPRODUIT
npx live-server
```

Ouvre `http://127.0.0.1:8080` (ou le port indiqué).

## Déploiement sur Vercel

Vercel fonctionne avec **GitHub** ou **GitLab**. Voir **DEPLOY.md** pour les commandes détaillées (création du dépôt + push).

En résumé :
1. Crée un dépôt **FICHEPRODUIT** sur [GitHub](https://github.com/new) ou [GitLab](https://gitlab.com/projects/new) (sans README).
2. Pousse le code (`git init`, `git add .`, `git commit`, `git remote add origin`, `git push -u origin main`).
3. Sur [vercel.com](https://vercel.com), connecte-toi avec GitHub ou GitLab, **Add New** → **Project** → importe **FICHEPRODUIT** → **Deploy**.

Chaque `git push` sur `main` déclenche un déploiement automatique. Domaine personnalisé : **Project → Settings → Domains**.

## Récap des fichiers

| Fichier        | Rôle |
|----------------|------|
| `index.html`   | Structure HTML, liens vers CSS/JS |
| `css/style.css`| Variables, reset, composants |
| `js/data.js`   | Tableau des produits (modifiable) |
| `js/app.js`    | Navigation, analyse, recherche, sélection |

---

© 2025 ficheproduct — BETA
