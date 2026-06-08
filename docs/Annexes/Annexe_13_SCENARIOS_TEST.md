# Annexe 13 — Scénarios de test

> Copie pour livrable — document principal : [1.2.2 Elaborer un scénario de test](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.2%20Elaborer%20un%20sc%C3%A9nario%20de%20test.md)

Document **opérationnel** pour élaborer et exécuter des scénarios, en complément de [1.2.1](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.1%20Les%20enjeux%20des%20plans%20de%20test.md) et **Annexe 08** (plan de test).

---

## 1. Ce qu'est un scénario de test

Un **scénario** décrit un comportement attendu de l'application dans un **cas d'usage identifié**. Il va plus loin qu'une ligne dans le plan de test :

| Élément | Rôle |
|---------|------|
| **Préconditions** | État du système avant l'action (données, session, URL) |
| **Actions** | Étapes ordonnées, reproductibles |
| **Résultats attendus** | Critères observables (OK / non OK) |
| **Trace** | Identifiant stable + lien vers ligne du plan |

**Convention de rédaction :** chaque scénario utilise la structure **Étant donné / Quand / Alors** (équivalent Gherkin *Given / When / Then*), largement utilisée en test et en Agile.

---

## 2. Correspondance avec le plan de test

| ID scénario | Ligne du plan ([Annexe 08](./Annexe_08_PLAN_TEST.md)) |
|-------------|------------------------------------------------------|
| ST-F01 | Test authentification |
| ST-F02 | Test chargement des données |
| ST-F03 | Test des filtres |
| ST-F04 | Test responsive |
| ST-F05 | Test performance |
| ST-F06 | Test badge environnement |
| ST-SEC01 | Headers HTTP en production |
| ST-SEC02 | Garde-fous applicatifs |
| ST-SEC03 | Aucun secret commité (Gitleaks) |
| ST-SEC04 | Dépendances de production |
| ST-SEC05 | Analyse statique (CodeQL) |
| ST-AUTO-* | Lint, 48 tests, E2E, build, audit:prod |

---

## 3. Méthode d'élaboration (checklist Studi)

1. **Identifier l'acteur** : utilisateur interne RH, développeur, CI.
2. **Définir le périmètre** : quel écran, quelles données métier réelles uniquement après connexion habilitée.
3. **Formuler une intention** en une phrase (ex. « un utilisateur non authentifié ne voit pas le tableau de bord »).
4. **Découper en étapes atomiques** (une action par étape lorsque possible).
5. **Rendre observable le succès** : texte visible, code HTTP, absence d'erreur console.
6. **Choisir l'environnement** : préférer **STAGING** pour les tests manuels hors DEV — voir [1.1.3](../1.1%20Les%20bases%20de%20la%20d%C3%A9marche%20DevOps/1.1.3%20Les%20bases%20d%27un%20environnement%20de%20test.md) — **Annexe 06**.

---

## 4. Scénarios fonctionnels (manuels)

### ST-F01 — Connexion refusée sans identifiants valides

| Champ | Détail |
|-------|--------|
| **Priorité** | Critique |
| **Type** | Manuel — sécurité / accès |
| **Plan** | Test authentification |
| **Environnement conseillé** | STAGING puis PROD (à valider après STAGING) |
| **Préconditions** | Aucune session active (nouvelle fenêtre privée ou `sessionStorage` vidé). URL de déploiement connue (variables Netlify définies). |

**Étant donné** que l'utilisateur ouvre la page d'accueil de Hublot **sans être connecté**,

**Quand** il saisit un identifiant ou un mot de passe **incorrect** et valide le formulaire,

**Alors** un message d'erreur explicite s'affiche **et** le tableau de bord (onglets, graphiques) **n'est pas** accessible.

**Étant donné** que l'utilisateur saisit les **identifiants valides** (conformément aux variables d'environnement du déploiement),

**Quand** il soumet le formulaire,

**Alors** le tableau de bord s'affiche **et** le bouton permettant de se déconnecter est visible (`title="Se déconnecter"`).

**Étant donné** que l'utilisateur est connecté,

**Quand** il déclenche la déconnexion et confirme si une boîte de dialogue apparaît,

**Alors** il revient à l'écran de connexion sans accès résiduel au contenu métier tant qu'il ne se reconnecte pas.

---

### ST-F02 — Chargement des données sur les principaux écrans

| Champ | Détail |
|-------|--------|
| **Priorité** | Critique |
| **Type** | Manuel — données / intégration |
| **Plan** | Test chargement des données |
| **Préconditions** | Utilisateur **connecté**. Données réelles configurées selon la procédure interne (`agents.json` / Neon — hors dépôt public). |

**Étant donné** que l'utilisateur est authentifié,

