# Démarche DevOps — Hublot

État **réel** et **documenté** de la chaîne Dev → CI → CD → PROD.

---

## Matrice des pratiques

| Pratique | Statut | Implémentation |
|----------|--------|----------------|
| Versionnement Git | ✅ | GitHub `Meriem1403/Hublot` |
| CI (qualité) | ✅ | Workflow **CI** — lint, 32 tests, audit prod, build, E2E |
| CD cloud | ✅ | Netlify (webhook Git + gate « required checks ») |
| CI / CD séparés | ✅ Documenté | Actions ne publient pas ; Netlify déploie — voir [CD_PIPELINES.md](./CD_PIPELINES.md) |
| Staging | ✅ | Branche `staging` + deploy previews (`netlify.toml`) — [ENVIRONNEMENT_STAGING.md](./ENVIRONNEMENT_STAGING.md) |
| CD NAS | ⚠️ Semi-auto | Script `deploy-nas.sh` + workflow `cd-nas.yml` (secrets SSH) |
| Audit npm | ✅ Bloquant | `npm run audit:prod` + allowlist — [SECURITE_AUDIT.md](./SECURITE_AUDIT.md) |
| ESLint | ✅ | `npm run lint` en CI |
| E2E | ✅ | Playwright — `npm run test:e2e` en CI |
| Monitoring | ✅ Documenté + hooks | `/health.json`, Sentry optionnel — [MONITORING.md](./MONITORING.md) |
| IaC | ✅ Périmètre défini | `netlify.toml`, Docker, workflows — [infra/README.md](../infra/README.md) |
| Terraform / K8s | ❌ | Hors scope projet front statique |

---

## Workflows GitHub Actions

| Fichier | Nom affiché | Rôle |
|---------|-------------|------|
| `ci.yml` | **CI** | Lint, tests, audit, build, E2E |
| `cd-netlify.yml` | **CD Netlify** | Build hook optionnel post-CI |
| `cd-nas.yml` | **CD NAS Synology** | Rsync SSH (secrets requis) |
| `audit-scheduled.yml` | **Audit npm planifié** | Hebdomadaire |

---

## Chaîne simplifiée

```
push → CI (GitHub) ──required check──► Netlify PROD
                    └─workflow_dispatch► NAS (rsync + Docker)
```

---

## Commandes développeur

```bash
npm run lint          # ESLint
npm run test:run      # Vitest (32)
npm run test:e2e      # Playwright
npm run audit:prod    # Audit production
npm run build
./scripts/deploy-nas.sh
```

---

## Documents

- [CD_PIPELINES.md](./CD_PIPELINES.md) — CI vs CD Netlify vs NAS
- [ARCHITECTURE_DEPLOIEMENT.md](./ARCHITECTURE_DEPLOIEMENT.md)
- [ENVIRONNEMENT_TEST.md](./ENVIRONNEMENT_TEST.md)
- [ENVIRONNEMENT_STAGING.md](./ENVIRONNEMENT_STAGING.md)
- [SECURITE_4_DEPLOIEMENT.md](./SECURITE_4_DEPLOIEMENT.md)
- [MONITORING.md](./MONITORING.md)
- [PLAN_TEST.md](./PLAN_TEST.md)
