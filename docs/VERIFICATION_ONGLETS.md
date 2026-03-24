# 📊 Plan de vérification onglet par onglet

## État actuel des composants

| Onglet | Composant | État | Données utilisées |
|--------|-----------|------|-------------------|
| 1. Vue d'ensemble | OverviewCards | ✅ | useOverviewStats, useTempsTravail |
| 2. Par mission | MissionChart | ✅ | useCapacitesMissions, useAgentsData |
| 3. Par région | RegionMap | ✅ | useCapacitesRegions, useAgentsData |
| 4. Par service | ServiceTreemap | ⚠️ | **Données mockées** |
| 5. Statuts | StatusDonut | ✅ | useStatutRepartition |
| 6. Contrats | ContractChart | ⚠️ | **Données mockées** |
| 7. Responsabilités | ResponsibilityPyramid | ⚠️ | **Données mockées** |
| 8. Métiers | JobsChart | ⚠️ | **Données mockées** |
| 9. Âges | AgeChart | ✅ | useAgeRepartition, useAgeIndicateurs |
| 10. Parité H/F | GenderDonut | ✅ | useGenreRepartition, useGenreParService |
| 11. Temps de travail | WorkTimeGauge | ⚠️ | **Données mockées** |
| 12. Vue dynamique | DynamicView | ⚠️ | **Données mockées** |

## Ordre de vérification proposé

### ✅ Déjà vérifiés (utilisent les vraies données)
1. Vue d'ensemble
2. Par mission
3. Par région
4. Statuts
5. Parité H/F
6. Âges

### ⚠️ À vérifier maintenant
7. **Par service** ← Commençons ici
8. Contrats
9. Responsabilités
10. Métiers
11. Temps de travail
12. Vue dynamique

## Points à vérifier pour chaque onglet

Pour chaque composant, vérifier :
- ✅ Les données sont chargées depuis les agents réels
- ✅ Les calculs sont corrects
- ✅ Les graphiques affichent les bonnes valeurs
- ✅ Les totaux correspondent
- ✅ Les pourcentages sont cohérents
- ✅ Les filtres fonctionnent (si applicable)
- ✅ Les alertes/indicateurs sont pertinents
