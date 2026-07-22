# Présentation du projet Hublot

Guide de présentation fluide — du projet à la démarche DevOps complète (parties 1.1, 1.2, 1.3 du livret).  


**Livret PDF :** [Documentation_Complete_Fusionnee.pdf](./pdf/Documentation_Complete_Fusionnee.pdf) · [Documentation_Annexes_Fusionnee.pdf](./pdf/Documentation_Annexes_Fusionnee.pdf)

**Navigation — fichiers clés** (liens cliquables vers le dépôt local ; [dépôt GitHub](https://github.com/Meriem1403/Hublot)) :

| Thème | Fichiers |
|-------|----------|
| **CI / CD** | [.github/workflows/ci.yml](../../.github/workflows/ci.yml) · [netlify.toml](../../netlify.toml) · [.github/workflows/cd-netlify.yml](../../.github/workflows/cd-netlify.yml) |
| **Sécurité** | [.github/workflows/security-scan.yml](../../.github/workflows/security-scan.yml) · [.github/workflows/codeql.yml](../../.github/workflows/codeql.yml) · [.gitleaks.toml](../../.gitleaks.toml) |
| **App & données** | [package.json](../../package.json) · [public/data/agents.json](../../public/data/agents.json) · [public/health.json](../../public/health.json) |
| **Tests** | [e2e/smoke.spec.ts](../../e2e/smoke.spec.ts) · [playwright.config.ts](../../playwright.config.ts) · [e2e/campaign-manual.spec.ts](../../e2e/campaign-manual.spec.ts) · [src/services/dataService.test.ts](../../src/services/dataService.test.ts) |
| **Docker / NAS** | [Dockerfile](../../Dockerfile) · [docker-compose.prod.yml](../../docker-compose.prod.yml) · [scripts/deploy-nas.sh](../../scripts/deploy-nas.sh) |

---

## Le projet Hublot

**Hublot** est le tableau de bord statistique RH de la **DIRM Méditerranée**. L’application permet de visualiser les effectifs, filtrer par service ou statut, consulter des indicateurs (ETP, répartitions) et naviguer dans les données agents à partir d’un export métier.

**Stack :** React 18, TypeScript, Vite, Tailwind, Recharts. Données : [`public/data/agents.json`](../../public/data/agents.json) *— effectifs agents, lu par l’app* ; Neon optionnel via [`netlify/functions/agents.js`](../../netlify/functions/agents.js) *— API BDD si activée*.

**Dépôt :** [github.com/Meriem1403/Hublot](https://github.com/Meriem1403/Hublot)

**Sites à ouvrir pendant la présentation :**

| Rôle | Branche Git | URL |
|------|-------------|-----|
| **Production** | `main` | [dirmhublot.netlify.app](https://dirmhublot.netlify.app) |
| **Staging** (préprod) | `staging` | [agent-6a26eb52fb02d50f3e46628e--dirmhublot.netlify.app](https://agent-6a26eb52fb02d50f3e46628e--dirmhublot.netlify.app/) |
| Déploiement manuel (Cloudflare) | — | [snowy-morning-b847.meriemzahzouh.workers.dev](https://snowy-morning-b847.meriemzahzouh.workers.dev/) |
| CI GitHub Actions | `main` / `staging` | [Actions — workflow CI](https://github.com/Meriem1403/Hublot/actions/workflows/ci.yml) |

**Netlify :** production = branche `main` → **dirmhublot.netlify.app** · staging = branche `staging` → URL de préproduction ci-dessus.

Connexion locale : `admin` / `demo` ([`.env.development`](../../.env.development) *— identifiants et variables DEV, non commité*). En prod : variables Netlify `VITE_APP_USERNAME` / `VITE_APP_PASSWORD`.

Pour lancer l’application en local :

```bash
git clone https://github.com/Meriem1403/Hublot.git
cd Hublot
npm ci
npm run dev
```

**Résultats :** `npm ci` installe les deps · `npm run dev` → Vite sur **http://localhost:5173**, badge DEV visible.

Montrer l’interface : filtres, graphiques, badge d’environnement en DEV. Puis basculer sur [dirmhublot.netlify.app](https://dirmhublot.netlify.app) pour la même application en production.

---

## Introduction — pourquoi une démarche DevOps ?

La **démarche DevOps** aligne développement, tests et mise en production sur une chaîne automatisée. Sur Hublot, elle garantit qu’une application métier RH est livrée de façon fiable, testée et traçable.

Le projet ne se limite pas à une application React : il est livré avec une **chaîne DevOps** complète — versionnement Git, intégration continue, déploiement continu, tests automatisés, sécurité, scripts d’évolution des données et documentation traçable.

La suite suit le plan du livret : **1.1** (bases DevOps), **1.2** (tests et déploiement sécurisé), **1.3** (scripts et automatisation).

---

# Partie 1.1 — Les bases de la démarche DevOps

Cette partie couvre les fondamentaux : méthode de travail (Agile), chaîne DevOps, supervision, environnements, CI/CD et configuration YAML.

## 1.1.1 — Les méthodes Agile

> Chapitre : [1.1.1 Les méthodes Agile](../1.1%20Les%20bases%20de%20la%20d%C3%A9marche%20DevOps/1.1.1%20Les%20m%C3%A9thodes%20Agile%20pour%20le%20d%C3%A9veloppement%20logiciel.md)

L’**Agile**, ce sont des cycles courts et des livraisons fréquentes plutôt qu’un gros projet d’un coup. Sur Hublot, ça sert à intégrer vite les retours métier (filtres, indicateurs RH) et à valider chaque évolution avant la prod.

Hublot a été développé par itérations courtes : chaque évolution (filtres, calculs ETP, auth, pipeline données) correspond à des user stories métier. La **Definition of Done** du projet n’est pas seulement « ça compile » : une fonctionnalité est terminée quand la **CI est verte**, le **build** est reproductible et le déploiement sur Netlify reste possible.

Le feedback est rapide : chaque push déclenche [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) *— pipeline lint / tests / build / E2E*. Historique : [GitHub](https://github.com/Meriem1403/Hublot/commits/main).

**Definition of Done — démo locale** (même gate qualité qu’avant merge) :

> Copier **une ligne à la fois**. Ne pas mettre de commentaire `# …` sur la même ligne qu’une commande `npm` : Vitest peut l’interpréter comme filtre et échouer avec « No test files found ».

```bash
npm run lint
npm run test:run
npm run audit:prod
npm run build
npm run test:e2e
```

**Résultats attendus :**

| Commande | Ce qu’on voit |
|----------|----------------|
| `lint` | ~24 warnings, **0 erreur** (seuil CI : ≤ 30) |
| `test:run` | **48 passed** · 4 fichiers · ~0,5 s |
| `audit:prod` | *Aucune vulnérabilité high/critical non allowlistée* |
| `build` | `✓ built` · `build/index.html` + `build/assets/` |
| `test:e2e` | **12 passed** · ~10 s (smoke + campagne locale) |

---

## 1.1.2 — La démarche DevOps

> Chapitre : [1.1.2 La démarche DevOps](../1.1%20Les%20bases%20de%20la%20d%C3%A9marche%20DevOps/1.1.2%20La%20d%C3%A9marche%20DevOps.md) · Schéma : [Annexe 05](../Annexes/Annexe_05_ARCHITECTURE_DEPLOIEMENT.md) *— schéma Git → CI → CD*

La **démarche DevOps** rapproche développement et exploitation : le code passe automatiquement par des contrôles qualité puis jusqu’en production. Sur Hublot, elle évite les déploiements manuels risqués et garantit que ce qui est en ligne a été testé.

La chaîne DevOps de Hublot relie le code source au site en production :

```
Développeur → git push (main / staging)
           → CI GitHub Actions (qualité + build)
           → CD Netlify (publish build/)
           → HTTPS — dirmhublot.netlify.app
```

- **CI** (*Continuous Integration* — intégration continue) : à chaque push, on **vérifie** automatiquement que le code est bon (lint, tests, build). Ça ne publie **pas** le site.
- **CD** (*Continuous Deployment* — déploiement continu) : une fois le code validé, on **met en ligne** automatiquement la nouvelle version (Netlify publie `build/`).

Les deux sont alignés sur Hublot : même `npm run build` en CI et chez Netlify ([netlify.toml](../../netlify.toml) *— fichier lu par Netlify pour builder et publier le site*).

**Les 5 fichiers à connaître** (quand / quoi / pourquoi) :

| Fichier | Quand ça s’exécute | Ce que ça fait concrètement |
|---------|-------------------|-----------------------------|
| [.github/workflows/ci.yml](../../.github/workflows/ci.yml) | À chaque push sur `main` ou `staging` | Lance **lint, 48 tests, audit, build et E2E** sur GitHub Actions. **Ne met pas le site en ligne** — vérifie seulement que le code est bon. |
| [netlify.toml](../../netlify.toml) | À chaque déploiement Netlify (push Git) | Dit à Netlify **comment publier** : `npm run build`, dossier `build/`, headers sécurité, redirects SPA. C’est le **vrai CD** : le site [dirmhublot.netlify.app](https://dirmhublot.netlify.app) en découle. |
| [.github/workflows/cd-netlify.yml](../../.github/workflows/cd-netlify.yml) | Après une CI **verte** sur `main` | Workflow **documentaire** : enchaînement « CI OK → déploiement Netlify ». Peut appeler un build hook Netlify si configuré ; sinon Netlify déploie déjà via le webhook Git. |
| [.github/workflows/security-scan.yml](../../.github/workflows/security-scan.yml) | Push + tous les lundis | **Gitleaks** : cherche mots de passe / clés API dans le code (**bloquant**). **Trivy** : cherche failles connues dans les librairies npm (**informatif**). |
| [.github/workflows/codeql.yml](../../.github/workflows/codeql.yml) | Push + tous les lundis | GitHub **lit le code TypeScript** sans l’exécuter et signale des failles possibles (injection, XSS, etc.) — complète les tests unitaires. |

Ouvrir [GitHub Actions](https://github.com/Meriem1403/Hublot/actions) et montrer un run vert du workflow **CI**, puis Netlify → **Deploys** pour le lien commit → site publié.

---

## 1.1.2.1 — Monitoring et supervision

> Chapitre : [1.1.2.1 Monitoring et supervision](../1.1%20Les%20bases%20de%20la%20d%C3%A9marche%20DevOps/1.1.2.1%20Monitoring%20et%20supervision.md)

Le **monitoring et la supervision**, c’est surveiller que l’application et la chaîne de déploiement fonctionnent correctement. Sur Hublot, ça sert à repérer vite un build en échec, un site injoignable ou une régression après mise en prod.

La supervision repose sur des points de contrôle concrets :

- **Logs GitHub Actions** — trace de chaque job CI
- **Logs Netlify Deploys** — trace de chaque publication
- [`public/health.json`](../../public/health.json) *— ping santé (`status: ok`)*
- [`src/monitoring/sentry.ts`](../../src/monitoring/sentry.ts) *— remontée d’erreurs (optionnel, `VITE_SENTRY_DSN`)*

Vérifier la santé des deux hébergements :

```bash
curl -s https://dirmhublot.netlify.app/health.json
curl -s https://snowy-morning-b847.meriemzahzouh.workers.dev/health.json
```

**Résultat :** JSON `{"status":"ok",…}` — les deux hébergements répondent.

Montrer les headers de sécurité en prod :

```bash
curl -sI https://dirmhublot.netlify.app | grep -iE 'http|x-frame|x-content|referrer'
```

**Sortie typique :**

```
HTTP/2 200
referrer-policy: strict-origin-when-cross-origin
x-content-type-options: nosniff
x-frame-options: DENY
```

| Ligne | Ce que ça signifie |
|-------|-------------------|
| `HTTP/2 200` | Le site répond **OK** en HTTPS (protocole HTTP/2, code **200** = page trouvée) |
| `x-frame-options: DENY` | Header de sécurité actif — pas d’affichage en iframe (anti-clickjacking) |
| `x-content-type-options: nosniff` | Header actif — le navigateur respecte le type MIME du fichier |
| `referrer-policy: strict-origin-when-cross-origin` | Header actif — fuite d’URL limitée vers les sites tiers |

→ Scénario **ST-SEC01** validé. Détail : section [1.2.4.2](#1242--sécurité-du-déploiement).

---

## 1.1.3 — Les bases d'un environnement de test

> Chapitre : [1.1.3 …](../1.1%20Les%20bases%20de%20la%20d%C3%A9marche%20DevOps/1.1.3%20Les%20bases%20d%27un%20environnement%20de%20test.md) · [Annexe 06](../Annexes/Annexe_06_ENVIRONNEMENT_TEST.md) *— tableau DEV / TEST / STAGING / PROD*

Un **environnement de test**, c’est une copie isolée de l’application (local, CI, preview, prod) pour tester sans impacter les utilisateurs. Sur Hublot, ça sert à valider le code en DEV, en preview, puis en prod sans mélanger les données ni les configs.

Hublot distingue plusieurs environnements, chacun avec un rôle précis :

| Env | Où | Comment |
|-----|-----|---------|
| **DEV** | Machine locale | `npm run dev` — [`.env.development`](../../.env.development) *— config locale* |
| **TEST** | GitHub Actions | [.github/workflows/ci.yml](../../.github/workflows/ci.yml) sur `main` / `staging` |
| **STAGING** | Netlify — branche `staging` | [agent-6a26eb52fb02d50f3e46628e--dirmhublot.netlify.app](https://agent-6a26eb52fb02d50f3e46628e--dirmhublot.netlify.app/) — `VITE_APP_ENV=staging` dans [netlify.toml](../../netlify.toml) |
| **PROD** | Netlify — branche `main` | [dirmhublot.netlify.app](https://dirmhublot.netlify.app) |
| **Preview PR** | Pull request | `deploy-preview-NN--dirmhublot.netlify.app` — `VITE_APP_ENV=preview` |
| **Preuve manuelle** | Cloudflare Workers | dossier `build/` *— sortie de `npm run build`* |

```bash
bash scripts/check-test-environment.sh
```

**Résultat :** OK Node 20, deps installées, scripts npm présents.

Flux Git (comme le livret) : travail sur `staging` → tests sur la préprod → merge vers `main` → prod sur **dirmhublot.netlify.app**.

---

## 1.1.3.1 et 1.1.3.2 — Docker

> Chapitres : [1.1.3.1 Guide Docker](../1.1%20Les%20bases%20de%20la%20d%C3%A9marche%20DevOps/1.1.3.1%20Guide%20Docker.md) · [1.1.3.2 Compléments Docker](../1.1%20Les%20bases%20de%20la%20d%C3%A9marche%20DevOps/1.1.3.2%20Compl%C3%A9ments%20Docker.md)

**Docker** emballe l’application et ses dépendances dans un conteneur reproductible. Sur Hublot, ça sert à déployer la même app sur un NAS ou en local, indépendamment de la machine hôte.

[`docker-compose.dev.yml`](../../docker-compose.dev.yml) *— dev conteneurisé* · [`docker-compose.prod.yml`](../../docker-compose.prod.yml) *— prod locale via Nginx* · [`Dockerfile`](../../Dockerfile) *— build Vite + image Nginx*. Variables `VITE_*` injectées **au build**, pas au runtime.

**À quoi sert `npm run docker:prod:build` ?**

Ce n’est **pas** la prod Netlify. C’est une **prod locale conteneurisée** : Docker build l’app (`npm run build` → dossier `build/`) puis la sert avec **Nginx**, comme sur un NAS ou un serveur interne. Utile pour :

- tester le déploiement **comme en prod** sans pousser sur Netlify ;
- illustrer l’hébergement **NAS / réseau interne** (1.1.3.1, 1.3.2) ;
- montrer que l’app tourne de la même façon partout (image reproductible).

| Commande | Rôle |
|----------|------|
| `npm run docker:prod:build` | Build l’image + démarre le conteneur prod |
| `npm run docker:stop` | Arrête les conteneurs dev et prod |
| `docker compose -f docker-compose.prod.yml down` | Arrête uniquement le conteneur prod |

Démo optionnelle :

```bash
npm run docker:prod:build
npm run docker:stop
npm run docker:dev
docker compose -f docker-compose.prod.yml down
```

**Résultats :** prod → app sur **http://localhost** (Nginx) · `docker:stop` → conteneurs arrêtés · `docker:dev` → Vite sur **http://localhost:5173**. L’image reste en cache Docker.

> `docker:stop` / `down` **ne supprime pas l'image** — seulement le conteneur. Première fois en dev : `npm run docker:dev:build` à la place de `docker:dev`.

---

## 1.1.4 — La mise en place de l'intégration continue (CI)

> Chapitre : [1.1.4 CI](../1.1%20Les%20bases%20de%20la%20d%C3%A9marche%20DevOps/1.1.4%20La%20mise%20en%20place%20de%20l%27int%C3%A9gration%20continue%20(CI).md) · [Annexe 01](../Annexes/Annexe_01_build.yml) *— copie commentée de* [.github/workflows/ci.yml](../../.github/workflows/ci.yml)

**CI** = *Continuous Integration* (intégration continue) : fusionner et **tester le code en continu**, à chaque push, **avant** toute mise en production.

Sur Hublot : GitHub Actions lance lint, 48 tests, audit, build et E2E — si un job échoue, le problème est détecté tout de suite.

[.github/workflows/ci.yml](../../.github/workflows/ci.yml) *— 5 jobs en parallèle puis E2E* :

| Job | Commande |
|-----|----------|
| ESLint | `npm run lint` |
| Tests unitaires | `npm run test:run` — **48 tests** Vitest |
| Audit npm prod | `npm run audit:prod` |
| Build | `npm run build` |
| E2E | `npm run build:e2e` puis `npm run test:e2e` |

Reproduire la chaîne qualité en local (même logique que la CI) — **une commande par ligne, sans `#` en fin de ligne** :

```bash
npm run lint
npm run test:run
npm run audit:prod
npm run build
npm run test:e2e
```

**Résultats :** même tableau qu’en [1.1.1](#111--les-méthodes-agile) — lint OK · 48 tests · audit allowlisté · build OK · 12 E2E.

Vérifier l’artefact build (équivalent du job CI « Build production ») :

```bash
ls -la build/index.html build/assets/
```

**Résultat :** fichiers listés (`index.html`, JS/CSS dans `assets/`).

Montrer sur [GitHub Actions](https://github.com/Meriem1403/Hublot/actions/workflows/ci.yml) les cinq jobs verts sur le dernier push.

---

## 1.1.5 — Livraison et déploiement continu (CD)

> Chapitre : [1.1.5 La mise en place de la livraison ou déploiement continu (CD)](../1.1%20Les%20bases%20de%20la%20d%C3%A9marche%20DevOps/1.1.5%20La%20mise%20en%20place%20de%20la%20livraison%20ou%20d%C3%A9ploiement%20continu%20(CD).md)

**CD** = *Continuous Deployment* (déploiement continu) : **publier automatiquement** l’application sur le serveur dès qu’une version est prête.

Sur Hublot : Netlify exécute `npm run build` et met en ligne le dossier `build/` — le site [dirmhublot.netlify.app](https://dirmhublot.netlify.app) se met à jour sans upload manuel.

Le CD passe par **Netlify** : push `main` → `npm run build` → publish `build/` ([netlify.toml](../../netlify.toml) *— commande et dossier publish*).

En cas de régression en production, le rollback Netlify consiste à **Publish deploy** sur un déploiement antérieur (sans rebuilder). Alternative Git : `git revert` + push.

Montrer Netlify → **Deploys** : lien vers le commit GitHub, durée du build, URL publiée.

---

## 1.1.5.1 — Hébergement de l'application

> Chapitre : [1.1.5.1 Hébergement de l'application](../1.1%20Les%20bases%20de%20la%20d%C3%A9marche%20DevOps/1.1.5.1%20H%C3%A9bergement%20de%20l%27application.md)

L’**hébergement**, c’est l’infrastructure qui sert l’application aux utilisateurs (HTTPS, CDN, fichiers statiques). Sur Hublot, Netlify est le canal principal ; Cloudflare et le NAS sont des alternatives documentées.

Hublot est hébergé sur **trois canaux** :

1. **Netlify** — production officielle, HTTPS, CDN → [dirmhublot.netlify.app](https://dirmhublot.netlify.app)
2. **Cloudflare Workers** — déploiement manuel de preuve (second hébergeur) → [snowy-morning-b847.meriemzahzouh.workers.dev](https://snowy-morning-b847.meriemzahzouh.workers.dev/)
3. **NAS / Docker** — [`scripts/deploy-nas.sh`](../../scripts/deploy-nas.sh) *— build + tests + copie vers Synology*

Données runtime : [`public/data/agents.json`](../../public/data/agents.json) *— source* → `build/data/` *— copié au build*. Neon optionnel.

Build pour déploiement manuel Cloudflare (`.env.production.local` requis, non commité) :

```bash
npm run build
ls -lh build/data/agents.json build/index.html
```

**Résultat :** `✓ built` · `agents.json` et `index.html` dans `build/` — dossier à uploader sur Cloudflare.

---

## 1.1.6 — Introduction au YAML

> Chapitre : [1.1.6 Introduction au YAML](../1.1%20Les%20bases%20de%20la%20d%C3%A9marche%20DevOps/1.1.6%20Introduction%20au%20YAML.md)

Le **YAML** est un format de configuration lisible, utilisé pour décrire pipelines CI/CD et réglages de déploiement. Sur Hublot, il formalise la CI ([.github/workflows/ci.yml](../../.github/workflows/ci.yml)) et le CD ([netlify.toml](../../netlify.toml)) de façon versionnée dans Git.

YAML structure toute la chaîne DevOps du projet :

| Fichier | Rôle en une phrase |
|---------|-------------------|
| [.github/workflows/ci.yml](../../.github/workflows/ci.yml) | Vérifie le code à chaque push (lint, tests, build, E2E) — sans déployer |
| [netlify.toml](../../netlify.toml) | Configure Netlify : build, publication de `build/`, headers, staging/preview |
| [.github/workflows/cd-netlify.yml](../../.github/workflows/cd-netlify.yml) | Documente le lien CI verte → déploiement Netlify (build hook optionnel) |
| [.github/workflows/security-scan.yml](../../.github/workflows/security-scan.yml) | Gitleaks (secrets dans Git) + Trivy (CVE dans les deps) |
| [.github/workflows/codeql.yml](../../.github/workflows/codeql.yml) | Analyse le code source à la recherche de failles de sécurité (SAST) |
| [.gitleaks.toml](../../.gitleaks.toml) | Allowlist : identifiants de démo autorisés (admin/demo) |

Ouvrir [.github/workflows/ci.yml](../../.github/workflows/ci.yml) et [netlify.toml](../../netlify.toml) côte à côte : déclencheurs, Node 20, cache npm, publish `build/`.

---

# Partie 1.2 — Préparer le déploiement d'une application sécurisée

Cette partie traite des tests (plan, scénarios, sécurité, exécution, rapport) et de la documentation du déploiement.

## 1.2.1 — Les enjeux des plans de test

> Chapitre : [1.2.1 Les enjeux des plans de test](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.1%20Les%20enjeux%20des%20plans%20de%20test.md) · [Annexe 08](../Annexes/Annexe_08_PLAN_TEST.md) *— liste des tests et statuts*

Un **plan de test** recense ce qu’il faut vérifier avant et après un déploiement. Sur une app RH comme Hublot, ça sert à garantir des chiffres fiables, un accès protégé et l’absence de régression.

Avant de déployer une application RH en production, plusieurs enjeux guident le plan de test Hublot :

- **Fiabilité des données** — filtres, calculs ETP, cohérence des effectifs
- **Non-régression** — chaque push validé par la CI avant publication
- **Sécurité** — auth, headers HTTP, absence de secrets dans Git, audit des dépendances
- **Traçabilité** — scénarios identifiés ST-* reliés au plan de test et au rapport d’exécution

La pyramide de tests : **48 tests unitaires** Vitest en base, tests E2E Playwright au sommet, campagnes manuelles pour les scénarios métier.

---

## 1.2.2 — Élaborer un scénario de test

> Chapitre : [1.2.2 Scénarios de test](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.2%20Elaborer%20un%20sc%C3%A9nario%20de%20test.md) · [Annexe 13](../Annexes/Annexe_13_SCENARIOS_TEST.md) *— ST-F*, ST-SEC*, ST-AUTO* détaillés*

Un **scénario de test** décrit un parcours utilisateur précis (Étant donné / Quand / Alors). Sur Hublot, chaque scénario ST-* est rejouable et relié au plan de test.

Chaque scénario suit la structure **Étant donné / Quand / Alors** et porte un identifiant stable :

**Fonctionnels (ST-F*)**

| ID | Thème |
|----|-------|
| ST-F01 | Authentification |
| ST-F02 | Chargement des données |
| ST-F03 | Filtres globaux |
| ST-F04 | Responsive |
| ST-F05 | Performance |
| ST-F06 | Badge environnement DEV vs PROD |

**Sécurité (ST-SEC*)**

| ID | Thème |
|----|-------|
| ST-SEC01 | Headers HTTP en production |
| ST-SEC02 | Garde-fous applicatifs |
| ST-SEC03 | Aucun secret dans Git (Gitleaks) |
| ST-SEC04 | Audit npm prod + Trivy |
| ST-SEC05 | CodeQL (SAST) |

**Automatisation (ST-AUTO*)** — lint, 48 tests, E2E, build, `audit:prod`

Exécuter la campagne Playwright des scénarios fonctionnels :

```bash
npx playwright install chromium
npm run test:campaign
```

**Résultat :** **9 passed** — scénarios ST-F01 à ST-F06 rejoués en local.

Ouvrir [Annexe 13](../Annexes/Annexe_13_SCENARIOS_TEST.md) pour le détail Étant donné / Quand / Alors de chaque scénario.

---

## 1.2.3 — Mettre en place un environnement de test

> Chapitre : [1.2.3 Mettre en place un environnement de test](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.3%20Mettre%20en%20place%20un%20environnement%20de%20test.md)

Mettre en place un **environnement de test**, c’est reproduire les mêmes conditions partout (Node, commandes, données de test). Sur Hublot, un test local doit donner le même résultat qu’en CI.

L’environnement de test doit être **reproductible** : mêmes versions Node, mêmes commandes en local et en CI.

```bash
bash scripts/check-test-environment.sh
npm run build:e2e
npm run preview:test
```

**Résultats :** env OK · build E2E terminé · preview sur **http://localhost:4173** (identifiants test).

Fichiers Playwright :

- [`e2e/smoke.spec.ts`](../../e2e/smoke.spec.ts) *— 3 tests rapides, exécutés en CI*
- [`e2e/campaign-manual.spec.ts`](../../e2e/campaign-manual.spec.ts) *— scénarios ST-F* en local / preview*
- [`e2e/campaign-prod.spec.ts`](../../e2e/campaign-prod.spec.ts) *— même scénarios sur prod (lecture seule)*

---

## 1.2.4 — Les outils et stratégies des tests de sécurité

> Chapitre : [1.2.4 Les outils et les stratégies des tests de sécurité](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.4%20Les%20outils%20et%20les%20strat%C3%A9gies%20des%20tests%20de%20s%C3%A9curit%C3%A9.md)

Les **tests de sécurité** cherchent failles, secrets exposés et dépendances vulnérables. Sur Hublot, la stratégie couvre le code, le déploiement, les librairies npm et l’analyse statique.

La sécurité est traitée en **couches** : applicatif, déploiement, dépendances, secrets, analyse statique. Les sous-chapitres 1.2.4.1 à 1.2.4.4 détaillent chaque couche ; on les enchaîne naturellement.

### 1.2.4.1 — Mesures de sécurité applicative

> Chapitre : [1.2.4.1 Mesures de sécurité applicative](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.4.1%20Mesures%20de%20s%C3%A9curit%C3%A9%20applicative.md)

La **sécurité applicative**, c’est ce qui protège l’app dans le code : authentification, validation des entrées, masquage des données sensibles.

Côté code :

- [`src/utils/security.ts`](../../src/utils/security.ts) *— sanitization, session, masquage RH*
- [`src/utils/security.test.ts`](../../src/utils/security.test.ts) *— 15 tests sécurité (sur 48)*

```bash
npm run security:test
```

**Résultat :** **15 passed** — garde-fous auth, session, masquage RH.

### 1.2.4.2 — Sécurité du déploiement

> Chapitre : [1.2.4.2 Sécurité du déploiement](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.4.2%20S%C3%A9curit%C3%A9%20du%20d%C3%A9ploiement.md) · [Annexe 07](../Annexes/Annexe_07_SECURITE_4_DEPLOIEMENT.md) *— HTTPS, secrets, headers*

La **sécurité du déploiement**, c’est sécuriser l’hébergement : HTTPS, headers HTTP, secrets hors du dépôt Git.

**C’est quoi un header HTTP ?**

Quand le navigateur demande une page (`https://dirmhublot.netlify.app`), le serveur renvoie deux choses :

1. **Le corps** — le contenu visible : HTML, CSS, JS, JSON…
2. **Les headers** (en-têtes) — des **lignes d’information invisibles** à l’écran, lues par le navigateur avant d’afficher la page.

Analogie : le **colis** (la page web) + l’**étiquette** sur le colis (les headers : type de contenu, consignes de sécurité, cache, etc.).

Exemple simplifié de ce que renvoie Netlify (invisible pour l’utilisateur, visible avec `curl -I`) :

```
HTTP/2 200                          ← statut : la page existe
content-type: text/html             ← c’est du HTML
x-frame-options: DENY               ← consigne de sécurité
x-content-type-options: nosniff     ← autre consigne de sécurité
```

On ne les voit pas dans l’interface Hublot, mais le **navigateur les applique** à chaque chargement. Sur Hublot, les headers de **sécurité** sont configurés dans [netlify.toml](../../netlify.toml) et testés par **ST-SEC01**.

**HTTPS** — le site est servi en **https://** (connexion chiffrée entre le navigateur et Netlify/Cloudflare). Les identifiants et les données transitent de façon illisible sur le réseau. Sur Hublot : [dirmhublot.netlify.app](https://dirmhublot.netlify.app) est en HTTPS par défaut (certificat géré par Netlify).

**Headers HTTP de sécurité** (ceux qu’on configure volontairement) — des consignes envoyées au navigateur pour **réduire certains risques** (clickjacking, exécution de fichiers piégés, fuite d’URL, accès caméra/micro…).

| Header | Valeur sur Hublot | Ce que ça signifie (en clair) |
|--------|-------------------|-------------------------------|
| **HTTPS** / `HTTP/2 200` | Certificat TLS actif | La page est chargée sur une connexion **chiffrée** — pas en clair sur le réseau |
| **X-Frame-Options** | `DENY` | Interdit d’afficher le site dans une **iframe** sur un autre domaine → limite le **clickjacking** (piège qui fait cliquer l’utilisateur à son insu) |
| **X-Content-Type-Options** | `nosniff` | Le navigateur ne doit pas « deviner » le type d’un fichier → limite l’exécution de contenu malveillant déguisé |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | Limite ce que le navigateur envoie dans l’en-tête **Referer** vers d’autres sites (moins de fuite d’URL / contexte) |
| **Permissions-Policy** | `camera=(), microphone=(), geolocation=()` | Désactive caméra, micro et géolocalisation pour cette app (Hublot n’en a pas besoin) |

Secrets : variables `VITE_APP_USERNAME` / `VITE_APP_PASSWORD` dans l’UI Netlify uniquement — jamais dans Git ([.gitignore](../../.gitignore) · [Annexe 04](../Annexes/Annexe_04_gitignore)).

**Vérifier en prod** (démo ST-SEC01) :

```bash
curl -sI https://dirmhublot.netlify.app | grep -iE 'http|x-frame|x-content|referrer'
```

`-sI` = requête silencieuse, **headers seulement** (pas le HTML). `grep` filtre les lignes utiles pour la démo.

**Sortie réelle (prod Hublot) :**

```
HTTP/2 200
referrer-policy: strict-origin-when-cross-origin
x-content-type-options: nosniff
x-frame-options: DENY
```

**Lecture ligne par ligne — quoi dire à voix haute :**

| Ligne du terminal | Signification |
|-------------------|---------------|
| `HTTP/2 200` | « Le site est **en ligne** et répond correctement, en **HTTPS** (HTTP/2). » |
| `x-frame-options: DENY` | « Personne ne peut embarquer notre app dans une iframe sur un autre site — c’est ce qu’on a mis dans [netlify.toml](../../netlify.toml). » |
| `x-content-type-options: nosniff` | « Le navigateur ne va pas interpréter un fichier comme autre chose que son vrai type. » |
| `referrer-policy: strict-origin-when-cross-origin` | « Quand on quitte le site, on ne balance pas toute l’URL sensible aux sites externes. » |

Les **quatre lignes** correspondent aux valeurs configurées dans [netlify.toml](../../netlify.toml) → **ST-SEC01 passé**.

Contrôle local (attendus alignés sur [netlify.toml](../../netlify.toml)) :

```bash
npm run security:headers
```

**Résultat typique** ([scripts/check-security-headers.sh](../../scripts/check-security-headers.sh)) :

```
✅ OK                     : x-frame-options: DENY
✅ OK                     : x-content-type-options: nosniff
✅ OK                     : referrer-policy: strict-origin-when-cross-origin
✅ OK                     : permissions-policy: ...
⚠️  absent (recommandé)   : Strict-Transport-Security
⚠️  absent (recommandé)   : Content-Security-Policy
✅ ST-SEC01 : en-têtes de sécurité obligatoires présents.
```

Le script distingue **obligatoire** (bloquant) et **recommandé** (avertissement seulement) :

| Niveau | Headers | Sur Hublot Netlify |
|--------|---------|-------------------|
| **Obligatoires** | `X-Frame-Options`, `X-Content-Type-Options` | ✅ présents dans [netlify.toml](../../netlify.toml) → **ST-SEC01 passé** (exit 0) |
| **Recommandés** | `Referrer-Policy`, `Permissions-Policy`, `HSTS`, `Content-Security-Policy` | Partiellement — le `⚠️` n’est **pas un échec** |

**C’est quoi `Content-Security-Policy` (CSP) ?**

C’est un header qui dit au navigateur **d’où il a le droit de charger** scripts, styles, images, etc. Exemple : « n’exécute que les JS venant de mon domaine » → limite les attaques **XSS** (injection de script malveillant). S’il est absent, le script affiche `⚠️ absent (recommandé)` : ce n’est **pas un échec** — ST-SEC01 reste validé tant que les headers obligatoires sont présents.

### 1.2.4.3 — Audit des dépendances

> Chapitre : [1.2.4.3 Audit des dépendances](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.4.3%20Audit%20des%20d%C3%A9pendances.md)

L’**audit des dépendances** vérifie que les librairies npm utilisées n’ont pas de vulnérabilités connues. Sur Hublot, `audit:prod` ne scanne que les paquets de production.

[`scripts/npm-audit-prod.sh`](../../scripts/npm-audit-prod.sh) *— audit npm prod uniquement* · complété par [.github/workflows/security-scan.yml](../../.github/workflows/security-scan.yml) *— Trivy en CI*.

```bash
npm run audit:prod
```

**Résultat :** rapport npm audit puis *Aucune vulnérabilité high/critical non allowlistée (prod)*.

### 1.2.4.4 — Checklist sécurité

> Chapitre : [1.2.4.4 Checklist sécurité](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.4.4%20Checklist%20s%C3%A9curit%C3%A9.md)

La **checklist sécurité** est une liste de contrôles à cocher avant chaque mise en production. Sur Hublot, elle évite d’oublier un point (CI, secrets, headers, rollback).

Points à valider avant chaque mise en production : CI verte, aucun `.env` dans Git, headers prod vérifiés, mots de passe forts sur Netlify, procédure de rollback connue et testée.

---

## 1.2.5 — Planifier efficacement les tests

> Chapitre : [1.2.5 Planifier efficacement les tests](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.5%20Planifier%20efficacement%20les%20tests.md)

**Planifier les tests**, c’est prioriser quoi tester en fonction des risques (données RH, auth, régression). Sur Hublot, les cas critiques passent en CI ; le reste en manuel ou E2E.

La planification part des **risques métier** et du [plan de test — Annexe 08](../Annexes/Annexe_08_PLAN_TEST.md) *— objectifs, niveau de test, statut*.

Priorités Hublot : chargement [public/data/agents.json](../../public/data/agents.json), auth, calculs ETP, headers prod, pipeline données.

---

## 1.2.6 — Valider les résultats des tests

> Chapitre : [1.2.6 Valider les résultats des tests](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.6%20Valider%20les%20r%C3%A9sultats%20des%20tests.md)

**Valider les résultats**, c’est attribuer un statut (Passé / Échec) à chaque test et conserver une preuve (log CI, capture). Sur Hublot, ça rend la campagne de tests traçable.

Chaque test ou scénario reçoit un statut : **Passé**, **Échec** ou **À exécuter**. Les preuves sont les logs CI sur GitHub Actions, les rapports Playwright, les captures des tests manuels et le rapport d’exécution (1.2.9).

---

## 1.2.7 — Documenter le processus de déploiement

> Chapitre : [1.2.7 Documenter le déploiement](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.7%20Documenter%20le%20processus%20de%20d%C3%A9ploiement.md) · [Annexe 05](../Annexes/Annexe_05_ARCHITECTURE_DEPLOIEMENT.md) *— chaîne Git → CI → Netlify*

**Documenter le déploiement**, c’est écrire la procédure pour qu’un autre développeur puisse installer, publier ou revenir en arrière. Sur Hublot, install local, chaîne prod et rollback sont décrits pas à pas.

**Installation locale** — déjà vu en ouverture :

```bash
git clone https://github.com/Meriem1403/Hublot.git
cd Hublot
npm ci
npm run dev
```

**Résultat :** app locale sur **http://localhost:5173**.

**Chaîne production :**

```
git push main → CI verte → Netlify build → dirmhublot.netlify.app
```

**Rollback A** — Netlify : Deploys → Publish deploy antérieur  
**Rollback B** — Git : `git revert` + push

**Déploiement manuel Cloudflare** (second hébergeur) :

1. [`public/data/agents.json`](../../public/data/agents.json) *— données à jour*
2. `.env.production.local` *— identifiants build (local, non commité)*
3. `npm run build` → dossier `build/` *— artefact à uploader*
4. Upload **`build/`** sur Cloudflare Workers

URL de preuve : [snowy-morning-b847.meriemzahzouh.workers.dev](https://snowy-morning-b847.meriemzahzouh.workers.dev/)

---

## 1.2.8 — Procédure d'exécution des tests

> Chapitre : [1.2.8 Procédure d'exécution](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.8%20Proc%C3%A9dure%20d%27ex%C3%A9cution%20des%20tests%20(%C3%A9preuve).md) · [Annexe 09](../Annexes/Annexe_09_DEMO_EPREUVE.md) *— commandes pas à pas pour la démo*

La **procédure d’exécution des tests** fixe l’ordre des commandes pour lancer une campagne complète. Sur Hublot, on enchaîne unitaires → sécurité → build → E2E → headers prod.

Ordre recommandé pour une campagne complète — à exécuter à la racine du projet :

```bash
npm ci
npm run test:run
npm run security:test
npm run audit:prod
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:e2e:demo
npm run test:campaign
npm run security:headers
curl -sI https://dirmhublot.netlify.app | grep -iE 'x-frame|x-content|referrer'
```

**Résultats (campagne complète) :**

| Étape | Résultat |
|-------|----------|
| `npm ci` | deps installées |
| `test:run` | **48 passed** |
| `security:test` | **15 passed** |
| `audit:prod` | allowlist OK |
| `build` | `✓ built` |
| `test:e2e` | **12 passed** |
| `test:e2e:demo` | navigateur visible (démo lente) |
| `test:campaign` | **9 passed** (ST-F*) |
| `security:headers` + `curl` | 4 lignes : `HTTP/2 200` + 3 headers sécurité (ST-SEC01) |

Puis vérifier la CI distante sur [GitHub Actions](https://github.com/Meriem1403/Hublot/actions) et comparer avec les résultats locaux.

---

## 1.2.9 — Rapport d'exécution des tests

> Chapitre : [1.2.9 Rapport d'exécution des tests](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.9%20Rapport%20d%27ex%C3%A9cution%20des%20tests.md)

Le **rapport d’exécution** synthétise les résultats de la campagne : quels scénarios sont passés, combien de tests, quelle date. Sur Hublot, il fait le lien entre le plan de test et les preuves CI.

Le rapport consolide les résultats de la campagne : scénarios ST-F01 à ST-F06 et ST-SEC01/02 validés, **48 tests** Vitest, **9 tests** campagne Playwright, CI alignée sur le dépôt [Meriem1403/Hublot](https://github.com/Meriem1403/Hublot). Le déploiement Cloudflare manuel est documenté comme preuve d’hébergement alternatif (URL + date).

---

## 1.2.10 — Guide Playwright

> Chapitre : [1.2.10 Guide Playwright](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.10%20Guide%20Playwright.md)

**Playwright** pilote un **vrai navigateur** (Chromium) : il clique, remplit des formulaires et vérifie l’écran comme un utilisateur. Sur Hublot, il complète les **48 tests Vitest** (code isolé) en validant le **parcours bout en bout** : login → tableau de bord → `health.json`.

| Outil | Où ça tourne | Ce qu’on voit en démo |
|-------|--------------|------------------------|
| **Vitest** (`test:run`) | Node.js, pas de navigateur | Terminal uniquement — 48 passed |
| **Playwright CI** (`test:e2e`) | Chromium **headless** (invisible) | Terminal — 12 passed |
| **Playwright démo** (`test:e2e:demo`) | Chromium **headed** (fenêtre visible) | Terminal **+** navigateur qui s’anime |

Fichiers :

- [e2e/smoke.spec.ts](../../e2e/smoke.spec.ts) *— 3 tests parcours critique (CI + démo)*
- [e2e/campaign-manual.spec.ts](../../e2e/campaign-manual.spec.ts) *— scénarios ST-F01 à ST-F06*
- [e2e/campaign-prod.spec.ts](../../e2e/campaign-prod.spec.ts) *— contrôles prod lecture seule*
- [playwright.config.ts](../../playwright.config.ts) *— preview sur :4173, ralenti `PLAYWRIGHT_SLOW_MS`*

### Démo Playwright — simulation en ligne de commande (3–5 min)

**Objectif oral :** montrer qu’un test E2E rejoue le parcours utilisateur automatiquement, avec le navigateur visible, puis pointer la même logique en CI (headless).

**Prérequis** (une fois par machine) :

```bash
npx playwright install chromium
```

**Commande principale** — fenêtre Chromium visible, actions espacées de 800 ms :

```bash
npm run test:e2e:demo
```

Équivalent dans [package.json](../../package.json) : `PLAYWRIGHT_SLOW_MS=800 playwright test --headed --workers=1 e2e/smoke.spec.ts`

**Ce qui se passe** (à commenter pendant l’exécution) :

1. Playwright lance `build:e2e` puis sert l’app sur **http://127.0.0.1:4173** (config [playwright.config.ts](../../playwright.config.ts)).
2. **Chromium s’ouvre** — mode *headed* (contrairement à la CI, headless).
3. Les 3 scénarios de [e2e/smoke.spec.ts](../../e2e/smoke.spec.ts) s’enchaînent lentement :

| # | Test | Ce qu’on voit à l’écran |
|---|------|-------------------------|
| 1 | Page de connexion | Titre « Bienvenue », champs email / mot de passe |
| 2 | Connexion → dashboard | Saisie `e2e-user` / `e2e-pass`, clic Se connecter, bouton Déconnexion |
| 3 | `health.json` | Vérification API (terminal) — `status: ok`, `app: hublot` |

4. Le terminal affiche **3 passed** — même scénario que le job **E2E** de [.github/workflows/ci.yml](../../.github/workflows/ci.yml), mais sans fenêtre en CI.

**Résultat attendu dans le terminal :**

```
Running 3 tests using 1 worker
  ✓ affiche la page de connexion
  ✓ connexion puis accès au tableau de bord
  ✓ endpoint health.json
  3 passed
```

**À dire pendant la démo :** « Vitest teste les fonctions ; Playwright teste l’interface. En CI c’est invisible et rapide ; ici on ralentit pour voir chaque étape. »

### Autres commandes Playwright (si on te demande)

| Commande | Usage |
|----------|--------|
| `npm run test:e2e` | Headless, rapide — comme en CI (**12 passed**) |
| `npm run test:e2e:demo` | **Démo** — smoke visible, 800 ms entre actions |
| `npm run test:e2e:slow` | Visible, un peu plus rapide (400 ms) |
| `npm run test:e2e:headed` | Visible, vitesse normale |
| `npm run test:e2e:ui` | Interface Playwright — lancer un test pas à pas, timeline |
| `npm run test:campaign` | Campagne ST-F* + prod lecture seule (**9 passed**) |

**Option interface pas à pas** (si le temps le permet) :

```bash
npm run test:e2e:ui
```

Ouvrir `smoke.spec.ts` dans l’UI, lancer un test, utiliser la timeline pour expliquer chaque action.

**Pièges à éviter :** ne pas mettre de `#` sur la même ligne qu’une commande npm · premier lancement ~20 s (build E2E) · fermer toute preview sur le port 4173 si conflit.

---

# Partie 1.3 — Rédiger des scripts dans la démarche DevOps

Cette partie présente les scripts du projet : déploiement NAS, évolution des données, workflow CI YAML et automatisation des tests.

## 1.3.1 — Les bases du déploiement automatique

> Chapitre : [1.3.1 Les bases du déploiement automatique](../1.3%20R%C3%A9diger%20des%20scriptes%20dans%20la%20d%C3%A9marche%20DevOps/1.3.1%20Les%20bases%20du%20d%C3%A9ploiement%20automatique.md)

Le **déploiement automatique** publie l’application sans intervention manuelle, après validation qualité. Sur Hublot, Netlify, le script NAS et les scripts locaux partagent la même logique build + tests.

Le déploiement automatique repose sur un **gate qualité** : rien n’est publié sans build réussi et tests passés. La même logique s’applique à Netlify (CD cloud), au script NAS et au pipeline local — une seule commande `npm run build`, les mêmes 48 tests via `npm run test:run`.

---

## 1.3.2 — Script de déploiement NAS

> Chapitre : [1.3.2 Rédiger et utiliser un script de déploiement](../1.3%20R%C3%A9diger%20des%20scriptes%20dans%20la%20d%C3%A9marche%20DevOps/1.3.2%20R%C3%A9diger%20et%20utiliser%20un%20script%20de%20d%C3%A9ploiement.md)

Un **script de déploiement** enchaîne build, tests et copie des fichiers vers la cible. Sur Hublot, [scripts/deploy-nas.sh](../../scripts/deploy-nas.sh) sert au réseau interne (Synology) quand le CD cloud n’est pas adapté.

[`scripts/deploy-nas.sh`](../../scripts/deploy-nas.sh) *— build, tests, copie vers NAS* · [`cd-nas.yml`](../../.github/workflows/cd-nas.yml) *— déclenchement manuel via secrets GitHub*.

```bash
chmod +x scripts/deploy-nas.sh
./scripts/deploy-nas.sh
```

**Résultat :** lint + 48 tests + build, puis copie vers le NAS (ou message d’erreur si NAS non configuré).

Avec rsync (optionnel) :

```bash
NAS_HOST=IP_NAS NAS_USER=admin NAS_PATH=/volume1/docker/statdirm ./scripts/deploy-nas.sh --rsync
```

---

## 1.3.3 à 1.3.5 — Scripts d'évolution des données

> Chapitres :
> - [1.3.3 Les bases des scripts d'évolution](../1.3%20R%C3%A9diger%20des%20scriptes%20dans%20la%20d%C3%A9marche%20DevOps/1.3.3%20Les%20bases%20des%20scripts%20d%27%C3%A9volution.md)
> - [1.3.3.1 Modèle de données cible](../1.3%20R%C3%A9diger%20des%20scriptes%20dans%20la%20d%C3%A9marche%20DevOps/1.3.3.1%20Mod%C3%A8le%20de%20donn%C3%A9es%20cible.md)
> - [1.3.4 Rédiger des scripts d'évolution](../1.3%20R%C3%A9diger%20des%20scriptes%20dans%20la%20d%C3%A9marche%20DevOps/1.3.4%20R%C3%A9diger%20des%20scripts%20d%27%C3%A9volution.md)
> - [1.3.4.1 Publier et vérifier les données sur Netlify](../1.3%20R%C3%A9diger%20des%20scriptes%20dans%20la%20d%C3%A9marche%20DevOps/1.3.4.1%20Publier%20et%20v%C3%A9rifier%20les%20donn%C3%A9es%20sur%20Netlify.md)
> - [1.3.5 Optimiser les scripts d'évolution](../1.3%20R%C3%A9diger%20des%20scriptes%20dans%20la%20d%C3%A9marche%20DevOps/1.3.5%20Optimiser%20les%20scripts%20d%27%C3%A9volution.md)

Les **scripts d’évolution** transforment l’export Excel métier en JSON et mettent à jour [public/data/agents.json](../../public/data/agents.json). Sur Hublot, ils alimentent l’app et sont validés par les 48 tests avant tout déploiement.

[scripts/run-evolution-pipeline.sh](../../scripts/run-evolution-pipeline.sh) *— Excel → JSON + validation* alimente [public/data/agents.json](../../public/data/agents.json) *— données servies en prod* et [src/data/agents.json](../../src/data/agents.json) *— copie dev*.

```bash
bash scripts/run-evolution-pipeline.sh --file "trdata/VOTRE_EXPORT.xlsx"
node scripts/copy-data-for-netlify.js
npm run test:run
npm run build
ls -lh build/data/agents.json
```

**Résultats :** Excel → JSON · copie dans `public/data/` · **48 passed** · `agents.json` présent dans `build/data/`.

Tests unitaires :

| Fichier | Rôle | Tests |
|---------|------|-------|
| [`dataService.test.ts`](../../src/services/dataService.test.ts) | Chargement et filtres données | 12 |
| [`dataCalculations.test.ts`](../../src/utils/dataCalculations.test.ts) | Calculs ETP et agrégats | 20 |
| [`security.test.ts`](../../src/utils/security.test.ts) | Garde-fous sécurité | 15 |
| [`environment.test.ts`](../../src/utils/environment.test.ts) | Badge environnement | 1 |
| **Total** | | **48** |

---

## 1.3.6 — Écrire un script YAML d'intégration continue

> Chapitre : [1.3.6 Ecrire un script YAML d'Intégration Continue](../1.3%20R%C3%A9diger%20des%20scriptes%20dans%20la%20d%C3%A9marche%20DevOps/1.3.6%20Ecrire%20un%20script%20YAML%20d%E2%80%99Int%C3%A9gration%20Continue.md)

Écrire un **workflow YAML CI**, c’est décrire dans un fichier quand et comment lancer lint, tests et build sur GitHub Actions. Sur Hublot, [.github/workflows/ci.yml](../../.github/workflows/ci.yml) est la référence versionnée dans le dépôt.

*Structure type :* `on`, jobs parallèles, cache npm, artefact build. Copie livret : [Annexe 01](../Annexes/Annexe_01_build.yml) *— même contenu commenté*.

---

## 1.3.7 — Automatiser les tests en DevOps

> Chapitre : [1.3.7 Automatiser les tests en DevOps](../1.3%20R%C3%A9diger%20des%20scriptes%20dans%20la%20d%C3%A9marche%20DevOps/1.3.7%20Automatiser%20les%20tests%20en%20DevOps.md)

**Automatiser les tests en DevOps**, c’est lancer les mêmes commandes partout (local, CI, scripts deploy). Sur Hublot, `npm run test:run` est la référence unique pour les 48 tests Vitest.

L’automatisation des tests est le fil rouge du projet :

| Fichier | Rôle | Tests |
|---------|------|-------|
| [`dataService.test.ts`](../../src/services/dataService.test.ts) | Chargement et filtres | 12 |
| [`dataCalculations.test.ts`](../../src/utils/dataCalculations.test.ts) | Calculs ETP | 20 |
| [`security.test.ts`](../../src/utils/security.test.ts) | Sécurité applicative | 15 |
| [`environment.test.ts`](../../src/utils/environment.test.ts) | Environnement affiché | 1 |
| **Total Vitest** | | **48** |

`npm run test:run` — même commande en local, CI, [scripts/deploy-nas.sh](../../scripts/deploy-nas.sh) et après évolution données.

Copies livret : [Annexe 11](../Annexes/Annexe_11_dataService.test.ts) *— dataService* · [Annexe 12](../Annexes/Annexe_12_dataCalculations.test.ts) *— calculs*

---

# Synthèse — ce que couvre le projet

En une phrase : **Hublot** est une application RH déployée en production sur Netlify, validée par une CI à cinq jobs, testée par 48 tests unitaires et des scénarios Playwright, sécurisée en profondeur, alimentée par un pipeline de données reproductible, et documentée dans un livret PDF avec 13 annexes techniques.

**À rouvrir si besoin pendant la présentation :**

| Besoin | Fichier / lien |
|--------|----------------|
| App prod | [dirmhublot.netlify.app](https://dirmhublot.netlify.app) |
| CI | [.github/workflows/ci.yml](../../.github/workflows/ci.yml) · [Actions](https://github.com/Meriem1403/Hublot/actions/workflows/ci.yml) |
| CD | [netlify.toml](../../netlify.toml) · [.github/workflows/cd-netlify.yml](../../.github/workflows/cd-netlify.yml) |
| Sécurité | [.github/workflows/security-scan.yml](../../.github/workflows/security-scan.yml) · [.github/workflows/codeql.yml](../../.github/workflows/codeql.yml) |
| Données | [public/data/agents.json](../../public/data/agents.json) |
| Plan de test | [Annexe 08](../Annexes/Annexe_08_PLAN_TEST.md) *— tests et statuts* |
| Scénarios | [Annexe 13](../Annexes/Annexe_13_SCENARIOS_TEST.md) *— ST-F*, ST-SEC*, ST-AUTO* |
| Architecture | [Annexe 05](../Annexes/Annexe_05_ARCHITECTURE_DEPLOIEMENT.md) *— schéma déploiement* |
| Démo commandes | [Annexe 09](../Annexes/Annexe_09_DEMO_EPREUVE.md) *— procédure complète* |
| Démo Playwright | section [1.2.10](#1210--guide-playwright) · `npm run test:e2e:demo` |
| Livret | [Documentation_Complete_Fusionnee.pdf](./pdf/Documentation_Complete_Fusionnee.pdf) |
| Annexes PDF | [Documentation_Annexes_Fusionnee.pdf](./pdf/Documentation_Annexes_Fusionnee.pdf) |

Générer un PDF de ce guide :

```bash
npm run docs:pdf:one -- --input docs/Rendus/PRESENTATION_HUBLOT.md --output docs/Rendus/pdf/PRESENTATION_HUBLOT.pdf
```

**Résultat :** PDF généré dans `docs/Rendus/pdf/PRESENTATION_HUBLOT.pdf`.
