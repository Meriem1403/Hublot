# 1️⃣ Architecture de déploiement

Ce document décrit l’architecture de déploiement de l’application **Hublot** : dépôt Git, pipeline CI (workflow YAML), build automatique et déploiement automatique.

---

## 1. Dépôt Git

- **Plateforme :** GitHub  
- **Dépôt :** [Meriem1403/Hublot](https://github.com/Meriem1403/Hublot)  
- **Branche de déploiement :** `main`  
- **Rôle :** source unique de vérité ; chaque push sur `main` déclenche la vérification (CI) puis le déploiement (CD) sur Netlify.

```
GitHub (dépôt)
    └── branche main
            └── push / merge  →  CI (GitHub Actions)  →  CD (Netlify)
```

---

## 2. Workflow YAML (intégration continue)

Le pipeline d’intégration continue est décrit en **YAML** dans le dépôt :

**Fichier :** [`.github/workflows/build.yml`](../.github/workflows/build.yml)

### Contenu du workflow

| Élément | Description |
|--------|-------------|
| **Nom** | `CI Build` |
| **Déclencheur** | À chaque **push** et **pull request** sur la branche `main` |
| **Environnement** | `ubuntu-latest` |
| **Étapes** | Checkout → Installation Node.js → `npm ci` → **Tests** → **Build** |

### Extrait du fichier YAML

```yaml
name: CI Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Tests
        run: npm run test:run

      - name: Build
        run: npm run build
```

Ce workflow garantit qu’avant tout déploiement, les **tests** passent et le **build** réussit.

---

## 3. Build automatique

Le **build automatique** est assuré à deux endroits :

### 3.1 Dans GitHub Actions (CI)

- **Quand :** à chaque push ou pull request sur `main`.
- **Où :** sur les serveurs GitHub Actions.
- **Séquence :**
  1. **Checkout** du code du dépôt
  2. **Installation des dépendances** (`npm ci`)
  3. **Exécution des tests** (`npm run test:run`) — si les tests échouent, le job s’arrête
  4. **Build de l’application** (`npm run build`) — produit le dossier `build/`

Si une de ces étapes échoue, le workflow est en échec (et Netlify peut être configuré pour ne déployer qu’en cas de succès).

### 3.2 Sur Netlify (CD)

- **Quand :** à chaque push sur `main` (ou selon la configuration Netlify).
- **Où :** sur l’infrastructure Netlify.
- **Config :** définie dans [**`netlify.toml`**](../netlify.toml) à la racine du projet.

```toml
[build]
  command   = "npm run build"
  publish   = "build"
```

Netlify exécute donc la même commande de build et publie le contenu du dossier `build/`.

---

## 4. Déploiement automatique

- **Plateforme :** [Netlify](https://www.netlify.com/)  
- **Site en ligne :** [https://dirmhublot.netlify.app](https://dirmhublot.netlify.app)  
- **Lien avec le dépôt :** le site Netlify est connecté au dépôt GitHub ; chaque **push sur `main`** déclenche automatiquement :
  1. Un **build** (commande et dossier définis dans `netlify.toml`)
  2. Un **déploiement** du résultat vers l’URL du site

Aucune action manuelle n’est nécessaire pour déployer après un `git push origin main`.

### Récapitulatif

| Étape | Où | Déclencheur |
|-------|-----|--------------|
| Tests + Build (vérification) | GitHub Actions | Push / PR sur `main` |
| Build + Déploiement (mise en ligne) | Netlify | Push sur `main` |

---

## Schéma récapitulatif

```
  Développeur
       │
       │  git push origin main
       ▼
  ┌─────────────┐
  │ Dépôt Git   │  GitHub : Meriem1403/Hublot (branche main)
  │ (source)    │
  └──────┬──────┘
         │
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
  ┌─────────────────────┐            ┌─────────────────────┐
  │ Workflow YAML        │            │ Netlify             │
  │ .github/workflows/   │            │ (connecté au dépôt) │
  │   build.yml          │            │                     │
  │                      │            │ netlify.toml       │
  │ • Checkout           │            │ • command: npm run  │
  │ • npm ci             │            │     build           │
  │ • npm run test:run   │            │ • publish: build    │
  │ • npm run build      │            │                     │
  │                      │            │ → Déploiement       │
  │ Build automatique    │            │   automatique       │
  │ (CI)                 │            │   (CD)              │
  └─────────────────────┘            └──────────┬──────────┘
                                                │
                                                ▼
                                    https://dirmhublot.netlify.app
```

---

## Fichiers clés à montrer

| Fichier | Rôle |
|---------|------|
| **Dépôt Git** | [github.com/Meriem1403/Hublot](https://github.com/Meriem1403/Hublot) |
| **Workflow YAML** | [.github/workflows/build.yml](../.github/workflows/build.yml) |
| **Config build / déploiement** | [netlify.toml](../netlify.toml) |
| **Application en ligne** | [dirmhublot.netlify.app](https://dirmhublot.netlify.app) |
