# Environnement de staging (préproduction)

Complète [ENVIRONNEMENT_TEST.md](./ENVIRONNEMENT_TEST.md) avec un **environnement intermédiaire** entre la CI et la production.

---

## Les trois niveaux + staging

| Niveau | Où | URL type |
|--------|-----|----------|
| **DEV** | `npm run dev` | `http://localhost:5173` |
| **TEST** | GitHub Actions — workflow **CI** | Onglet Actions |
| **STAGING** | Branche `staging` ou Deploy Preview PR | `staging--dirmhublot.netlify.app` ou URL preview |
| **PROD** | Branche `main` | https://dirmhublot.netlify.app |

---

## 1. Branche `staging` sur Netlify

### Création

```bash
git checkout -b staging
git push -u origin staging
```

### Configuration Netlify

1. **Site configuration** → **Build & deploy** → **Branches and deploy contexts**
2. Activer **Branch deploys** pour la branche `staging`
3. La config `netlify.toml` définit déjà :

```toml
[context.staging.environment]
  VITE_APP_ENV = "staging"
```

### Variables d’environnement

Sur Netlify, contexte **staging** (ou branch deploy) :

- `VITE_APP_USERNAME` / `VITE_APP_PASSWORD` — comptes de test (différents de la prod si possible)
- `VITE_SENTRY_DSN` — optionnel, environnement `staging` dans Sentry

### CI

La workflow **CI** s’exécute aussi sur `staging` (mêmes jobs que `main`).

---

## 2. Deploy Previews (pull requests)

Pour chaque PR vers `main` :

1. Netlify → activer **Deploy Previews**
2. URL du type `deploy-preview-NN--dirmhublot.netlify.app`
3. Variable `VITE_APP_ENV=preview` (défini dans `netlify.toml`)

**Usage jury :** démontrer une fonctionnalité sans toucher la PROD.

---

## 3. Promotion staging → production

1. Merge `staging` → `main` (ou PR)
2. CI verte sur `main`
3. Netlify déploie la production (après required checks)

---

## Checklist activation staging

- [ ] Branche `staging` poussée sur GitHub
- [ ] Branch deploys activés sur Netlify
- [ ] Variables d’env staging configurées
- [ ] CI verte sur `staging`
- [ ] URL staging testée (login + un onglet)
