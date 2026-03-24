# 5️⃣ Plan de test

Chaque test est décrit avec un **objectif**, un **résultat attendu** et le **statut** constaté après exécution. La colonne **Type** indique si le test est **automatisé** (lancé en ligne de commande) ou **manuel** (à exécuter dans le navigateur). Les tests automatiques listés ci-dessous ont été exécutés ; les tests manuels sont à réaliser selon les scénarios détaillés, puis à marquer Passé ou Échec.

### Batterie de tests automatisés (32 tests)

| Fichier | Nombre de tests | Couverture |
|---------|-----------------|------------|
| **dataService.test.ts** | 12 | Filtres (région, service, DIRM Méditerranée, statut, mission), normalisation des agents (mapping région/service), chargement depuis `StatDirmData`. Voir **Annexe 11**. |
| **dataCalculations.test.ts** | 20 | Âge et tranches d’âge, ETP (temps plein / partiel), répartition par statut, par contrat, par genre, par responsabilité, par âge ; statistiques de vue d’ensemble ; statistiques par service (effectif, statut normal/fragile/critique). Voir **Annexe 12**. |

Commande : `npm run test:run` (exécution en local et en CI). Workflow CI : **Annexe 01**.

---

## Tableau des tests

| Test | Type | Objectif | Résultat attendu | Statut |
|------|------|----------|------------------|--------|
| **Tests unitaires automatisés (CI)** | Automatisé | Valider que les tests automatisés s’exécutent en intégration continue (DevOps). | `npm run test:run` réussit en local (32 tests, 2 fichiers). Le workflow GitHub Actions exécute les tests à chaque push/PR sur `main` ; job vert = tous les tests passent. | Passé |
| **Test build et déploiement** | Automatisé | Vérifier que le build et le déploiement automatiques fonctionnent. | `npm run build` réussit en local. CI (GitHub Actions) et déploiement Netlify réussissent après un push sur `main`. Site accessible à l’URL de production. | Passé |
| **Test vulnérabilités (npm audit)** | Automatisé | Vérifier l’état des vulnérabilités dans les dépendances. | `npm audit` exécuté à la racine ; rapport consulté. Vulnérabilités restantes documentées (dépendances de dev, plan de correction si besoin). | Passé |
| **Test authentification** | Manuel | Vérifier que l’accès au tableau de bord est protégé et que la connexion fonctionne. | Sans identifiants : redirection vers la page de connexion. Avec identifiants valides (variables d’env) : accès au tableau de bord. Déconnexion possible. | À exécuter |
| **Test API / chargement des données** | Manuel | Vérifier que les données (effectifs, statistiques) sont correctement chargées et affichées. | Les données sont récupérées (JSON ou Netlify Function). Les onglets affichent des chiffres cohérents, pas d’erreur en console. | À exécuter |
| **Test responsive** | Manuel | Vérifier que l’application est utilisable sur mobile, tablette et desktop. | Mise en page adaptée ; pas de débordement horizontal ; navigation et filtres utilisables sur petit écran. | À exécuter |
| **Test performance** | Manuel | Vérifier que le site se charge et répond dans un temps acceptable. | Premier chargement raisonnable. Navigation entre onglets fluide. | À exécuter |
| **Test des filtres** | Manuel | Vérifier que les filtres (région, service, statut) mettent à jour correctement les vues. | Sélection d’un filtre : tableaux et graphiques se mettent à jour. Filtre « DIRM Méditerranée » et autres options cohérents. | À exécuter |
| **Test sécurité (headers)** | Automatisé | Vérifier que les headers de sécurité sont envoyés en production. | `curl -I https://dirmhublot.netlify.app` : HTTPS, HSTS ; X-Frame-Options et X-Content-Type-Options si configurés (voir **Annexe 02**). | À vérifier |

---

## Détail des scénarios (optionnel)

### Test authentification

1. Ouvrir [https://dirmhublot.netlify.app](https://dirmhublot.netlify.app).
2. Sans se connecter : on doit être redirigé vers la page de connexion.
3. Saisir des identifiants invalides : message d’erreur, pas d’accès.
4. Saisir les identifiants configurés (variables d’environnement Netlify) : accès au tableau de bord.
5. Se déconnecter : retour à l’écran de connexion.

### Test API / chargement des données

1. Une fois connecté, parcourir chaque onglet (Vue d’ensemble, Vue dynamique, Effectifs par service, Par mission, Contrats, etc.).
2. Vérifier que des données s’affichent (nombres, graphiques, tableaux).
3. Ouvrir la console développeur (F12) : pas d’erreur réseau ou JavaScript bloquante.

### Test responsive

1. Ouvrir le site sur desktop, puis redimensionner la fenêtre (ou utiliser les outils de développement « mode appareil »).
2. Vérifier la lisibilité et l’utilisation des menus, filtres, tableaux et graphiques sur une largeur type mobile (ex. 375 px).

### Test performance

1. Charger la page en production (éventuellement avec « throttling » réseau).
2. Vérifier que la page devient interactive en quelques secondes.
3. Optionnel : `npm run build` et regarder la taille du bundle (ex. rapport Vite).

---

## Statut

Le statut indique le résultat de l’exécution du test :

- **Passé** : test exécuté, résultat conforme au résultat attendu.
- **Échec** : test exécuté, résultat non conforme (à corriger).
- **À exécuter** : test manuel à réaliser selon le scénario décrit (puis passer à Passé ou Échec).
- **À vérifier** : test dont le résultat doit être contrôlé (ex. headers après déploiement).

---

## Alignement avec le référentiel (compétence licence)

| Attendu du référentiel | Ce que ce plan couvre |
|------------------------|------------------------|
| **Enjeux des plans de test** | Tableau structuré (objectif, résultat attendu, statut) pour planifier et tracer les validations. |
| **Élaborer un scénario de test** | Scénarios détaillés pour authentification, API, responsive, performance (section « Détail des scénarios »). |
| **Environnement de test** | Tests en local (DEV), en CI (TEST) et en production (PROD) — voir **Annexe 06**. |
| **Tests de sécurité** | Test des headers, test des vulnérabilités (npm audit), authentification. |
| **Valider les résultats des tests** | Colonne **Statut** (Passé / Échec) ; CI exécute les tests unitaires automatiquement. |
| **Automatiser les tests en DevOps** | Ligne « Tests unitaires automatisés (CI) » ; workflow **Annexe 01** exécute `npm run test:run`. |

---

## Fichiers et annexes liés

| Annexe | Document | Description |
|--------|----------|-------------|
| **Annexe 09** | [Annexes/Annexe_09_DEMO.md](./Annexes/Annexe_09_DEMO.md) | Procédure d’exécution des tests (commandes) |
| **Annexe 06** | [Annexes/Annexe_06_ENVIRONNEMENT_TEST.md](./Annexes/Annexe_06_ENVIRONNEMENT_TEST.md) | Où exécuter les tests (DEV, TEST, PROD) |
| **Annexe 07** | [Annexes/Annexe_07_SECURITE_4_DEPLOIEMENT.md](./Annexes/Annexe_07_SECURITE_4_DEPLOIEMENT.md) | Contexte sécurité (HTTPS, headers, variables d’env) |
| **Annexe 01** | [Annexes/Annexe_01_build.yml](./Annexes/Annexe_01_build.yml) | CI : exécution automatique des tests unitaires et du build |

Index de toutes les annexes : [Annexes/README.md](./Annexes/README.md).
