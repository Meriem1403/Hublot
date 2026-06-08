# Annexe 10 — Validation compétence Studi

> Copie pour livrable — alignée sur les chapitres 1.1, 1.2 et 1.3 du dossier `docs/`.

---

# Validation compétence : Préparer le déploiement d'une application sécurisée

**Application :** Hublot — tableau de bord DIRM Méditerranée  
**Dépôt :** [github.com/Meriem1403/Hublot](https://github.com/Meriem1403/Hublot)  
**Déploiement en ligne :** https://dirmhublot.netlify.app  
**Référentiel :** Déploiement, DevOps, CI/CD, tests, sécurité (programme Studi).

---

## 1. Déploiement continu (CD) et hébergement

- **Application accessible :** https://dirmhublot.netlify.app (HTTPS Netlify).
- **CD :** à chaque `git push` sur `main`, Netlify build et publie le dossier `build/` (voir **Annexe 02**).
- **Configuration :** `netlify.toml` — commande `npm run build`, publish `build`, redirects SPA, headers de sécurité.
- **Documentation :** [1.2.7 Documenter le processus de déploiement](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.7%20Documenter%20le%20processus%20de%20d%C3%A9ploiement.md), [1.1.5 CD](../1.1%20Les%20bases%20de%20la%20d%C3%A9marche%20DevOps/1.1.5%20La%20mise%20en%20place%20de%20la%20livraison%20ou%20d%C3%A9ploiement%20continu%20(CD).md), **Annexe 05**.

---

## 2. Intégration continue (CI) et YAML

- **Workflow CI :** GitHub Actions, nom **CI**, fichier `.github/workflows/ci.yml` (**Annexe 01**).
- **Déclencheurs :** push et pull request sur `main` et `staging`, `workflow_dispatch`.
- **Jobs :** ESLint → `npm run test:run` (**48 tests** Vitest) → `npm run audit:prod` → `npm run build` → `npm run test:e2e` (Playwright).
- **YAML :** `ci.yml`, `netlify.toml`, workflows `cd-netlify.yml`, `security-scan.yml`, `codeql.yml`.
- **Documentation :** [1.1.4 CI](../1.1%20Les%20bases%20de%20la%20d%C3%A9marche%20DevOps/1.1.4%20La%20mise%20en%20place%20de%20l%27int%C3%A9gration%20continue%20(CI).md), [1.1.6 Introduction au YAML](../1.1%20Les%20bases%20de%20la%20d%C3%A9marche%20DevOps/1.1.6%20Introduction%20au%20YAML.md), [1.3.6 Écrire un script YAML d'Intégration Continue](../1.3%20R%C3%A9diger%20des%20scriptes%20dans%20la%20d%C3%A9marche%20DevOps/1.3.6%20Ecrire%20un%20script%20YAML%20d%E2%80%99Int%C3%A9gration%20Continue.md).

**Tests automatisés :**

| Fichier | Tests | Annexe |
|---------|-------|--------|
| `src/services/dataService.test.ts` | 12 | 11 |
| `src/utils/dataCalculations.test.ts` | 20 | 12 |
| `src/utils/security.test.ts` | 15 | — |
| `src/config/environment.test.ts` | 1 | — |

Commande : `npm run test:run`. Détail : [1.3.7 Automatiser les tests en DevOps](../1.3%20R%C3%A9diger%20des%20scriptes%20dans%20la%20d%C3%A9marche%20DevOps/1.3.7%20Automatiser%20les%20tests%20en%20DevOps.md).

---

## 3. Application sécurisée

- **Authentification :** page de connexion ; variables `VITE_APP_USERNAME` / `VITE_APP_PASSWORD` au build (Netlify).
- **Données sensibles :** `.gitignore` (**Annexe 04**) — pas de `agents.json` ni `.env` secrets dans Git.
- **Headers HTTP :** `netlify.toml` — **Annexe 02** ; scénario **ST-SEC01**.
- **Sécurité applicative :** `src/utils/security.ts`, 15 tests — **ST-SEC02** ; Gitleaks / Trivy / CodeQL — **ST-SEC03** à **05**.
- **Documentation :** [1.2.4 Tests de sécurité](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.4%20Les%20outils%20et%20les%20strat%C3%A9gies%20des%20tests%20de%20s%C3%A9curit%C3%A9.md), **Annexe 07**, [1.2.4.4 Checklist sécurité](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.4.4%20Checklist%20s%C3%A9curit%C3%A9.md).

---

## 4. Environnements, plan de test, scripts

| Attendu référentiel | Élément Hublot |
|----------------------|----------------|
| Environnements DEV / TEST / PROD | [1.1.3](../1.1%20Les%20bases%20de%20la%20d%C3%A9marche%20DevOps/1.1.3%20Les%20bases%20d%27un%20environnement%20de%20test.md) — **Annexe 06** |
| Plan de test | [1.2.1](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.1%20Les%20enjeux%20des%20plans%20de%20test.md), **Annexe 08** |
| Scénarios de test | [1.2.2](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.2%20Elaborer%20un%20sc%C3%A9nario%20de%20test.md) — **Annexe 13** |
| Exécution / rapport | **Annexe 09**, [1.2.9](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.9%20Rapport%20d%27ex%C3%A9cution%20des%20tests.md) |
| Scripts d'évolution données | [1.3.3](../1.3%20R%C3%A9diger%20des%20scriptes%20dans%20la%20d%C3%A9marche%20DevOps/1.3.3%20Les%20bases%20des%20scripts%20d%27%C3%A9volution.md), `scripts/run-evolution-pipeline.sh` |
| Déploiement NAS | [1.3.2](../1.3%20R%C3%A9diger%20des%20scriptes%20dans%20la%20d%C3%A9marche%20DevOps/1.3.2%20R%C3%A9diger%20et%20utiliser%20un%20script%20de%20d%C3%A9ploiement.md) |

---

## 5. Synthèse

Le projet Hublot couvre la compétence « Préparer le déploiement d'une application sécurisée » : **CI bloquante** (48 tests, lint, audit prod, E2E), **CD Netlify**, **documentation structurée** (parcours 1.1 / 1.2 / 1.3), **annexes numérotées** 01 à 13 et **sécurisation** (auth, headers, scan secrets, audit dépendances, SAST).

Index des annexes : [README.md](./README.md).
