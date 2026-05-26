# Annexe 06 — Environnements DEV, TEST, PROD

> Copie pour livrable — document principal : `../ENVIRONNEMENT_TEST.md`

---

# 2️⃣ Environnement de test

Définition des environnements **DEV**, **TEST** et **PROD** pour le projet Hublot.

**Annexe associée :** [Annexe 06](./Annexes/Annexe_06_ENVIRONNEMENT_TEST.md)

---

## Vue d'ensemble

| Environnement | Rôle | Où | Accès |
|---------------|------|-----|--------|
| **DEV** | Développement et debug local | Poste développeur | `http://localhost:5173` |
| **TEST** | Validation automatisée (CI) | GitHub Actions | Onglet Actions (run vert) |
| **PROD** | Utilisation réelle | Netlify (+ option NAS) | https://dirmhublot.netlify.app |

---

## DEV — Développement

### Objectif

Coder, tester manuellement, itérer rapidement sans impacter la production.

### Configuration

```bash
npm ci
npm run dev
```

| Élément | Valeur |
|---------|--------|
| URL | `http://localhost:5173` |
| Build | Non (Vite HMR) |
| Données | Référentiel local ou API de test (hors dépôt public) |
| Secrets | Fichier `.env` local (non commité) |
| Authentification | Variables `VITE_APP_USERNAME` / `VITE_APP_PASSWORD` |

### Commandes utiles

```bash
npm run test:run    # tests avant commit
npm run build       # vérifier le build localement
```

---

## TEST — Intégration continue

### Objectif

Vérifier automatiquement que chaque modification sur `main` (ou PR) respecte la qualité minimale avant / pendant le déploiement.

### Configuration

| Élément | Détail |
|---------|--------|
| Plateforme | GitHub Actions |
| Workflow | `CI/CD Pipeline` (`.github/workflows/build.yml`) |
| Déclencheurs | `push` et `pull_request` sur `main`, `workflow_dispatch` |
| Runner | `ubuntu-latest`, Node.js 20 |

### Étapes exécutées

1. `npm ci`
2. `npm run test:run` (32 tests)
3. `npm run build`
4. Vérification du dossier `build/`
5. `npm audit --audit-level=high` (informatif)

### Critère de succès

- Job **Tests et build** en statut **success** (coche verte)
- Aucune régression sur les tests unitaires
- Build reproductible

### Où consulter

- GitHub → **Actions** → workflow **CI/CD Pipeline**
- Exemple : https://github.com/Meriem1403/Hublot/actions

---

## PROD — Production

### Objectif

Servir l'application aux utilisateurs habilités en conditions sécurisées.

### Configuration cloud (Netlify)

| Paramètre | Valeur |
|-----------|--------|
| URL | https://dirmhublot.netlify.app |
| Branche déployée | `main` |
| Build command | `npm run build` |
| Publish directory | `build` |
| HTTPS | Fourni par Netlify |
| Headers sécurité | `netlify.toml` |
| Variables d'env | Interface Netlify (auth, `NETLIFY_DATABASE_URL`) |

### Configuration locale (NAS — optionnelle)

| Paramètre | Valeur |
|-----------|--------|
| URL | `http://IP_DU_NAS:8080` |
| Stack | Docker + Nginx (`docker-compose.yml`) |
| Données | Même référentiel que la prod ou jeu interne |
| HTTPS | Reverse Proxy DSM (optionnel) |

Voir [DEPLOIEMENT_NAS_SYNOLOGY.md](./DEPLOIEMENT_NAS_SYNOLOGY.md).

---

## Environnement de préproduction (Deploy Preview)

Netlify peut générer des **Deploy Previews** sur les pull requests (si activé dans les paramètres du site).

| Usage | Bénéfice |
|-------|----------|
| Valider une PR avant merge | URL temporaire par branche |
| Démonstration jury | Montrer une version sans toucher la PROD |

---

## Matrice des tests par environnement

| Type de test | DEV | TEST (CI) | PROD |
|--------------|-----|-----------|------|
| Tests unitaires Vitest | `npm run test:run` | Automatique | — |
| Build production | `npm run build` | Automatique | Automatique (Netlify) |
| Tests manuels (UI, filtres) | Navigateur local | — | Navigateur production |
| Headers sécurité | — | — | `curl -I` sur URL prod |
| npm audit | Local | CI (informatif) | Recommandé avant release |

Plan détaillé : [PLAN_TEST.md](./PLAN_TEST.md)

---

## Bonnes pratiques

1. Toujours lancer `npm run test:run` avant un push important.
2. Ne jamais committer `.env`, données RH ou secrets.
3. Vérifier le run CI vert avant de considérer une livraison terminée.
4. En cas de bug en PROD : rollback Netlify + analyse des logs (Actions + Netlify Deploys).
