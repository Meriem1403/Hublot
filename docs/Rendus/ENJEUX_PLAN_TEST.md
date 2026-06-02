# Les enjeux des plans de test

**Projet :** Hublot — DIRM Méditerranée  
**Livrable :** compréhension des enjeux + lien avec le plan opérationnel

---

## En une phrase

Un plan de test garantit qu'on ne met pas en production une application qui affiche de **mauvaises données RH**, laisse l'**accès ouvert**, ou **casse** après chaque déploiement automatique.

---

## Enjeux principaux (Hublot)

1. **Fiabilité des indicateurs** — filtres, ETP, répartitions testés en unitaire  
2. **Sécurité** — auth, headers, audit npm, secrets hors Git  
3. **Traçabilité** — tableau Objectif / Résultat / Statut + CI GitHub  
4. **Rapidité de feedback** — automatisation en CI, manuel ciblé  
5. **Séparation des environnements** — pas de test métier final en PROD  

---

## Réponse au référentiel Studi

| Attendu | Réponse dans le projet |
|---------|------------------------|
| Comprendre les enjeux des plans de test | Ce document + section dédiée dans [PLAN_TEST.md](../1.3 Rédiger des scriptes dans la démarche DevOps/1.3.7 Automatiser les tests en DevOps.md) |
| Élaborer des scénarios | Scénarios auth, données, responsive, perf |
| Valider les résultats | Colonne Statut + runs CI |
| Automatiser (DevOps) | Vitest, Playwright, lint, audit dans workflow **CI** |

Document détaillé : [ENJEUX_PLAN_TEST.md](.../1.2 Préparer le déploiement d'une application/1.2.1 Les enjeux des plans de test.md)
