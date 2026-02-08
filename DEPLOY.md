# Créer le dépôt (GitHub ou GitLab)

Vercel déploie automatiquement depuis **GitHub** ou **GitLab**. Les deux fonctionnent très bien pour ce MVP.

| | GitHub | GitLab |
|---|--------|--------|
| **Popularité** | Très répandu, intégration Vercel par défaut | Très utilisé, Vercel supporte GitLab |
| **Vercel** | Connexion native (Login with GitHub) | Connexion native (Login with GitLab) |
| **Pour ce projet** | ✅ Parfait | ✅ Parfait |

Choisis la plateforme où tu as déjà un compte (ou que tu préfères).

---

## Option A : GitHub

### 1. Créer le dépôt

1. Ouvre : **https://github.com/new**
2. **Repository name** : `FICHEPRODUIT`
3. **Public** — ne coche pas README, .gitignore ni licence
4. **Create repository**

### 2. Pousser le code

Remplace `TON-USERNAME` par ton identifiant GitHub :

```bash
cd "/Users/yannlc/Desktop/DEV PROJET/FICHEPRODUIT"

git init
git add .
git commit -m "Initial commit - MVP ficheproduct"
git branch -M main
git remote add origin https://github.com/TON-USERNAME/FICHEPRODUIT.git
git push -u origin main
```

Auth : si demandé, utilise un **Personal Access Token** : https://github.com/settings/tokens (coche `repo`).

---

## Option B : GitLab

### 1. Créer le projet

1. Ouvre : **https://gitlab.com/projects/new**
2. **Project name** : `FICHEPRODUIT`
3. **Visibility** : Public
4. Décoche **Initialize repository with a README**
5. **Create project**

### 2. Pousser le code

Remplace `TON-USERNAME` par ton identifiant GitLab (ou ton groupe) :

```bash
cd "/Users/yannlc/Desktop/DEV PROJET/FICHEPRODUIT"

git init
git add .
git commit -m "Initial commit - MVP ficheproduct"
git branch -M main
git remote add origin https://gitlab.com/TON-USERNAME/FICHEPRODUIT.git
git push -u origin main
```

Auth : mot de passe GitLab ou **Access Token** : https://gitlab.com/-/user_settings/personal_access_tokens (scope `write_repository`).

---

## Ensuite : Vercel

1. [vercel.com](https://vercel.com) → **Login** avec **GitHub** ou **GitLab**
2. **Add New** → **Project** → importe **FICHEPRODUIT**
3. **Deploy**

Chaque `git push` sur `main` redéploiera le site automatiquement.
