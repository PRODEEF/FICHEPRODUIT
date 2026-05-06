# ficheproduct

**Génère tes fiches produits grace à l'IA** en quelques secondes. MVP compatible PrestaShop & Shopify.

## Structure

```
FICHEPRODUIT/
├── fiche-produit-front/    # Front React + TypeScript (Vite)
│   ├── src/
│   │   ├── App.tsx         # Composition racine (hooks + composants)
│   │   ├── components/     # UI par responsabilité (layout, gate, search…)
│   │   ├── domain/         # Logique pure (filtres, animation analyse)
│   │   ├── hooks/          # État et effets réutilisables
│   │   ├── lib/            # API client, stockage template, utilitaires
│   │   ├── types/          # Types TypeScript
│   │   ├── data/fallbackProducts.json
│   │   └── index.css
│   └── vite.config.ts      # Proxy /api → localhost:3000 en dev
├── api/
│   ├── analyze.js          # Serverless : analyse d’un site (URL, CMS, sitemap…)
│   └── suggest-urls.js     # Serverless : suggestions d’URLs à analyser
├── package.json
├── .gitignore
├── DEPLOY.md
└── README.md
```

L’ancienne entrée statique (`index.html`, `js/`, `css/`) a été **supprimée** au profit du front React.

## Développement local

### API (`/api/*`)

Les routes `/api/analyze` et `/api/suggest-urls` sont des fonctions [Vercel](https://vercel.com/docs/functions).

```bash
cd FICHEPRODUIT
npm install
npm run dev
```

Ouvre l’URL indiquée (souvent **http://localhost:3000**). La première fois, `vercel login` peut être nécessaire.

### Front React

```bash
cd fiche-produit-front
npm install
npm run dev
```

UI souvent sur **http://localhost:5173**, avec proxy `/api` vers **http://127.0.0.1:3000** (voir [`fiche-produit-front/vite.config.ts`](fiche-produit-front/vite.config.ts)). Sans API, le front utilise le JSON de secours et l’analyse **démo**.

Build : `cd fiche-produit-front && npm run build` → `dist/`.

## Déploiement sur Vercel

Voir **DEPLOY.md**. Chaque push sur `main` peut déclencher un déploiement. Pour le build SPA + `api/`, configure le répertoire de sortie du front et les réécritures si tout est dans le même projet.

## Récap des rôles

| Zone                      | Rôle                                                                        |
| ------------------------- | --------------------------------------------------------------------------- |
| `fiche-produit-front/src` | Application React (clean architecture légère : domain / hooks / components) |
| `api/*.js`                | Analyse site et suggestions d’URLs (Vercel Functions)                       |

---

© 2026 ficheproduct — BETA
