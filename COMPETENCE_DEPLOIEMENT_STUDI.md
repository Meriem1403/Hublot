# Validation compétence Studi : Préparer le déploiement d'une application sécurisée

**Application :** Hublot – Tableau de bord DIRM (Direction générale des Affaires maritimes, de la Pêche et de l'Aquaculture)  
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

- **Workflow d’intégration continue :** Le dépôt contient un workflow GitHub Actions (fichier **`.github/workflows/build.yml`**) qui :
  - se déclenche sur chaque push et pull request sur `main` ;
  - exécute `npm ci`, puis **`npm run test:run`** (tests unitaires), puis `npm run build`.
- **Rédaction en YAML :** La pipeline CI est décrite en YAML (syntaxe et structure attendues dans le référentiel).
- **Automatisation des tests en DevOps :** Les tests unitaires (Vitest) sont exécutés automatiquement dans le workflow CI. Fichiers de tests : **`src/services/dataService.test.ts`** (filtres, DIRM Méditerranée), **`src/utils/dataCalculations.test.ts`** (calcul d’âge, tranches d’âge). Commande : `npm run test:run`.

---

## 3. Préparer le déploiement d’une application sécurisée

- **Authentification :** Page de connexion (identifiants configurés via variables d’environnement au build) ; accès aux données protégé après authentification.
- **Données sensibles :** Fichiers sensibles (`.env`, `agents.json`, données Excel, etc.) sont exclus du dépôt via **`.gitignore`** ; pas de secrets committés.
- **Documentation sécurité et déploiement :**
  - **`DEPLOIEMENT_SECURISE.md`** : étapes pour un déploiement sécurisé (HTTPS, Docker, firewall, etc.).
  - **`CHECKLIST_SECURITE.md`** : checklist avant mise en production (authentification, HTTPS, headers, Docker, sauvegardes).
  - **`SECURITE.md`** : mesures de sécurité implémentées dans l’application.
- **Environnement de test :** Possibilité de lancer l’application en local (`npm run dev`) ou avec Docker (`make dev` / `docker-compose`) pour tester avant déploiement.
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
| YAML | `netlify.toml`, `.github/workflows/build.yml` |
| Documentation du processus de déploiement | `HOSTING.md`, `DEPLOIEMENT_SECURISE.md`, `README.md` |
| Application sécurisée | Authentification, `.gitignore` pour les secrets, docs sécurité |
| Scripts / automatisation | Scripts npm, Python (conversion), configuration Netlify |
| Environnement de test | Instructions en local et Docker dans `README.md` et `HOSTING.md` |

---

**Conclusion :** Le projet Hublot permet de valider la compétence « Préparer le déploiement d’une application sécurisée » et les éléments associés du référentiel Studi (démarche DevOps, bases du déploiement automatique, CI/CD, YAML, documentation et sécurisation).
