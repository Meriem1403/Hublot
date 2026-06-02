# Analyse des fichiers Excel - Résumé

## ✅ Résultats de l'analyse

### Fichier analysé : `Interface_Effectifs_DIRM_Central_V6.xlsx`

**Feuille principale : "Données"**
- ✅ **1777 lignes** d'agents détectées
- ✅ **13 colonnes critiques** trouvées sur 22 attendues
- ✅ **Ligne d'en-tête détectée** automatiquement à la ligne 5

### Colonnes trouvées ✅

| Colonne attendue | Colonne Excel trouvée | Statut |
|-----------------|----------------------|--------|
| `nom` | **Nom** | ✅ Trouvé (1570 valeurs uniques) |
| `prenom` | **Prénom** | ✅ Trouvé (529 valeurs uniques) |
| `dateNaissance` | **Année de naissance** | ✅ Trouvé (48 valeurs uniques) |
| `genre` | **Sexe** | ✅ Trouvé (Homme: 1205, Femme: 174, Non précisé: 387) |
| `statut` | **Catégorie** | ✅ Trouvé (A: 130, B: 430, C: 424, Contractuel: 153, Autre: 640) |
| `contratType` | **Temps de travail** | ✅ Trouvé (16 valeurs uniques) |
| `region` | **Région** | ✅ Trouvé (21 régions différentes) |
| `service` | **Service** | ✅ Trouvé (37 services différents) |
| `mission` | **Action** | ✅ Trouvé (21 missions différentes) |
| `metier` | **Poste** | ✅ Trouvé (180 métiers différents) |
| `niveauResponsabilite` | **Catégorie** | ✅ Trouvé (utilise la même colonne que statut) |
| `poste` | **Poste** | ✅ Trouvé (180 postes différents) |
| `dateEmbauche` | **Date d'affectation** | ✅ Trouvé (1031 dates valides sur 1777) |

### Colonnes manquantes ⚠️

| Colonne | Impact | Solution |
|---------|--------|----------|
| `id` | Faible | Généré automatiquement à partir de l'index |
| `tempsPartielPourcentage` | Moyen | Calculé à partir de "Temps de travail" |
| `dateFinContrat` | Faible | Non critique pour les statistiques |
| `dateDepartPrevue` | Faible | Peut être ajouté manuellement si nécessaire |
| `etp` | Moyen | Calculé automatiquement |
| `enConges` | Faible | Peut être déduit ou ajouté manuellement |
| `enFormation` | Faible | Peut être déduit ou ajouté manuellement |
| `enArretMaladie` | Faible | Peut être déduit ou ajouté manuellement |
| `actif` | Faible | Par défaut: tous les agents sont actifs |

### Observations importantes

1. **Régions** : Les données contiennent toutes les DIRM (pas seulement Méditerranée)
   - Provence-Alpes-Côte-d'Azur : 229 agents
   - Pays-de-la-Loire : 337 agents
   - Normandie : 237 agents
   - etc.

2. **Année de naissance** : Format année uniquement (pas date complète)
   - Nécessite une conversion pour calculer l'âge exact

3. **Temps de travail** : Valeurs numériques (100, 80, 50, etc.)
   - 100 = Temps plein
   - < 100 = Temps partiel

4. **Catégorie** : Utilisée pour statut ET niveau de responsabilité
   - A, B, C = Catégories de la fonction publique
   - Contractuel = Statut contractuel
   - Autre = Autres statuts

5. **Mission (Action)** : Codes numériques (0205-04, 0203, etc.)
   - Nécessite un mapping vers les noms de missions

## 🎯 Conclusion

### ✅ **DONNÉES SUFFISANTES POUR FAIRE FONCTIONNER L'OUTIL**

Les données Excel contiennent **toutes les informations critiques** nécessaires :
- ✅ Informations personnelles (nom, prénom, âge, genre)
- ✅ Informations professionnelles (statut, service, région)
- ✅ Affectation (mission, métier, poste)
- ✅ Dates importantes (date d'affectation, année de naissance)

### Actions à effectuer

1. **Filtrer les données** pour ne garder que la DIRM Méditerranée
2. **Convertir les données** au format JSON avec le script fourni
3. **Mapper les valeurs** :
   - Codes mission → Noms de missions
   - Catégories → Statuts et niveaux de responsabilité
   - Temps de travail → Type de contrat + pourcentage
4. **Calculer les valeurs manquantes** :
   - ETP à partir du temps de travail
   - Date de naissance complète à partir de l'année
   - ID unique pour chaque agent

## 📝 Prochaines étapes

1. Exécuter le script de conversion : `python3 scripts/convert_excel_to_json.py`
2. Vérifier le fichier JSON généré dans `src/data/agents.json`
3. Intégrer les données dans l'application React
