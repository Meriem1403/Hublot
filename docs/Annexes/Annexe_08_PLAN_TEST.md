# Annexe 08 — Plan de test

> Copie pour livrable — documents principaux : [1.2.1 Les enjeux des plans de test](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.1%20Les%20enjeux%20des%20plans%20de%20test.md), [1.3.7 Automatiser les tests en DevOps](../1.3%20R%C3%A9diger%20des%20scriptes%20dans%20la%20d%C3%A9marche%20DevOps/1.3.7%20Automatiser%20les%20tests%20en%20DevOps.md)

---

Chaque test est décrit avec un **objectif**, un **résultat attendu** et le **statut** constaté. La colonne **Type** indique si le test est **automatisé** ou **manuel**.

**Liens :** [Annexe 13](./Annexe_13_SCENARIOS_TEST.md) (scénarios ST-*) · [Annexe 09](./Annexe_09_DEMO_EPREUVE.md) (procédure) · [1.2.9 Rapport d'exécution](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.9%20Rapport%20d%27ex%C3%A9cution%20des%20tests.md)

---

## Enjeux en résumé

| Enjeu | Comment le plan y répond |
|-------|---------------------------|
| **Données RH fiables** | 20 + 12 tests unitaires + scénarios ST-F02, ST-F03 |
| **Pas de régression CI/CD** | Workflow **CI** sur `main` / `staging` |
| **Sécurité** | ST-SEC01 à 05, auth, audit prod, Gitleaks |
| **Traçabilité** | IDs ST-*, statuts, logs GitHub Actions |
| **Coût maîtrisé** | Pyramide : 48 tests unitaires, 3 E2E smoke, contrôles manuels ciblés |

---

## Batterie automatisée (48 tests unitaires + CI)

| Fichier / outil | Nombre | Couverture |
|-----------------|--------|------------|
| **dataService.test.ts** | 12 | Filtres, normalisation, chargement — **Annexe 11** |
| **dataCalculations.test.ts** | 20 | Âge, ETP, répartitions, stats — **Annexe 12** |
| **security.test.ts** | 15 | Sanitization, session, masquage RH |
| **environment.test.ts** | 1 | Libellé environnement (DEV / staging…) |
| **e2e/smoke.spec.ts** | 3 | Login, dashboard, `/health.json` — CI |
| **ESLint** | — | `npm run lint` |
| **audit prod** | — | `npm run audit:prod` |

Commandes : `npm run test:run` · `npm run test:e2e` · workflow **CI** — **Annexe 01** (`.github/workflows/ci.yml`).

---

## Tableau des tests

| Test | Type | Objectif | Résultat attendu | Statut |
|------|------|----------|------------------|--------|
| **Lint (ESLint)** | Automatisé | Qualité code avant merge | `npm run lint` OK en local et CI | Passé |
| **Tests unitaires** | Automatisé | Logique métier + sécurité session | `npm run test:run` : **48 tests**, 4 fichiers | Passé |
| **Tests E2E** | Automatisé | Parcours critique | `npm run test:e2e` : 3 scénarios smoke | Passé |
| **Build production** | Automatisé | Artefact Netlify/NAS | `build/index.html` + `assets/` | Passé |
| **Audit npm (production)** | Automatisé | Vulnérabilités runtime | `npm run audit:prod` exit 0 | Passé |
| **Authentification** | Manuel / E2E | Accès protégé | ST-F01 | Passé |
| **Chargement données** | Manuel / E2E | Cohérence onglets | ST-F02 | Passé |
| **Filtres** | Manuel / E2E | Filtres globaux | ST-F03 | Passé |
| **Responsive** | Manuel / E2E | Mobile ~375 px | ST-F04 | Passé |
| **Performance** | Manuel / E2E | Réactivité onglets | ST-F05 | Passé |
| **Badge environnement** | Manuel / E2E | DEV vs PROD | ST-F06 | Passé |
| **Headers HTTP** | Auto + manuel | Durcissement prod | ST-SEC01 | Passé |
| **Garde-fous code** | Automatisé | `security.test.ts` | ST-SEC02 | Passé |
| **Secrets (Gitleaks)** | Automatisé | CI `security-scan.yml` | ST-SEC03 | Passé |
| **Dépendances prod** | Automatisé | audit + Trivy | ST-SEC04 | Passé |
| **SAST (CodeQL)** | Automatisé | `codeql.yml` | ST-SEC05 | Passé |

---

## Scénarios détaillés

Formalisation *Étant donné / Quand / Alors* : [1.2.2 Elaborer un scénario de test](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.2%20Elaborer%20un%20sc%C3%A9nario%20de%20test.md) — **Annexe 13**.

---

## Statuts

| Statut | Signification |
|--------|----------------|
| **Passé** | Conforme au résultat attendu |
| **Échec** | Non conforme — correction requise |
| **À exécuter** | Manuel restant |
| **À vérifier** | À contrôler après deploy |

---

## Alignement référentiel

| Attendu | Document |
|---------|----------|
| Enjeux | [1.2.1](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.1%20Les%20enjeux%20des%20plans%20de%20test.md) |
| Scénarios | [1.2.2](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.2%20Elaborer%20un%20sc%C3%A9nario%20de%20test.md) — Annexe 13 |
| Environnements | [1.1.3](../1.1%20Les%20bases%20de%20la%20d%C3%A9marche%20DevOps/1.1.3%20Les%20bases%20d%27un%20environnement%20de%20test.md) — Annexe 06 |
| Sécurité | Annexe 07 |
| Exécution | Annexe 09 — [1.2.8](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.8%20Proc%C3%A9dure%20d%27ex%C3%A9cution%20des%20tests%20(%C3%A9preuve).md) |

Index : [Annexes/README.md](./README.md).
