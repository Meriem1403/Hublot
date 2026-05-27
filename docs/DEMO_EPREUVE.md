# Procédure d'exécution des tests (épreuve)

Commandes et étapes pour **reproduire** les résultats du [PLAN_TEST.md](./PLAN_TEST.md) devant le jury.

**Annexe associée :** [Annexe 09](./Annexes/Annexe_09_DEMO_EPREUVE.md)

---

## Prérequis

```bash
cd /chemin/vers/StatDirm   # ou clone du dépôt Hublot
node -v                    # v18+ recommandé, CI utilise Node 20
npm ci
```

---

## 1. Tests unitaires (obligatoire)

```bash
npm run test:run
```

**Résultat attendu :** 33 tests passés, 0 échec.

**Capture jury :** terminal avec `Tests  33 passed` (ou équivalent Vitest).

---

## 2. Build de production

```bash
npm run build
ls -la build/index.html build/assets/
```

**Résultat attendu :** dossier `build/` créé avec `index.html` et sous-dossier `assets/`.

---

## 3. Audit des dépendances

```bash
npm audit --audit-level=high
```

**Résultat attendu :** rapport affiché (la CI ne bloque pas sur cette étape).

---

## 4. Application en local (DEV)

```bash
npm run dev
```

Ouvrir `http://localhost:5173` — vérifier :

- [ ] Page de connexion
- [ ] Connexion avec identifiants configurés (`.env` local)
- [ ] Navigation entre onglets principaux
- [ ] Filtres et cartes réactifs

---

## 5. Vérification CI (TEST)

1. Aller sur https://github.com/Meriem1403/Hublot/actions
2. Ouvrir le dernier run **CI** sur `main`
3. Vérifier : job vert, étapes Checkout → … → Build

**Phrase type jury :** « Chaque push sur main déclenche la même chaîne que localement : install, 32 tests, build. »

---

## 6. Production (PROD)

URL : https://dirmhublot.netlify.app

**Headers :**

```bash
curl -I https://dirmhublot.netlify.app
```

Vérifier `x-frame-options`, `x-content-type-options`.

**Tests manuels :** voir tableau [PLAN_TEST.md](./PLAN_TEST.md) (auth, responsive, performance perçue).

---

## 7. Rollback (démonstration optionnelle)

1. Netlify → **Deploys** → sélectionner un deploy antérieur → **Publish deploy**
2. Ou : `git revert` + push sur `main`

Détail : [DOCUMENTATION_DEPLOIEMENT.md](./DOCUMENTATION_DEPLOIEMENT.md#2-procédure-de-rollback)

---

## 8. NAS (optionnel)

Voir [DEPLOIEMENT_NAS_SYNOLOGY.md](./DEPLOIEMENT_NAS_SYNOLOGY.md).

---

## Ordre suggéré pour l'oral (5–10 min)

1. `npm run test:run` (2 min)
2. Onglet GitHub Actions (1 min)
3. Démo navigateur PROD ou DEV (3 min)
4. `curl -I` headers (30 s)
5. Mention rollback + sécurité ([SECURITE_4_DEPLOIEMENT.md](./SECURITE_4_DEPLOIEMENT.md))
