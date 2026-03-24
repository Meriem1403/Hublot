# Procédure d’exécution des tests

Ce document liste les **commandes à exécuter** pour reproduire les résultats du plan de test. À lancer dans un terminal ouvert à la racine du projet (`StatDirm`).

---

## 1. Tests unitaires automatisés (CI)

**Commande :**

```bash
npm run test:run
```

**Résultat attendu :**  
- Message du type : `Test Files  2 passed (2)` et `Tests  32 passed (32)`  
- Pas d’erreur rouge

Les tests unitaires (Vitest) passent en local ; la même commande est exécutée en CI à chaque push sur `main`.

---

## 2. Build de production

**Commande :**

```bash
npm run build
```

**Résultat attendu :**  
- `✓ built in …` sans erreur  
- Dossier `build/` créé avec `index.html` et `assets/`

Le build de production réussit ; Netlify exécute cette commande à chaque déploiement.

---

## 3. Audit des vulnérabilités

**Commande :**

```bash
npm audit
```

**Résultat attendu :**  
- Un rapport s’affiche. Il peut rester des vulnérabilités dans des dépendances de **développement** (ex. `react-simple-maps`, `vitest`).  
Les alertes restantes concernent des dépendances de développement ou des mises à jour majeures. En production, le site sert uniquement les fichiers buildés ; les recommandations de sécurité (headers, HTTPS, variables d’env) sont appliquées.

---

## 4. Lancer l’app en local (optionnel)

**Commande :**

```bash
npm run dev
```

Puis ouvrir **http://localhost:5173** dans le navigateur pour montrer :
- la page de connexion (sans être connecté) ;
- après connexion : les onglets, les données, les filtres (ex. « DIRM Méditerranée »).

---

## 5. Vérifier les headers de sécurité (production)

**Commande :**

```bash
curl -I https://dirmhublot.netlify.app
```

**À montrer dans la sortie :**  
- `X-Frame-Options: DENY`  
- `X-Content-Type-Options: nosniff`  
- Réponse `200` ou `304` et URL en `https://`

---

## Ordre d’exécution recommandé

| Ordre | Action | Commande ou action |
|-------|--------|---------------------|
| 1 | Tests unitaires | `npm run test:run` |
| 2 | Build | `npm run build` |
| 3 | Audit | `npm audit` |
| 4 | Site en prod | Ouvrir https://dirmhublot.netlify.app → connexion → parcourir les onglets |
| 5 | Headers de sécurité | `curl -I https://dirmhublot.netlify.app` |

---

## Résultats constatés

- **Tests :** 2 fichiers, 32 tests (Vitest) — tous passent.  
- **Build :** réussi ; sortie dans `build/`.  
- **Audit :** des vulnérabilités restent sur des dépendances de dev ; aucune donnée sensible exposée ; pas de secret dans le dépôt.
