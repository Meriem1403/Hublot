# Annexe 07 — Sécurité du déploiement

> Copie pour livrable — document principal : `../1.2 Préparer le déploiement d'une application/1.2.4.2 Sécurité du déploiement.md`

---

# 4️⃣ Sécurité du déploiement

Mesures de sécurité pour le déploiement de **Hublot** (DIRM Méditerranée).

**Annexe associée :** [Annexe 07](./Annexes/Annexe_07_SECURITE_4_DEPLOIEMENT.md)

---

## 1. HTTPS

| Canal | Mise en œuvre |
|-------|----------------|
| **Netlify (PROD)** | Certificat TLS géré automatiquement par Netlify |
| **NAS (local)** | HTTP par défaut ; HTTPS possible via **Reverse Proxy DSM** + certificat interne |

**Vérification :**

```bash
curl -I https://dirmhublot.netlify.app
```

Attendu : URL en `https://`, réponse `200` ou `304`.

---

## 2. Variables d'environnement sécurisées

Les secrets ne sont **jamais** dans le dépôt Git.

| Variable (exemples) | Où la configurer | Usage |
|---------------------|------------------|--------|
| `VITE_APP_USERNAME` | Netlify → Environment variables | Connexion application |
| `VITE_APP_PASSWORD` | Netlify → Environment variables | Connexion application |
| `NETLIFY_DATABASE_URL` | Netlify (extension Neon) | Accès base PostgreSQL |

En local : fichier `.env` (listé dans `.gitignore`).

---

## 3. Gestion des secrets

| Règle | Application |
|-------|-------------|
| Pas de commit de secrets | `.gitignore` : `.env`, `agents.json`, `*.xlsx`, certificats |
| Séparation des rôles | Comptes Netlify / GitHub distincts des comptes métier |
| Données RH internes | Hors dépôt public ; accès restreint aux équipes habilitées |
| Rotation | Changer les mots de passe en cas de fuite suspectée |

Fichier de référence : [Annexe 04 — .gitignore](./Annexes/Annexe_04_gitignore)

---

## 4. Pas de données sensibles exposées

- Aucun export métier dans le README public.
- Données agents non versionnées (`src/data/`, `trdata/` ignorés).
- API / base en production protégées par authentification applicative.

---

## 5. Headers de sécurité

Configurés dans **`netlify.toml`** (Annexe 02) :

| Header | Valeur | Protection |
|--------|--------|------------|
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Fuite de référent |
| `Permissions-Policy` | camera/micro/geo désactivés | Permissions navigateur |

**Vérification :**

```bash
curl -I https://dirmhublot.netlify.app | grep -i x-frame
```

Configuration Nginx (NAS) : voir `nginx.conf` (CSP, X-Frame-Options en commentaire ou actif selon version).

---

## 6. Tests de vulnérabilité (npm audit)

| Contexte | Commande | CI |
|----------|----------|-----|
| Local | `npm audit` | — |
| Pipeline | `npm audit --audit-level=high` | Étape **informatif** (n'empêche pas le build) |

**Interprétation :** certaines alertes concernent des dépendances de **développement** (Vitest, outils de build). Le site en production sert uniquement les fichiers statiques du dossier `build/`.

**Plan d'action :**

1. `npm audit` régulier
2. `npm audit fix` pour les correctifs sans breaking change
3. Documenter les vulnérabilités résiduelles acceptées

---

## 7. Authentification applicative

- Page de connexion avant accès au tableau de bord.
- Identifiants injectés au build via variables d'environnement (`import.meta.env`).
- Session côté navigateur (`sessionStorage`) — à renforcer (JWT / SSO) en évolution future.

Test manuel : **Annexe 08** / **Annexe 13** — scénario **ST-F01** (authentification).

---

## 8. Checklist avant mise en production

Utiliser [1.2.4.4 Checklist sécurité](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.4.4%20Checklist%20s%C3%A9curit%C3%A9.md) :

- [ ] Mots de passe forts configurés sur Netlify
- [ ] `.env` absent du dépôt
- [ ] CI verte sur `main`
- [ ] Headers vérifiés en production
- [ ] Rollback testé (au moins une fois)

Compléments : [1.2.4.1 Mesures de sécurité applicative](../1.2%20Pr%C3%A9parer%20le%20d%C3%A9ploiement%20d%27une%20application/1.2.4.1%20Mesures%20de%20s%C3%A9curit%C3%A9%20applicative.md), [1.3.1 Les bases du déploiement automatique](../1.3%20R%C3%A9diger%20des%20scriptes%20dans%20la%20d%C3%A9marche%20DevOps/1.3.1%20Les%20bases%20du%20d%C3%A9ploiement%20automatique.md)

---

## Synthèse

Le déploiement Hublot repose sur HTTPS Netlify, variables d'environnement pour les secrets, exclusion des données RH du dépôt (**.gitignore**, Annexe 04), headers HTTP durcis (**Annexe 02**), `npm run audit:prod` et scans Gitleaks/Trivy/CodeQL en CI. L'authentification protège le tableau de bord ; les scénarios **ST-SEC01** à **ST-SEC05** sont détaillés dans **Annexe 13**.
