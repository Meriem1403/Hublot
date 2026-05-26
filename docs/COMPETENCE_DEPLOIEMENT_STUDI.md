# Validation compétence Studi : Préparer le déploiement d'une application sécurisée

**Application :** Hublot – Tableau de bord DIRM Méditerranée ([dirm.mediterranee.developpement-durable.gouv.fr](https://www.dirm.mediterranee.developpement-durable.gouv.fr), Ministère chargé de la Mer et de la Pêche)  
**Déploiement en ligne :** https://dirmhublot.netlify.app  
**Référentiel :** Programme en vigueur le 21/02/2024 – Déploiement, DevOps, CI/CD, tests, sécurité.

---

## 1. Déploiement continu (CD) et hébergement

- **Application hébergée et accessible :** https://dirmhublot.netlify.app  
- **Pipeline de déploiement :** À chaque `git push` sur la branche `main`, Netlify déclenche automatiquement un build puis un déploiement (livraison continue).
- **Configuration du déploiement :** Fichier **`netlify.toml`** à la racine du projet :
  - Commande de build : `npm run build`
  - Dossier publié : `build`
  - Règles de redirection (SPA, fonctions serverless).
- **Documentation du processus :** Voir **`HOSTING.md`** (options Docker, build manuel, Netlify/Vercel) et **`COMMENT_VOIR_LES_DONNEES_SUR_NETLIFY.md`** pour la mise en œuvre sur Netlify.

---

## 2. Intégration continue (CI) et YAML

- **Workflow d’intégration continue :** workflow GitHub Actions **« CI »** (fichier **`.github/workflows/ci.yml`**, **Annexe 01**) :
  - déclenchement sur `main`, `staging` et pull requests ;
  - **ESLint**, **`npm run test:run`** (32 tests), **`npm run audit:prod`**, **`npm run build`**, **Playwright E2E** ;
  - CD cloud : Netlify (fichier **`cd-netlify.yml`** + gate required checks) ;
  - CD NAS : **`cd-nas.yml`** + **`scripts/deploy-nas.sh`** (semi-automatisé).
- **Synthèse :** **`DEVOPS.md`**, **`CD_PIPELINES.md`**, **`MONITORING.md`**, **`ENVIRONNEMENT_STAGING.md`**.
- **Rédaction en YAML :** La pipeline CI est décrite en YAML (syntaxe et structure attendues dans le référentiel).
- **Automatisation des tests en DevOps :** Batterie de **32 tests** unitaires (Vitest), exécutés automatiquement dans le workflow CI. Fichiers : **`src/services/dataService.test.ts`** (12 tests : filtres région/service/statut/mission, DIRM Méditerranée, normalisation, chargement), **`src/utils/dataCalculations.test.ts`** (20 tests : âge, tranches d’âge, ETP, répartitions statut/contrat/genre/responsabilité/âge, vue d’ensemble, stats par service). Commande : `npm run test:run`.

---

## 3. Préparer le déploiement d’une application sécurisée

- **Authentification :** Page de connexion (identifiants configurés via variables d’environnement au build) ; accès aux données protégé après authentification.
- **Données sensibles :** Fichiers sensibles (`.env`, `agents.json`, données Excel, etc.) sont exclus du dépôt via **`.gitignore`** ; pas de secrets committés.
- **Documentation sécurité et déploiement :**
  - **`DEPLOIEMENT_SECURISE.md`** : étapes pour un déploiement sécurisé (HTTPS, Docker, firewall, etc.).
  - **`CHECKLIST_SECURITE.md`** : checklist avant mise en production (authentification, HTTPS, headers, Docker, sauvegardes).
  - **`SECURITE.md`** : mesures de sécurité implémentées dans l’application.
- **Environnement de test :** séparation **DEV**, **TEST** (CI), **TEST local** (`check:env`, Docker :4173), **STAGING**, **PROD** — voir **`ENVIRONNEMENT_TEST.md`**, fichiers `.env.development` / `.env.test`, badge UI hors production.
- **Scripts dans la démarche DevOps :**
  - Script de conversion des données : **`scripts/convert_excel_to_json.py`** (préparation des données pour l’app).
  - Scripts npm : `npm run build`, `npm run dev` ; possibilité d’utiliser `make` pour Docker et conversion (voir **`README.md`**).

---

## 4. Synthèse pour le jury

| Attendu du référentiel | Élément dans le projet |
|------------------------|-------------------------|
| Déploiement d’une application | Application en ligne : https://dirmhublot.netlify.app |
| Déploiement continu (CD) | Netlify : build + déploiement automatique à chaque push |
| Intégration continue (CI) | Workflow GitHub Actions – tests automatiques puis build |
| YAML | `netlify.toml`, `.github/workflows/ci.yml`, `cd-netlify.yml`, `cd-nas.yml` |
| Documentation du processus de déploiement | `DEVOPS.md`, `DOCUMENTATION_DEPLOIEMENT.md`, `HOSTING.md`, `README.md` (racine) |
| Application sécurisée | Authentification, `.gitignore` pour les secrets, docs sécurité |
| Scripts / automatisation | Scripts npm, Python (conversion), configuration Netlify |
| Environnement de test | **`ENVIRONNEMENT_TEST.md`** — DEV, TEST (CI), TEST local, STAGING, PROD ; `npm run check:env` |
| Plan de test, scénarios, validation | **`PLAN_TEST.md`** : tableau Test / Objectif / Résultat attendu / Statut (auth, API, responsive, performance, tests automatisés CI, sécurité). |

---

**Conclusion :** Le projet Hublot permet de valider la compétence « Préparer le déploiement d’une application sécurisée » et les éléments associés du référentiel Studi (démarche DevOps, bases du déploiement automatique, CI/CD, YAML, documentation et sécurisation).
