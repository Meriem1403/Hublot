# Méthodologie rédactionnelle — Documentation Studi

Ce guide fixe la **structure commune** de tous les documents numérotés (`1.1.1` à `1.3.7`). Chaque fichier doit se lire comme un **chapitre de rapport**, pas comme une liste de tableaux.

---

## Structure obligatoire de chaque document

Chaque fichier `.md` du parcours suit ces sections **dans cet ordre** :

| Section | Rôle |
|---------|------|
| **En bref** | 3 à 5 phrases : de quoi parle ce chapitre et ce qu'on retient. |
| **Objectif pédagogique** | Quelle compétence Studi est couverte (libellé référentiel). |
| **Contexte — projet Hublot** | Lien concret avec l'application DIRM (données RH, déploiement, utilisateurs). |
| **Définitions** | Vocabulaire clé expliqué en une phrase chacun (pas de jargon non défini). |
| **Ce qui a été mis en place** | Description narrative de ce qui existe **réellement** dans le dépôt. |
| **Pourquoi ces choix** | Justification des décisions (contraintes, risques, alternatives écartées). |
| **Comment ça fonctionne** | Déroulé étape par étape, avec exemples et chemins de fichiers. |
| **Quand** | À quel moment du cycle (commit, PR, merge, déploiement, hebdo…). |
| **Preuves et démonstration** | Commandes, captures attendues, liens vers workflows — **après** l'explication. |
| **Synthèse** | Une phrase de clôture qui résume l'essentiel du chapitre. |
| **Documents liés** | Liens vers les autres chapitres du parcours (pas vers des chemins obsolètes). |

---

## Règles de rédaction

1. **Expliquer avant de lister** : un tableau résume, il ne remplace pas le texte.
2. **Quoi / Comment / Pourquoi / Quand** : chaque action décrite doit répondre à ces quatre questions.
3. **Une idée par paragraphe** : phrases courtes, voix active (« nous avons configuré », « la CI exécute »).
4. **Ancrer dans Hublot** : exemples concrets (filtres région/service, login, Netlify, Excel ETPT).
5. **Pas de doublon** : si un sujet est détaillé dans un autre chapitre, renvoyer avec un lien et rester synthétique.
6. **Pas d'emoji** dans le corps des documents Studi.
7. **Chiffres à jour** : 48 tests unitaires, dépôt `Meriem1403/Hublot`, URL prod `dirmhublot.netlify.app`.

---

## Exemple de bon paragraphe (vs mauvais)

**Mauvais** (tableau seul, incompréhensible seul) :

| Outil | Rôle |
|-------|------|
| Vitest | Tests |

**Bon** :

Les **tests unitaires** (Vitest) vérifient la logique métier sans ouvrir de navigateur : filtres région/service, calculs ETP, masquage des données RH. Nous en exécutons **48** à chaque push via le workflow GitHub **CI** (`.github/workflows/ci.yml`), avant tout déploiement Netlify.

| Élément | Détail |
|---------|--------|
| Fichiers | `src/services/dataService.test.ts`, `src/utils/security.test.ts`, … |
| Commande | `npm run test:run` |
| Fréquence | À chaque push / PR sur `main` et `staging` |

---

## Plan de réécriture

| Bloc | Fichiers | Statut |
|------|----------|--------|
| 1.1 DevOps | 10 fichiers | Terminé |
| 1.2 Déploiement / tests | 14 fichiers | Terminé |
| 1.3 Scripts | 9 fichiers | Terminé |

Les chapitres réécrits suivent cette méthodologie ; les autres seront traités progressivement.
