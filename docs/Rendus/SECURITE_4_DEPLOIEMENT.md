# 4️⃣ Sécurité (très important pour DIRM ⚓)

Ce document décrit les **mesures de sécurité** mises en place pour le déploiement de l’application **Hublot**. Le jury pourra s’y référer pour valider : HTTPS, variables d’environnement, gestion des secrets, absence de données sensibles exposées, headers de sécurité et tests de vulnérabilité.

---

## 1. HTTPS

| Élément | Description |
|--------|-------------|
| **En production** | Le site [https://dirmhublot.netlify.app](https://dirmhublot.netlify.app) est servi **uniquement en HTTPS** |
| **Plateforme** | Netlify fournit et renouvelle automatiquement le certificat TLS (Let’s Encrypt) |
| **Redirection** | Netlify redirige automatiquement le trafic HTTP vers HTTPS |

Aucune configuration manuelle n’est nécessaire : l’activation et le renouvellement du certificat sont gérés par Netlify. Les échanges entre le navigateur et le site sont chiffrés.

**À montrer au jury :** ouvrir l’URL en `https://` et vérifier le cadenas dans la barre d’adresse.

---

## 2. Variables d’environnement sécurisées

Les **variables d’environnement** permettent de configurer l’application sans écrire de secrets dans le code ou le dépôt.

| Variable | Où | Usage |
|---------|-----|--------|
| `VITE_APP_USERNAME` | Netlify (UI) / `.env` local (jamais commité) | Identifiant de connexion à l’application |
| `VITE_APP_PASSWORD` | Netlify (UI) / `.env` local (jamais commité) | Mot de passe de connexion |
| `VITE_APP_DATA_URL` | Netlify / `.env` | URL des données (optionnel) |
| `NETLIFY_DATABASE_URL` | Netlify (extension Neon) | Chaîne de connexion base de données (côté serveur uniquement) |

- **En local (DEV) :** les variables sont lues depuis un fichier `.env` qui est **ignoré par Git** (voir `.gitignore`).
- **Sur Netlify (PROD) :** les variables sont définies dans l’interface Netlify (*Site settings → Environment variables*), jamais dans le dépôt.

Les variables préfixées par `VITE_` sont injectées au **build** et visibles dans le code client ; on n’y met donc **pas** de secrets haute sensibilité (un mot de passe d’accès applicatif peut y figurer si le besoin métier l’exige, mais pas de clés API ou de connexion BDD). La connexion à la base (Neon) utilise `NETLIFY_DATABASE_URL`, utilisée uniquement côté serveur (Netlify Functions).

---

## 3. Gestion des secrets

| Règle | Mise en œuvre |
|-------|----------------|
| **Aucun secret dans le dépôt** | Fichiers `.env`, `.env.*`, `.htpasswd`, `*.pem`, `*.key`, etc. sont listés dans `.gitignore` et ne sont jamais commités |
| **Secrets en production** | Saisis uniquement dans l’interface Netlify (variables d’environnement) ou via un gestionnaire de secrets (ex. intégration GitHub / Netlify) |
| **Données sensibles** | Dossier `trdata/`, fichiers `*.xlsx`, `agents.json` en local sont ignorés par Git ; les données affichées en production sont contrôlées (pas de données personnelles sensibles exposées volontairement) |

**Fichiers et dossiers exclus du dépôt (extrait `.gitignore`) :**

- `.env`, `.env.local`, `.env.production`, etc.
- `*.htpasswd`, `*.pem`, `*.key`, `*.crt`
- `trdata/`, `**/agents.json`, `*.xlsx`
- `secrets/`, `*.secret`

Le jury peut vérifier qu’aucun fichier de ce type n’apparaît dans l’historique Git ou sur GitHub.

---

## 4. Pas de données sensibles exposées

| Mesure | Description |
|--------|-------------|
| **Données affichées** | L’application affiche des indicateurs et statistiques agrégés (effectifs, répartitions) ; pas d’export massif de données personnelles identifiantes |
| **Authentification** | Accès protégé par identifiant / mot de passe (variables d’environnement) pour limiter l’accès au tableau de bord |
| **API / données brutes** | Les données sont servies soit depuis des fichiers statiques (JSON) soit via des Netlify Functions ; la chaîne de connexion BDD (`NETLIFY_DATABASE_URL`) n’est jamais exposée au client |
| **Build** | Aucun fichier `.env` ou secret n’est inclus dans le build : les variables sont injectées au moment du build sur Netlify à partir des valeurs configurées dans l’UI |

En développement, l’utilisation de `.env` local et l’exclusion de ces fichiers du dépôt évitent toute fuite de secrets par le code.

---

## 5. Headers de sécurité

Des **headers HTTP de sécurité** sont envoyés par le site pour renforcer la protection du navigateur.

**Configuration :** dans [`netlify.toml`](../netlify.toml), section `[[headers]]` :

| Header | Valeur | Rôle |
|--------|--------|------|
| **X-Frame-Options** | `DENY` | Empêche l’affichage du site dans une iframe (réduction du risque de clickjacking) |
| **X-Content-Type-Options** | `nosniff` | Force le navigateur à respecter le type MIME (limite les attaques par type de contenu) |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | Limite les informations envoyées dans l’en-tête Referrer |
| **Permissions-Policy** | Restriction des fonctionnalités (caméra, micro, etc.) | Réduit la surface d’attaque des APIs navigateur |

HTTPS étant activé, Netlify gère aussi les en-têtes liés au certificat et à la négociation TLS. On peut ajouter **Strict-Transport-Security (HSTS)** si la plateforme le propose (Netlify le gère souvent par défaut pour les domaines *.netlify.app).

**À montrer au jury :** exécuter `curl -I https://dirmhublot.netlify.app` et vérifier la présence des headers listés ci-dessus.

---

## 6. Tests de vulnérabilité (ex. `npm audit`)

Les **dépendances npm** sont régulièrement vérifiées pour limiter les vulnérabilités connues.

### Commande recommandée : `npm audit`

```bash
# À la racine du projet
npm install
npm audit
```

- **npm audit** signale les vulnérabilités connues dans les paquets listés dans `package.json` / `package-lock.json`.
- En cas de vulnérabilités : `npm audit fix` (ou `npm audit fix --force` avec prudence) pour appliquer les correctifs compatibles.

### Intégration dans la chaîne de livraison

- **En local (DEV) :** exécuter `npm audit` avant de pousser le code.
- **En CI (TEST) :** on peut ajouter une étape dans le workflow GitHub Actions (ex. `.github/workflows/build.yml`) pour exécuter `npm audit --audit-level=high` et faire échouer le job si le niveau de risque est trop élevé.

Exemple d’étape à ajouter dans le workflow YAML :

```yaml
- name: Audit des vulnérabilités
  run: npm audit --audit-level=high
```

Cela démontre au jury que les vulnérabilités des dépendances sont prises en compte et, si souhaité, bloquantes pour le déploiement.

---

## Récapitulatif pour le jury

| Point attendu | Où c’est montré |
|--------------|------------------|
| **HTTPS** | Site en production uniquement en https, certificat géré par Netlify |
| **Variables d’environnement sécurisées** | Config dans l’UI Netlify ; `.env` en local et jamais commité |
| **Gestion des secrets** | `.gitignore` à jour, aucun secret dans le dépôt, secrets uniquement dans Netlify |
| **Pas de données sensibles exposées** | Données affichées maîtrisées, BDD côté serveur, pas de fuite de secrets dans le build |
| **Headers de sécurité** | `netlify.toml` avec `[[headers]]` (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) |
| **Tests de vulnérabilité** | `npm audit` en local ; possibilité d’ajouter `npm audit` dans le workflow CI |

---

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| [.gitignore](../.gitignore) | Exclusion des fichiers sensibles et des secrets du dépôt |
| [netlify.toml](../netlify.toml) | Configuration du build et **headers de sécurité** |
| [.github/workflows/build.yml](../.github/workflows/build.yml) | CI ; peut inclure une étape `npm audit` pour les vulnérabilités |

Pour aller plus loin : [DEPLOIEMENT_SECURISE.md](./DEPLOIEMENT_SECURISE.md), [CHECKLIST_SECURITE.md](./CHECKLIST_SECURITE.md), [SECURITE.md](./SECURITE.md).
