# Élaborer un scénario de test — Hublot (synthèse Studi)

**Compétence :** préparation du déploiement d'une application sécurisée — **élaboration de scénarios de test**.

---

## Définition

Un **scénario de test** décrit :

1. À **quel** besoin métier ou risque il répond  
2. **Dans quel contexte** (préconditions)  
3. **Quelles actions** exécuter dans l’ordre  
4. **Comment juger le succès** (résultats attendus observables)

Méthode recommandée : **Étant donné — Quand — Alors**.

---

## Exemple traité dans le projet (authentification)

| Étape | Description |
|-------|--------------|
| **Étant donné** | L’utilisateur n’est pas connecté. |
| **Quand** | Il saisit des identifiants invalides et valide. |
| **Alors** | Message d’erreur ; pas d’accès au tableau de bord. |
| **Et** après identifiants valides | Accès au tableau de bord ; déconnexion possible. |

Scénarios complets avec identifiants stables : **[SCENARIOS_TEST.md](../SCENARIOS_TEST.md)**

---

## Lien avec le plan de test

- **Plan** : lignes générales **[PLAN_TEST.md](../PLAN_TEST.md)**  
- **Scénarios** : fiches détaillées **[SCENARIOS_TEST.md](../SCENARIOS_TEST.md)** (Annexe 13)

---

## Automatisation

Les scénarios **ST-AUTO-01 à ST-AUTO-05** correspondent à ce que la **CI GitHub Actions** exécute à chaque push (lint, Vitest, E2E, build, audit). Voir **`DEMO_EPREUVE.md`** pour reproduire en local devant un jury technique.
