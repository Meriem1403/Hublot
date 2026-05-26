# 2️⃣ Environnement de test

Ce document décrit les **trois environnements** utilisés pour le projet **Hublot** : développement (DEV), test (TEST) et production (PROD). Le jury pourra s’y référer pour valider la séparation des environnements et la chaîne de livraison.

---

## 1. Environnement DEV (développement)

L’environnement de **développement** est l’environnement local du développeur.

| Élément | Description |
|--------|-------------|
| **Où** | Machine locale (poste de travail) |
| **Objectif** | Développer, déboguer, tester en direct sans impacter les autres environnements |
| **Données** | Fichiers JSON locaux (ex. `public/agents.json`) ou données de démo |
| **URL** | `http://localhost:5173` (Vite en mode dev) |

### Mise en route

```bash
# Cloner le dépôt (si besoin)
git clone https://github.com/Meriem1403/Hublot.git
cd Hublot

# Installer les dépendances
npm install

# Lancer l’application en mode développement
npm run dev
```

- **Hot reload :** les modifications du code sont visibles immédiatement dans le navigateur.
- **Tests locaux :** exécuter `npm run test:run` ou `npm run test` avant de pousser le code.
- **Build local :** `npm run build` pour vérifier que le build passe en local.

### Rôle pour le jury

En **DEV**, on valide que le développeur dispose d’un environnement isolé pour coder et exécuter les tests manuellement ou via des commandes npm, sans toucher à TEST ni PROD.

---

## 2. Environnement TEST

L’environnement de **test** sert à vérifier automatiquement que le code fonctionne avant toute mise en production.

| Élément | Description |
|--------|-------------|
| **Où** | GitHub Actions (CI) et éventuellement Netlify Deploy Previews |
| **Objectif** | Valider les tests unitaires et le build sur du code partagé (branche `main` ou PR) |
| **Déclencheur** | Chaque **push** et **pull request** sur `main` |
| **Données** | Pas de base de données dédiée ; les tests utilisent des données mockées ou des JSON de test |

### Ce qui s’exécute en TEST (CI)

1. **Checkout** du code depuis le dépôt
2. **Installation des dépendances** (`npm ci`)
3. **Exécution des tests** (`npm run test:run`) — échec du job si un test échoue
4. **Build** (`npm run build`) — vérification que l’application compile

Fichier qui définit cet environnement : [`.github/workflows/build.yml`](../.github/workflows/build.yml).

### Deploy Previews (Netlify)

Pour chaque **pull request**, Netlify peut générer une **Deploy Preview** : une URL temporaire où l’on peut tester l’application comme en production, mais avec le code de la branche. Cela constitue un **environnement TEST** supplémentaire (intégration / validation visuelle).

### Rôle pour le jury

En **TEST**, on montre que les **tests automatisés** et le **build** sont exécutés dans un environnement reproductible (CI), sans déployer en production. C’est la porte d’entrée vers la production : pas de déploiement réussi sans passage des tests.

---

## 3. Environnement PROD (production)

L’environnement de **production** est celui utilisé par les utilisateurs finaux.

| Élément | Description |
|--------|-------------|
| **Où** | Netlify (hébergement du site statique) |
| **Objectif** | Servir l’application en ligne, stable et disponible |
| **URL** | [https://dirmhublot.netlify.app](https://dirmhublot.netlify.app) |
| **Déploiement** | Automatique à chaque **push sur la branche `main`** (après succès du build Netlify) |

### Conditions d’accès à la PROD

- Le code est sur la branche `main`.
- Le **build** Netlify (défini dans `netlify.toml`) réussit.
- Optionnel : la **CI GitHub Actions** peut être configurée pour bloquer le déploiement si les tests échouent (bonne pratique).

Aucune action manuelle n’est requise pour déployer : un `git push origin main` déclenche build et déploiement sur Netlify.

### Rôle pour le jury

En **PROD**, on montre que l’application est **déployée**, **accessible** et **stable**, avec une séparation claire par rapport au DEV (local) et au TEST (CI / Deploy Previews).

---

## Récapitulatif

| Environnement | Où | Déclencheur | Rôle |
|---------------|-----|-------------|------|
| **DEV** | Machine locale | `npm run dev` | Développement et tests manuels |
| **TEST** | GitHub Actions (CI) / Deploy Previews | Push ou PR sur `main` | Tests automatisés + build de vérification |
| **PROD** | Netlify | Push sur `main` | Application en ligne pour les utilisateurs |

```
  DEV (local)                    TEST (CI / Previews)              PROD (Netlify)
  ───────────                    ─────────────────────              ─────────────
  npm run dev                    GitHub Actions                     dirmhublot.netlify.app
  localhost:5173                 npm run test:run                   Déploiement auto
  Données locales                npm run build                      après push main
                                 (et Deploy Previews Netlify)
```

---

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| [.github/workflows/build.yml](../.github/workflows/build.yml) | Définition de l’environnement TEST (CI) |
| [netlify.toml](../netlify.toml) | Configuration du build et de la publication en PROD |
| [package.json](../package.json) | Scripts `dev`, `test`, `test:run`, `build` utilisés en DEV et en TEST |
