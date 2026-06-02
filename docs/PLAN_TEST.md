# 5️⃣ Plan de test

Chaque test est décrit avec un **objectif**, un **résultat attendu** et le **statut** constaté après exécution. La colonne **Type** indique si le test est **automatisé** ou **manuel**.

**Enjeux (référentiel Studi) :** voir [ENJEUX_PLAN_TEST.md](./ENJEUX_PLAN_TEST.md) — pourquoi planifier, risques RH, automatisation vs manuel, traçabilité.

**Méthode (planifier efficacement) :** voir [PLANIFIER_EFFICACEMENT_LES_TESTS.md](./PLANIFIER_EFFICACEMENT_LES_TESTS.md) — risques, pyramide, auto vs manuel, Definition of Done, commandes démo.

**Validation des résultats :** voir [VALIDER_RESULTATS_TESTS.md](./VALIDER_RESULTATS_TESTS.md) — statuts Passé/Échec, preuves, procédure, décision de livraison.

**Annexes :** [08](./Annexes/Annexe_08_PLAN_TEST.md) (plan synthétique) · [13](./Annexes/Annexe_13_SCENARIOS_TEST.md) (scénarios détaillés) · **Exécution :** [DEMO_EPREUVE.md](./DEMO_EPREUVE.md) · **Rapport :** [RAPPORT_EXECUTION_TESTS.md](./RAPPORT_EXECUTION_TESTS.md)

Document maître scénarios : [SCENARIOS_TEST.md](./SCENARIOS_TEST.md).

---

## Enjeux en résumé

| Enjeu | Comment le plan y répond |
|-------|---------------------------|
| **Données RH fiables** | 32 tests calculs/filtres + 15 tests sécurité applicative |
| **Pas de régression en CI/CD** | Workflow **CI** à chaque push (`main`, `staging`) |
| **Sécurité** | Auth, headers, audit npm, tests `security.test.ts`, E2E login |
| **Traçabilité jury** | Tableau Objectif / Résultat / **Statut** + logs Actions |
| **Coût maîtrisé** | Pyramide : beaucoup d'unitaires, peu d'E2E ciblés |

---

## Batterie automatisée (48 exécutions unitaires + CI)

| Fichier / outil | Nombre | Couverture |
|-----------------|--------|------------|
| **dataService.test.ts** | 12 | Filtres, normalisation, chargement — **Annexe 11** |
| **dataCalculations.test.ts** | 20 | Âge, ETP, répartitions, stats service — **Annexe 12** |
| **security.test.ts** | 15 | Sanitization, session, masquage RH — ST-SEC02 |
| **environment.test.ts** | 1 | Libellé environnement (DEV / staging…) |
| **e2e/smoke.spec.ts** | 3 | Login, dashboard, `/health.json` — Playwright en CI |
| **ESLint** | — | Qualité code (`npm run lint`) |
| **audit prod** | — | `npm run audit:prod` — **SECURITE_AUDIT.md** |

Commandes : `npm run test:run` · `npm run test:e2e` · workflow **CI** — **Annexe 01** (`ci.yml`).

---

## Tableau des tests

