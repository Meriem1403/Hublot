# Annexe 09 — Procédure d'exécution des tests

> Copie pour livrable — document principal : [1.2.8 Procédure d'exécution des tests](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.8%20Proc%C3%A9dure%20d%27ex%C3%A9cution%20des%20tests%20(%C3%A9preuve).md)

---

Ce document liste les **commandes à exécuter** pour reproduire les résultats du plan de test Hublot, alignées sur la CI (`.github/workflows/ci.yml`) et le site `https://dirmhublot.netlify.app`.

---

## Prérequis

```bash
git clone https://github.com/Meriem1403/Hublot.git
cd Hublot
node -v    # v18+ ; CI utilise Node 20
npm ci
npx playwright install chromium   # une fois
```

---

## Ordre d'exécution recommandé

| # | Action | Commande | Attendu |
|---|--------|----------|---------|
| 1 | Tests unitaires | `npm run test:run` | **48 tests** passés (4 fichiers Vitest) |
| 2 | Build production | `npm run build` | Dossier `build/` avec `index.html` + `assets/` |
| 3 | Audit dépendances prod | `npm run audit:prod` | Exit 0 (comme job CI `audit`) |
| 4 | Lint (optionnel local) | `npm run lint` | Aucune erreur bloquante |
| 5 | CI distante | GitHub Actions → workflow **CI** | Jobs lint, unit-tests, audit, build, e2e verts |
| 6 | E2E démo | `npm run test:e2e:demo` | 3 passed — `e2e/smoke.spec.ts` |
| 7 | Headers prod | `npm run security:headers` ou `curl -sI https://dirmhublot.netlify.app` | HTTPS, `X-Frame-Options`, `X-Content-Type-Options` |
| 8 | App locale (manuel) | `npm run dev` → http://localhost:5173 | Login, onglets, filtres (ST-F*) |
| 9 | Campagne scénarios | `npm run test:campaign` | ST-F01 à ST-F06 + ST-SEC01 (Playwright) |

---

## 1. Tests unitaires (obligatoire)

```bash
npm run test:run
```

**Résultat attendu :** `Tests  48 passed (48)` — fichiers : `dataService.test.ts` (12), `dataCalculations.test.ts` (20), `security.test.ts` (15), `environment.test.ts` (1).

---

## 2. Build de production

```bash
npm run build
ls -la build/index.html build/assets/
```

**Résultat attendu :** build réussi ; Netlify exécute la même commande.

---

## 3. Audit npm (production)

```bash
npm run audit:prod
```

**Résultat attendu :** exit 0 — identique au job **Audit npm (production)** de `ci.yml`.

---

## 4. Vérification CI (environnement TEST)

1. Ouvrir [github.com/Meriem1403/Hublot/actions/workflows/ci.yml](https://github.com/Meriem1403/Hublot/actions/workflows/ci.yml)
2. Dernier run **CI** sur `main` ou `staging` — tous les jobs verts
3. Chaîne : lint → 48 tests → audit → build → E2E

---

## 5. Tests E2E (Playwright)

```bash
npm run test:e2e:demo
```

**Résultat attendu :** 3 tests passés (login, dashboard, santé). Guide : [1.2.10 Guide Playwright](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.10%20Guide%20Playwright.md).

---

## 6. Headers de sécurité (production)

```bash
npm run security:headers
# ou
curl -sI https://dirmhublot.netlify.app
```

**À vérifier :** HTTPS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` (définis dans **Annexe 02**).

---

## 7. Garde-fous applicatifs (sécurité code)

```bash
npm run security:test
```

**Résultat attendu :** 15 tests passés — scénario **ST-SEC02**.

---

## 8. Application en local (optionnel)

```bash
npm run dev
```

Parcours manuel rapide : connexion, onglets, filtres — voir **Annexe 13** (ST-F01 à ST-F06).

---

## Résultats constatés (référence)

- **Tests unitaires :** 4 fichiers, **48 tests** Vitest — tous passent en local et en CI.
- **E2E :** 3 scénarios smoke en CI ; campagne étendue via `test:campaign`.
- **Build :** réussi ; sortie dans `build/`.
- **Audit prod :** bloquant en CI ; allowlist documentée dans [1.2.4.3](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.4.3%20Audit%20des%20d%C3%A9pendances.md).

**Rapport d'exécution :** [1.2.9 Rapport d'exécution des tests](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.9%20Rapport%20d%27ex%C3%A9cution%20des%20tests.md)  
**Validation des statuts :** [1.2.6 Valider les résultats des tests](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.6%20Valider%20les%20r%C3%A9sultats%20des%20tests.md)