**Quand** il ouvre successivement au minimum trois onglets distincts (par ex. **Vue d'ensemble**, **Vue dynamique**, **effectifs ou missions**),

**Alors** chaque écran affiche des **éléments valorisés** (chiffres, graphiques ou tableaux non vides lorsque les données métier sont présentes),

**Et** aucune erreur **bloquante** n'apparaît dans la console développeur (F12 → Console) pour ces navigations,

**Et** les libellés de métier restent lisibles et cohérents avec la DIRM Méditerranée (pas de page blanche).

---

### ST-F03 — Filtres globaux et cohérence des vues

| Champ | Détail |
|-------|--------|
| **Priorité** | Haute |
| **Type** | Manuel — logique métier |
| **Plan** | Test des filtres |
| **Préconditions** | Utilisateur connecté sur un onglet avec filtres actifs (barre « Filtres »). |

**Étant donné** que les filtres sont à leur valeur par défaut (« tous » ou équivalent),

**Quand** l'utilisateur sélectionne une **région** ou un **service** dans la liste (ex. filtre « DIRM Méditerranée » si présent),

**Alors** les indicateurs et graphiques de l'onglet courant se **mettent à jour** sans rechargement complet anormal,

**Et** la sélection reste visible tant qu'il ne réinitialise pas les filtres.

**Quand** l'utilisateur réinitialise les filtres (bouton ou action prévue),

**Alors** la vue revient à l'état agrégé initial.

---

### ST-F04 — Utilisation sur petit écran (responsive)

| Champ | Détail |
|-------|--------|
| **Priorité** | Moyenne |
| **Type** | Manuel — ergonomie |
| **Plan** | Test responsive |
| **Préconditions** | Navigateur Chromium ou équivalent avec outils développeur. |

**Étant donné** une largeur viewport **375 px** (mobile type),

**Quand** l'utilisateur fait défiler la page et utilise les **onglets** et la zone **filtres**,

**Alors** le contenu ne déborde pas horizontalement de manière gênante,

**Et** au moins un graphique principal reste lisible ou accessible par défilement vertical.

---

### ST-F05 — Réactivité perçue (performance)

| Champ | Détail |
|-------|--------|
| **Priorité** | Moyenne |
| **Type** | Manuel — perception |
| **Plan** | Test performance |
| **Préconditions** | Connexion possible sur PROD ou STAGING. |

**Étant donné** que la page d'accueil métier est chargée (connexion OK),

**Quand** l'utilisateur enchaîne **trois changements d'onglet** en moins de 15 secondes,

**Alors** chaque transition s'effectue avec un délai **acceptable** (< 5 s perçues en réseau standard, hors cas extrême),

**Et** aucun gel prolongé sans retour utilisateur.

---

### ST-F06 — Distinction environnement développement vs production

| Champ | Détail |
|-------|--------|
| **Priorité** | Basse |
| **Type** | Manuel — environnement |
| **Plan** | Test badge environnement |
| **Préconditions** | Accès DEV local (`npm run dev`) et navigateur pour PROD. |

**Étant donné** l'application en **mode développement** local selon la doc,

**Quand** l'utilisateur affiche login ou tableau de bord,

**Alors** le **badge d'environnement** (étiquette type « Développement ») est visible conformément au code.

**Étant donné** l'URL de **production** officielle (`dirmhublot.netlify.app`),

**Quand** une session valide ou l'écran de login s'affiche,

**Alors** **aucun** badge orange / indication « staging » ou « preview » prévu pour les non-productions n'est affiché (comportement actuel).

---

## 5. Scénarios sécurité

### ST-SEC01 — Headers HTTP en production

| Champ | Détail |
|-------|--------|
| **Priorité** | Haute |
| **Type** | Semi-automatisable (CLI) |
| **Plan** | Test sécurité (headers) |
| **Trace** | [1.2.4.2 Sécurité du déploiement](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.4.2%20S%C3%A9curit%C3%A9%20du%20d%C3%A9ploiement.md), Annexe 02 |

**Étant donné** le site déployé en HTTPS sur Netlify,

**Quand** l'exécutant lance :

```bash
curl -sI https://dirmhublot.netlify.app
```

**Alors** la réponse utilise **HTTPS** ou une redirection équivalente sûre,

**Et** au moins les en-têtes **X-Frame-Options** et **X-Content-Type-Options** sont présents avec des valeurs restrictives (**Annexe 02**),

**Et** le statut HTTP est acceptable (200, 304, etc.).

**Automatisation :** `npm run security:headers` (`scripts/check-security-headers.sh`).

---

### ST-SEC02 — Garde-fous applicatifs

| Champ | Détail |
|-------|--------|
| **Priorité** | Haute |
| **Type** | Automatisé (Vitest) |
| **Plan** | Test sécurité (code) |
| **Trace** | `src/utils/security.test.ts`, [1.2.4](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.4%20Les%20outils%20et%20les%20strat%C3%A9gies%20des%20tests%20de%20s%C3%A9curit%C3%A9.md) |

**Étant donné** les utilitaires (`sanitizeInput`, `validateFilter`, masquage RH, session),

**Quand** `npm run security:test` est exécuté,

**Alors** les 15 tests passent (entrées dangereuses nettoyées, filtre hors liste refusé, session > 8 h expirée).

---

### ST-SEC03 — Aucun secret commité (Gitleaks)

| Champ | Détail |
|-------|--------|
| **Priorité** | Critique |
| **Type** | Automatisé (CI — bloquant) |
| **Trace** | `.github/workflows/security-scan.yml`, `.gitleaks.toml` |

**Étant donné** l'arborescence du dépôt,

**Quand** Gitleaks scanne les fichiers,

**Alors** aucun secret réel n'est détecté (sinon le job échoue).

---

### ST-SEC04 — Dépendances de production maîtrisées

| Champ | Détail |
|-------|--------|
| **Priorité** | Critique |
| **Type** | Automatisé (CI) |
| **Trace** | `ci.yml`, `security-scan.yml`, [1.2.4.3](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.4.3%20Audit%20des%20d%C3%A9pendances.md) |

**Étant donné** les dépendances de production,

**Quand** `npm run audit:prod` puis Trivy s'exécutent,

**Alors** aucune CVE *critical* (ni *high* hors allowlist documentée).

---

### ST-SEC05 — Analyse statique du code (SAST)

| Champ | Détail |
|-------|--------|
| **Priorité** | Haute |
| **Type** | Automatisé (CI — informatif) |
| **Trace** | `.github/workflows/codeql.yml` |

**Étant donné** le code JS/TS,

**Quand** CodeQL analyse le dépôt,

**Alors** les alertes sont publiées dans *Security > Code scanning*.

---

## 6. Scénarios couverts par l'automatisation (référence)

Ces comportements correspondent à une **suite automatisée** ; le scénario « métier » est : *À chaque intégration, la chaîne bloque la livraison si la qualité n'est pas atteinte.*

| ID | Intention métier technique | Moyen |
|----|----------------------------|-------|
| ST-AUTO-01 | Pas de violation des règles ESLint | `npm run lint` dans la CI |
| ST-AUTO-02 | Régression filtres / calculs | `npm run test:run` (**48 tests** Vitest) |
| ST-AUTO-03 | Régression login / santé | `npm run test:e2e` (`e2e/smoke.spec.ts`) |
| ST-AUTO-04 | Artefact déployable | `npm run build` + vérif `build/` |
| ST-AUTO-05 | Risque dépendances prod | `npm run audit:prod` |

Détail d'exécution : [Annexe 09](./Annexe_09_DEMO_EPREUVE.md) — [1.2.8](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.8%20Proc%C3%A9dure%20d%27ex%C3%A9cution%20des%20tests%20(%C3%A9preuve).md).

---

## 7. Gabarit pour nouveau scénario

Copier-colier et renseigner :

```
### ST-FXX — [Titre court]

| Champ | Détail |
|-------|--------|
| **Priorité** | Critique / Haute / Moyenne / Basse |
| **Type** | Manuel / Automatisé |
| **Plan** | [Référencer Annexe 08 / 1.2.1] |
| **Environnement** | DEV / STAGING / PROD |
| **Préconditions** | ... |

**Étant donné** ...

**Quand** ...

**Alors** ...

**Trace** | Exécutant : ___ — Date : ___ — Statut : Passé / Échec |
```

---

## 8. Suivi d'exécution

| ID | Scénario | Exécutant | Date | Environnement | Résultat |
|----|----------|-----------|------|----------------|----------|
| ST-F01 | Authentification | Playwright + revue PROD | 2026-05-27 | QA local + PROD | **Passé** |
| ST-F02 | Chargement données | Playwright | 2026-05-27 | QA local (`build:e2e`) | **Passé** |
| ST-F03 | Filtres | Playwright | 2026-05-27 | QA local | **Passé** |
| ST-F04 | Responsive | Playwright | 2026-05-27 | QA local (375px) | **Passé** |
| ST-F05 | Performance | Playwright | 2026-05-27 | QA local | **Passé** |
| ST-F06 | Badge environnement | Playwright | 2026-05-27 | QA local + PROD | **Passé** |
| ST-SEC01 | Headers | `security:headers` + Playwright | 2026-05-27 | PROD | **Passé** |
| ST-SEC02 | Garde-fous applicatifs | `security:test` | — | CI / local | **Passé** (15 tests) |

**Rapport détaillé :** [1.2.9 Rapport d'exécution des tests](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.9%20Rapport%20d%27ex%C3%A9cution%20des%20tests.md)  
**Commande de reproduction :** `npm run test:campaign`

> **Note staging :** l’URL `staging--dirmhublot.netlify.app` renvoie 404 (branch deploy à activer). Campagne validée en QA local + contrôles PROD en lecture seule.
