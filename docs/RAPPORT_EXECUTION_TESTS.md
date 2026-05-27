# Rapport d'exécution — campagne de tests manuels

**Date :** 27 mai 2026  
**Projet :** Hublot — DIRM Méditerranée  
**Référence scénarios :** [SCENARIOS_TEST.md](./SCENARIOS_TEST.md)

---

## Environnements utilisés

| Environnement | URL | Usage |
|---------------|-----|--------|
| **QA local** | `http://127.0.0.1:4173` (preview `build:e2e`) | ST-F01 à ST-F06 (Playwright) |
| **PROD** | https://dirmhublot.netlify.app | ST-SEC01, ST-F01 (partie publique), ST-F06 (pas de badge) |
| **STAGING** | `staging--dirmhublot.netlify.app` | **404** — branch deploy Netlify à activer ; non utilisé pour cette campagne |

---

## Commandes exécutées

```bash
# Headers production
curl -sI https://dirmhublot.netlify.app

# Campagne scénarios (local + prod)
npm run test:campaign
```

Résultat Playwright : **9 passed** (6 scénarios QA + 3 vérifications PROD).

Fichiers : `e2e/campaign-manual.spec.ts`, `e2e/campaign-prod.spec.ts`.

---

## ST-SEC01 — Headers (PROD)

**Commande :** `curl -sI https://dirmhublot.netlify.app`

| Critère | Résultat |
|---------|----------|
| HTTPS / HSTS | `strict-transport-security` présent |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| Statut | `HTTP/2 200` |

**Résultat :** **Passé**

---

## Synthèse scénarios fonctionnels

| ID | Résultat | Preuve |
|----|----------|--------|
| ST-F01 | **Passé** | Playwright : refus login, connexion e2e, déconnexion (QA) ; PROD : page login sans session |
| ST-F02 | **Passé** | Playwright : 3 onglets, pas d'erreur console bloquante |
| ST-F03 | **Passé** | Playwright : filtre région + réinitialisation |
| ST-F04 | **Passé** | Playwright : viewport 375px, `main` sans débordement majeur |
| ST-F05 | **Passé** | Playwright : 3 onglets &lt; 15 s |
| ST-F06 | **Passé** | QA : badge « Test local (QA) » ; PROD : aucun badge |
| ST-AUTO-* | **Passé** | CI GitHub — voir [PLAN_TEST.md](./PLAN_TEST.md) |

---

## Limites de la campagne

- Identifiants **PROD** Netlify non testés manuellement dans ce rapport (secrets hors dépôt) ; parcours login complet validé en **QA** avec comptes `e2e-user` / `build:e2e`.
- **STAGING** : à rejouer sur l’URL Netlify dès que la branch deploy `staging` est active.
- Données métier réelles : campagne QA utilise le jeu embarqué / mock CI ; validation sur données RH réelles = à faire en STAGING avec accès interne.

---

## Prochaine action

1. Activer branch deploy **staging** sur Netlify.  
2. Rejouer **ST-F01 à F03** sur staging avec identifiants staging.  
3. Conserver les captures Actions + ce rapport pour le jury.
