# Documentation Hublot

Documentation du projet Hublot – Tableau de bord des effectifs et statistiques RH ([DIRM Méditerranée](https://www.dirm.mediterranee.developpement-durable.gouv.fr)).

## Architecture de déploiement et DevOps

| Document | Description |
|----------|-------------|
| [DEVOPS.md](./DEVOPS.md) | **Synthèse DevOps** — État des pratiques (CI, CD, lint, E2E, monitoring) |
| [CD_PIPELINES.md](./CD_PIPELINES.md) | **CI / CD séparés** — GitHub Actions vs Netlify vs NAS |
| [ENVIRONNEMENT_STAGING.md](./ENVIRONNEMENT_STAGING.md) | Branche `staging` + deploy previews Netlify |
| [MONITORING.md](./MONITORING.md) | Health check, Sentry, uptime |
| [SECURITE_AUDIT.md](./SECURITE_AUDIT.md) | Politique `npm audit` + allowlist |
| [ARCHITECTURE_DEPLOIEMENT.md](./ARCHITECTURE_DEPLOIEMENT.md) | **1️⃣ Architecture de déploiement** — Dépôt Git, workflow YAML, build automatique, déploiement automatique (CI/CD) |
| [ENVIRONNEMENT_TEST.md](./ENVIRONNEMENT_TEST.md) | **2️⃣ Environnement de test** — Environnements DEV, TEST et PROD |
| [SECURITE_4_DEPLOIEMENT.md](./SECURITE_4_DEPLOIEMENT.md) | **4️⃣ Sécurité** — HTTPS, variables d’env, secrets, headers, npm audit (très important pour DIRM ⚓) |
| [ENJEUX_PLAN_TEST.md](./ENJEUX_PLAN_TEST.md) | **Enjeux des plans de test** — Risques RH, pyramide, stratégie, lien Agile/DevOps |
| [PLAN_TEST.md](./PLAN_TEST.md) | **5️⃣ Plan de test** — Tableau Test / Objectif / Résultat / Statut + scénarios manuels |
| [SCENARIOS_TEST.md](./SCENARIOS_TEST.md) | **Élaborer des scénarios** — Étant donné / Quand / Alors (ST-F01…), sécurité, automatisés |
| [DEMO.md](./DEMO.md) / [DEMO_EPREUVE.md](./DEMO_EPREUVE.md) | Procédure d’exécution des tests (commandes ; version épreuve avec ordre oral) |
| [**DOCUMENTATION_DEPLOIEMENT.md**](./DOCUMENTATION_DEPLOIEMENT.md) | **Documentation du déploiement** — Procédure d’installation, rollback, architecture, capture du pipeline CI, logs de build |
| [**Annexes/**](./Annexes/README.md) | **Annexes** — Fichiers pièces jointes (Annexe 01 à 13) : CI, Netlify, plan et scénarios de test, sécurité, tests unitaires, etc. |

## Démarrage et déploiement

| Document | Description |
|----------|-------------|
| [QUICK_START.md](./QUICK_START.md) | Démarrage rapide |
| [HOSTING.md](./HOSTING.md) | Hébergement (Docker, Nginx, Netlify/Vercel) |
| [DEPLOIEMENT_NAS_SYNOLOGY.md](./DEPLOIEMENT_NAS_SYNOLOGY.md) | Déploiement sur NAS Synology (Container Manager) |
| [COMMENT_VOIR_LES_DONNEES_SUR_NETLIFY.md](./COMMENT_VOIR_LES_DONNEES_SUR_NETLIFY.md) | Voir les données sur Netlify (avec ou sans Neon) |
| [DOCKER.md](./DOCKER.md) | Guide Docker |
| [README.DOCKER.md](./README.DOCKER.md) | Compléments Docker |

## Sécurité et déploiement sécurisé

| Document | Description |
|----------|-------------|
| [DEPLOIEMENT_SECURISE.md](./DEPLOIEMENT_SECURISE.md) | Guide de déploiement sécurisé |
| [CHECKLIST_SECURITE.md](./CHECKLIST_SECURITE.md) | Checklist sécurité avant mise en production |
| [SECURITE.md](./SECURITE.md) | Mesures de sécurité de l’application |

## Données et modèle

| Document | Description |
|----------|-------------|
| [DATA_MODEL.md](./DATA_MODEL.md) | Modèle de données |
| [INTEGRATION_DONNEES.md](./INTEGRATION_DONNEES.md) | Intégration des données |
| [ANALYSE_DONNEES.md](./ANALYSE_DONNEES.md) | Analyse des données |

## Compétence et dépannage

| Document | Description |
|----------|-------------|
| [COMPETENCE_DEPLOIEMENT_STUDI.md](./COMPETENCE_DEPLOIEMENT_STUDI.md) | Validation compétence Studi (déploiement, CI/CD, tests) |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Dépannage |
| [PLAN_TRAVAIL.md](./PLAN_TRAVAIL.md) | Plan de travail |
| [VERIFICATION_COMPLETE.md](./VERIFICATION_COMPLETE.md) | Vérification complète |
| [VERIFICATION_ONGLETS.md](./VERIFICATION_ONGLETS.md) | Vérification des onglets |
