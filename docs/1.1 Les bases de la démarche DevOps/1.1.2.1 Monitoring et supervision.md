# Monitoring et observabilité

---

## 1. Sonde de disponibilité (uptime)

### Endpoint health

Fichier statique : `public/health.json` → accessible en production :

```text
https://dirmhublot.netlify.app/health.json
```

Réponse attendue :

```json
{ "status": "ok", "app": "hublot", "service": "statdirm-frontend" }
```

### Outils recommandés (hors dépôt)

| Outil | Usage |
|-------|--------|
| [UptimeRobot](https://uptimerobot.com) | Ping URL `/health.json` toutes les 5 min |
| Netlify Analytics | Trafic et erreurs HTTP (option payante) |
| GitHub Actions | Échec CI = alerte email GitHub |

**Configuration type UptimeRobot :**

- URL : `https://dirmhublot.netlify.app/health.json`
- Mot-clé dans la réponse : `"status":"ok"`
- Alerte : email / Slack

---

## 2. Erreurs applicatives (Sentry)

### Code

`src/monitoring/sentry.ts` — initialisé dans `main.tsx` **uniquement** si `VITE_SENTRY_DSN` est défini.

### Activation

1. Créer un projet sur [sentry.io](https://sentry.io) (React)
2. Netlify → **Environment variables** :
   - `VITE_SENTRY_DSN` = DSN du projet
   - `VITE_APP_ENV` = `production` | `staging` | `preview`
3. Redéployer

Sans DSN, aucun appel réseau Sentry (zéro impact perf).

---

## 3. CI / CD

| Signal | Où |
|--------|-----|
| Échec lint / tests / E2E | GitHub Actions — workflow **CI** |
| Échec audit npm | Job **Audit npm** ou workflow **Audit npm planifié** |
| Échec deploy Netlify | Netlify → Deploys → logs |
| NAS hors ligne | Uptime sur `http://IP_NAS:8080/health.json` si déployé |

---

## 4. Ce qui n’est pas en place

- **Datadog / Grafana** : non intégrés (évolution si hébergement serveur dédié)
- **Logs centralisés** : front statique — pas de serveur applicatif hors Functions Netlify

---

## 5. Tests E2E comme filet de sécurité

Les scénarios Playwright (`e2e/smoke.spec.ts`) vérifient en CI :

- Page de connexion
- Parcours login → tableau de bord
- Disponibilité de `/health.json`

Commande locale : `npm run test:e2e`
