# Infrastructure as Code (périmètre Hublot)

Hublot n’utilise pas Terraform ni Kubernetes. L’**IaC du projet** couvre :

| Artefact | Rôle |
|----------|------|
| `netlify.toml` | Build, publish, headers, contextes staging/preview |
| `docker-compose.yml` | Service Nginx + volume `build/` (NAS) |
| `docker-compose.prod.yml` / `docker-compose.dev.yml` | Variantes build local |
| `nginx.conf` | SPA + headers |
| `Dockerfile` | Image multi-étapes (option build sur NAS) |
| `.github/workflows/*.yml` | CI et CD documentés |

---

## Déploiement NAS (référence)

```yaml
# Équivalent déclaratif : docker-compose.yml
services:
  app:
    image: nginx:alpine
    ports: ["8080:80"]
    volumes:
      - ./build:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
```

---

## Évolutions possibles

- Module Terraform pour DNS + Netlify (hors scope actuel)
- Ansible / script SSH pour NAS (voir `scripts/deploy-nas.sh` et `cd-nas.yml`)

Documentation pipelines : [docs/CD_PIPELINES.md](../docs/CD_PIPELINES.md)