| Test | Type | Objectif | Résultat attendu | Statut |
|------|------|----------|------------------|--------|
| **Lint (ESLint)** | Automatisé | Détecter erreurs et mauvaises pratiques avant merge. | `npm run lint` sans erreur en local et en CI. | Passé |
| **Tests unitaires** | Automatisé | Valider la logique métier (filtres, statistiques) et les garde-fous sécurité. | `npm run test:run` : 48 tests passés (4 fichiers). CI verte. | Passé |
| **Tests E2E** | Automatisé | Valider le parcours critique (connexion, accès app). | `npm run test:e2e` : 3 scénarios Playwright passés en CI. | Passé |
| **Build production** | Automatisé | Vérifier que l'app compile pour Netlify/NAS. | `npm run build` → `build/index.html` + `assets/`. CI + Netlify OK. | Passé |
| **Audit npm (production)** | Automatisé | Limiter les vulnérabilités des dépendances runtime. | `npm run audit:prod` : critical bloquant ; high hors allowlist documentée. | Passé |
| **Test authentification** | Manuel | Accès protégé ; login / logout. | Page login sans session ; identifiants invalides refusés ; accès dashboard si valides. | **Passé** — ST-F01 ([rapport](./RAPPORT_EXECUTION_TESTS.md)) |
| **Test chargement des données** | Manuel | Données cohérentes sur tous les onglets. | Graphiques et tableaux alimentés ; pas d'erreur bloquante en console. | **Passé** — ST-F02 |
| **Test responsive** | Manuel | Usage mobile / tablette / desktop. | Pas de débordement ; filtres et onglets utilisables (≈ 375 px). | **Passé** — ST-F04 |
| **Test performance** | Manuel | Temps de chargement acceptable. | Page interactive en quelques secondes ; navigation fluide. | **Passé** — ST-F05 |
| **Test des filtres** | Manuel | Filtres globaux (région, service, statut, PASA…). | Sélection met à jour vues ; « DIRM Méditerranée » cohérent. | **Passé** — ST-F03 |
| **Test badge environnement** | Manuel | Distinguer DEV / staging de la PROD. | Badge visible hors production ; absent sur dirmhublot.netlify.app. | **Passé** — ST-F06 |
| **Test sécurité (headers)** | Automatisé | Headers durcis en production. | `curl -I https://dirmhublot.netlify.app` : HTTPS, `X-Frame-Options`, `X-Content-Type-Options`. | **Passé** — ST-SEC01 |

---

## Détail des scénarios manuels

Les scénarios **formalisés** (priorité, préconditions, *Étant donné / Quand / Alors*, traçabilité **ST-F***) sont dans **[SCENARIOS_TEST.md](./SCENARIOS_TEST.md)** — **Annexe 13**.

### Rappels exécution rapide

- **Auth** → ST-F01 · **Données** → ST-F02 · **Filtres** → ST-F03 · **Responsive** → ST-F04 · **Perf** → ST-F05 · **Badge** → ST-F06 · **Headers** → ST-SEC01

---

## Statuts

| Statut | Signification |
|--------|----------------|
| **Passé** | Exécuté, conforme au résultat attendu |
| **Échec** | Exécuté, non conforme — à corriger |
| **À exécuter** | Manuel à faire (puis Passé / Échec) |
| **À vérifier** | À contrôler après deploy (ex. headers) |

---

## Alignement référentiel Studi

| Attendu | Couverture |
|---------|------------|
| **Enjeux des plans de test** | [ENJEUX_PLAN_TEST.md](./ENJEUX_PLAN_TEST.md) |
| **Planifier efficacement** | [PLANIFIER_EFFICACEMENT_LES_TESTS.md](./PLANIFIER_EFFICACEMENT_LES_TESTS.md) |
| **Élaborer un scénario** | [SCENARIOS_TEST.md](./SCENARIOS_TEST.md) — Annexe 13 |
| **Environnement de test** | [ENVIRONNEMENT_TEST.md](./ENVIRONNEMENT_TEST.md) — Annexe 06 |
| **Tests de sécurité** | Auth, headers, audit — Annexe 07 |
| **Valider les résultats** | Colonne **Statut** + CI + [VALIDER_RESULTATS_TESTS.md](./VALIDER_RESULTATS_TESTS.md) |
| **Automatiser (DevOps)** | CI : lint, Vitest, E2E, audit, build |

---

## Annexes

| Annexe | Document |
|--------|----------|
| **08** | [Annexe_08_PLAN_TEST.md](./Annexes/Annexe_08_PLAN_TEST.md) |
| **13** | [Annexe_13_SCENARIOS_TEST.md](./Annexes/Annexe_13_SCENARIOS_TEST.md) |
| **09** | [Annexe_09_DEMO.md](./Annexes/Annexe_09_DEMO.md) |
| **06** | [Annexe_06_ENVIRONNEMENT_TEST.md](./Annexes/Annexe_06_ENVIRONNEMENT_TEST.md) |
| **07** | [Annexe_07_SECURITE_4_DEPLOIEMENT.md](./Annexes/Annexe_07_SECURITE_4_DEPLOIEMENT.md) |
| **01** | [Annexe_01_build.yml](./Annexes/Annexe_01_build.yml) (CI) |
| **11–12** | Tests unitaires sources |

Index : [Annexes/README.md](./Annexes/README.md).
