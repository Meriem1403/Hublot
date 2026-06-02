# 2️⃣ Les bases d'un environnement de test

**Projet :** Hublot — DIRM Méditerranée  
**Référentiel :** Préparer le déploiement d'une application sécurisée (Studi)

---

## Synthèse pour le jury

Le projet distingue **quatre niveaux** avant la production :

1. **DEV** — poste local, hot reload, fichier `.env.development`
2. **TEST** — GitHub Actions (CI) : lint, 32+ tests, audit, build, E2E
3. **STAGING** — branche `staging` sur Netlify (préproduction)
4. **PROD** — branche `main`, https://dirmhublot.netlify.app

Un **badge coloré** dans l'interface indique l'environnement (masqué en production).

---

## 1. DEV

```bash
npm ci && npm run dev
```

- URL : http://localhost:3000  
- Config : `.env.development` (versionné, comptes démo)  
- Rôle : développement sans impact sur les autres environnements

---

## 2. TEST (CI)

- Fichier : [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)  
- Déclenchement : push / PR sur `main` et `staging`  
- Chaîne : ESLint → Vitest → audit npm → build → Playwright  

**Rôle jury :** environnement reproductible, automatisé, qui bloque les régressions avant déploiement.

---

## 3. TEST local (QA)

```bash
npm run check:env
# ou
npm run test:preview:docker
```

- Fichiers : `.env.test`, `docker-compose.test.yml`  
- URL : http://localhost:4173  
- Rôle : valider le build statique avant staging/prod

---

## 4. STAGING et PROD

| | STAGING | PROD |
|---|---------|------|
| Branche | `staging` | `main` |
| Hébergeur | Netlify | Netlify |
| Variable | `VITE_APP_ENV=staging` | `production` |

Documentation complète : [ENVIRONNEMENT_TEST.md](../1.1 Les bases de la démarche DevOps/1.1.3 Les bases d'un environnement de test.md)
