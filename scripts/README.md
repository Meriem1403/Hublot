# Scripts de gestion des données Excel pour StatDirm

Ce dossier contient des outils Python pour analyser et convertir les fichiers Excel en données JSON compatibles avec l'application StatDirm.

## 📋 Prérequis

```bash
pip3 install -r requirements.txt
```

## 🔍 Scripts disponibles

### 1. `analyze_excel.py` - Analyse des fichiers Excel

Analyse la structure des fichiers Excel et vérifie la compatibilité avec le modèle de données requis.

**Usage :**
```bash
python3 scripts/analyze_excel.py
```

**Résultat :**
- Affiche un rapport détaillé dans la console
- Génère un fichier `rapport_analyse.json` avec toutes les informations

### 2. `convert_excel_to_json.py` - Conversion Excel → JSON

Convertit les données Excel au format JSON compatible avec l'application.

**Usage :**
```bash
# Utiliser le fichier corrigé par défaut
python3 scripts/convert_excel_to_json.py

# Spécifier un fichier Excel
python3 scripts/convert_excel_to_json.py chemin/vers/fichier.xlsx

# Spécifier une feuille particulière
python3 scripts/convert_excel_to_json.py chemin/vers/fichier.xlsx "Nom de la feuille"
```

**Résultat :**
- Génère un fichier `src/data/agents.json` avec toutes les données converties
- Filtre automatiquement pour la DIRM Méditerranée
- Convertit et normalise toutes les valeurs

## 📊 Format des données

### Entrée (Excel)
- Feuille "Données" avec colonnes : Nom, Prénom, Sexe, Âge, Année de naissance, Catégorie, Grade, Poste, Service, Région, Action, Temps de travail, Date d'affectation, etc.

### Sortie (JSON)
```json
{
  "agents": [
    {
      "id": "1",
      "nom": "Dupont",
      "prenom": "Jean",
      "dateNaissance": "1980-06-15",
      "genre": "H",
      "statut": "Titulaire",
      "contratType": "Temps plein",
      "region": "Marseille",
      "service": "Opérations maritimes",
      "mission": "Contrôle et surveillance",
      ...
    }
  ],
  "capacites": {
    "missions": [...],
    "regions": [...]
  }
}
```

## 🔧 Fonctionnalités

### Détection automatique
- ✅ Détection automatique de la ligne d'en-tête
- ✅ Mapping intelligent des colonnes (français/anglais)
- ✅ Normalisation des valeurs (genre, statut, région)

### Conversions automatiques
- ✅ Année de naissance → Date complète (15 juin de l'année)
- ✅ Temps de travail (100, 80, 50...) → Type de contrat + pourcentage
- ✅ Catégories (A, B, C) → Statut et niveau de responsabilité
- ✅ Codes région → Noms normalisés (Marseille, Nice, Toulon, Sète)

### Filtrage
- ✅ Filtrage automatique pour DIRM Méditerranée
- ✅ Exclusion des agents inactifs (si colonne disponible)

## 📝 Notes importantes

1. **Régions** : Le script filtre automatiquement pour ne garder que les agents de la DIRM Méditerranée (PACA)

2. **Dates** : Si seule l'année de naissance est disponible, une date au 15 juin est générée pour permettre le calcul de l'âge

3. **Statuts** : 
   - Catégories A, B, C → Titulaires
   - "Contractuel" → CDI
   - Autres → CDD par défaut

4. **Temps de travail** :
   - 100 = Temps plein
   - < 100 = Temps partiel avec le pourcentage correspondant

5. **Valeurs manquantes** : Les colonnes optionnelles (congés, formation, etc.) sont initialisées avec des valeurs par défaut

## 🚀 Intégration dans l'application

Une fois le fichier JSON généré :

1. Le fichier est créé dans `src/data/agents.json`
2. Créer un service React pour charger ces données :
   ```typescript
   import agentsData from './data/agents.json';
   ```
3. Utiliser les fonctions de calcul dans `src/utils/dataCalculations.ts` pour générer les statistiques

## ⚠️ Dépannage

### Erreur "Module not found"
```bash
pip3 install pandas openpyxl
```

### Colonnes non détectées
Vérifier que les noms de colonnes dans Excel correspondent aux noms attendus (voir `COLONNES_ATTENDUES` dans les scripts)

### Données manquantes
Le script gère automatiquement les valeurs manquantes avec des valeurs par défaut raisonnables
