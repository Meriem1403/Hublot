# Modèle de données pour StatDirm

Ce document décrit toutes les données nécessaires pour que l'application StatDirm soit fonctionnelle.

## 📊 Structure de données principale

### 1. Données individuelles des agents (Table principale)

Chaque agent doit avoir les informations suivantes :

```typescript
interface Agent {
  // Identifiant unique
  id: string | number;
  
  // Informations personnelles
  nom: string;
  prenom: string;
  dateNaissance: string; // Format ISO: "YYYY-MM-DD"
  genre: 'H' | 'F' | 'Autre';
  
  // Informations professionnelles
  statut: 'Titulaire' | 'CDI' | 'CDD' | 'Stagiaire';
  contratType: 'Temps plein' | 'Temps partiel';
  tempsPartielPourcentage?: number; // Si temps partiel (ex: 80, 50)
  
  // Affectation
  region: 'Marseille' | 'Nice' | 'Toulon' | 'Sète';
  service: string; // Voir liste des services ci-dessous
  mission: string; // Voir liste des missions ci-dessous
  metier: string; // Voir liste des métiers ci-dessous
  
  // Hiérarchie
  niveauResponsabilite: 'Direction' | 'Encadrement' | 'Opérationnel';
  poste: string; // Ex: "Directeur", "Chef de service", "Agent de contrôle"
  
  // Dates importantes
  dateEmbauche: string; // Format ISO
  dateFinContrat?: string; // Pour CDD/stagiaires
  dateDepartPrevue?: string; // Pour départs en retraite
  
  // Temps de travail et disponibilité
  etp: number; // Équivalent Temps Plein (calculé si temps partiel)
  enConges: boolean;
  enFormation: boolean;
  enArretMaladie: boolean;
  
  // Métadonnées
  actif: boolean; // true si en poste, false si départ
  dateMaj: string; // Date de dernière mise à jour
}
```

### 2. Liste des services

```typescript
const SERVICES = [
  'Opérations maritimes',
  'Surveillance et contrôle',
  'Administration',
  'Affaires juridiques',
  'Environnement',
  'Formation',
  'Communication',
  'Informatique'
];
```

### 3. Liste des missions

```typescript
const MISSIONS = [
  'Contrôle et surveillance',
  'Police des pêches',
  'Sauvetage en mer',
  'Protection environnement',
  'Gestion portuaire',
  'Formation maritime',
  'Affaires maritimes',
  'Support administratif'
];
```

### 4. Liste des métiers

```typescript
const METIERS = [
  'Contrôleur maritime',
  'Inspecteur sécurité',
  'Agent administratif',
  'Officier de port',
  'Juriste maritime',
  'Technicien environnement',
  'Formateur maritime',
  'Ingénieur naval',
  'Gestionnaire RH',
  'Informaticien',
  'Chargé de communication',
  'Comptable'
];
```

### 5. Capacités et objectifs par mission

```typescript
interface MissionCapacite {
  mission: string;
  capaciteMaximale: number; // Nombre d'agents prévus
  effectifActuel: number; // Calculé depuis les agents
  tauxRemplissage: number; // Calculé: effectifActuel / capaciteMaximale * 100
}
```

### 6. Capacités par région

```typescript
interface RegionCapacite {
  region: 'Marseille' | 'Nice' | 'Toulon' | 'Sète';
  capaciteMaximale: number;
  effectifActuel: number; // Calculé depuis les agents
  tauxRemplissage: number;
  status: 'optimal' | 'normal' | 'tension';
  // Coordonnées pour la carte (optionnel)
  coordonnees?: {
    x: number; // Position X sur la carte
    y: number; // Position Y sur la carte
  };
}
```

### 7. Données agrégées pour les graphiques

#### Vue d'ensemble (OverviewCards)
```typescript
interface OverviewStats {
  effectifsTotaux: number;
  postesPourvus: number;
  postesVacants: number;
  tauxPourvu: number; // Calculé: postesPourvus / (postesPourvus + postesVacants) * 100
  departsPrevu2025: number;
  tauxPresence: number; // Calculé depuis les absences
  ratioEncadrement: string; // Format "1:8"
  tensionRH: 'Faible' | 'Modérée' | 'Élevée';
}
```

#### Répartition par statut
```typescript
interface StatutRepartition {
  statut: 'Titulaire' | 'CDI' | 'CDD' | 'Stagiaire';
  nombre: number;
  pourcentage: number;
}
```

#### Répartition par contrat
```typescript
interface ContratRepartition {
  service: string;
  tempsPlein: number;
  tempsPartiel: number;
  cdd: number;
  stagiaires: number;
}
```

#### Répartition par niveau de responsabilité
```typescript
interface ResponsabiliteRepartition {
  niveau: 'Direction' | 'Encadrement' | 'Opérationnel';
  nombre: number;
  pourcentage: number;
  exemples: string; // Description des postes
}
```

#### Répartition par métier
```typescript
interface MetierRepartition {
  metier: string;
  effectif: number;
  besoin: 'Faible' | 'Normal' | 'Moyen' | 'Élevé' | 'Critique';
  criticite: 1 | 2 | 3 | 4; // 1=Faible, 4=Critique
  capaciteSouhaitee?: number; // Nombre d'agents souhaités
}
```

#### Répartition par âge
```typescript
interface AgeRepartition {
  tranche: '< 25 ans' | '25-29 ans' | '30-34 ans' | '35-39 ans' | 
           '40-44 ans' | '45-49 ans' | '50-54 ans' | '55-59 ans' | 
           '60-64 ans' | '≥ 65 ans';
  effectif: number;
  hommes: number;
  femmes: number;
}

interface AgeIndicateurs {
  ageMoyen: number;
  ageMedian: number;
  ageMoyenRecrutement: number;
  ageMoyenDepart: number;
  jeunesMoins35: number;
  coeur35_54: number;
  seniorsPlus55: number;
}
```

#### Répartition par genre
```typescript
interface GenreRepartition {
  genre: 'Hommes' | 'Femmes';
  nombre: number;
  pourcentage: number;
}

interface GenreParService {
  service: string;
  hommes: number;
  femmes: number;
  totalService: number;
}

interface GenreParNiveau {
  niveau: 'Direction' | 'Encadrement' | 'Opérationnel';
  hommes: number;
  femmes: number;
}
```

#### Temps de travail
```typescript
interface TempsTravailStats {
  tauxPresence: number; // Pourcentage
  tauxTempsPlein: number;
  disponibiliteETP: number;
  absentéisme: number;
  
  details: {
    tempsPlein: {
      count: number;
      etp: number;
      pct: number;
    };
    tempsPartiel: {
      count: number;
      etp: number;
      pct: number;
      moyennePct: number; // Pourcentage moyen du temps partiel
    };
    conges: {
      count: number;
      pct: number;
    };
    maladie: {
      count: number;
      pct: number;
    };
    formation: {
      count: number;
      pct: number;
    };
    autres: {
      count: number;
      pct: number;
    };
  };
}
```

### 8. Données pour la vue dynamique (DynamicView)

```typescript
interface DynamicViewData {
  // Filtres appliqués
  filtres: {
    region?: string;
    service?: string;
    statut?: string;
  };
  
  // Données filtrées
  agentsFiltres: Agent[];
  
  // Statistiques calculées
  stats: {
    effectif: number;
    hommes: number;
    femmes: number;
    ageMoyen: number;
  };
  
  // Répartitions par critères
  repartitionAge: AgeRepartition[];
  repartitionService: {
    name: string;
    count: number;
  }[];
}
```

## 📥 Format de données recommandé

### Option 1: JSON (pour développement/test)

```json
{
  "agents": [
    {
      "id": 1,
      "nom": "Dupont",
      "prenom": "Jean",
      "dateNaissance": "1980-05-15",
      "genre": "H",
      "statut": "Titulaire",
      "contratType": "Temps plein",
      "region": "Marseille",
      "service": "Opérations maritimes",
      "mission": "Contrôle et surveillance",
      "metier": "Contrôleur maritime",
      "niveauResponsabilite": "Opérationnel",
      "poste": "Agent de contrôle",
      "dateEmbauche": "2010-03-01",
      "etp": 1.0,
      "enConges": false,
      "enFormation": false,
      "enArretMaladie": false,
      "actif": true,
      "dateMaj": "2025-01-27"
    }
  ],
  "capacites": {
    "missions": [
      {
        "mission": "Contrôle et surveillance",
        "capaciteMaximale": 95
      }
    ],
    "regions": [
      {
        "region": "Marseille",
        "capaciteMaximale": 150,
        "coordonnees": { "x": 83, "y": 81 }
      }
    ]
  },
  "metadonnees": {
    "dateExport": "2025-01-27",
    "version": "1.0"
  }
}
```

### Option 2: CSV (pour import depuis Excel)

Fichier `agents.csv` avec colonnes :
- id, nom, prenom, dateNaissance, genre
- statut, contratType, tempsPartielPourcentage
- region, service, mission, metier
- niveauResponsabilite, poste
- dateEmbauche, dateFinContrat, dateDepartPrevue
- etp, enConges, enFormation, enArretMaladie, actif

### Option 3: Base de données (pour production)

Structure SQL recommandée :

```sql
CREATE TABLE agents (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  date_naissance DATE NOT NULL,
  genre CHAR(1) CHECK (genre IN ('H', 'F', 'A')),
  statut VARCHAR(20) NOT NULL,
  contrat_type VARCHAR(20),
  temps_partiel_pct INTEGER,
  region VARCHAR(50),
  service VARCHAR(100),
  mission VARCHAR(100),
  metier VARCHAR(100),
  niveau_responsabilite VARCHAR(20),
  poste VARCHAR(100),
  date_embauche DATE,
  date_fin_contrat DATE,
  date_depart_prevue DATE,
  etp DECIMAL(3,2),
  en_conges BOOLEAN DEFAULT FALSE,
  en_formation BOOLEAN DEFAULT FALSE,
  en_arret_maladie BOOLEAN DEFAULT FALSE,
  actif BOOLEAN DEFAULT TRUE,
  date_maj TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE capacites_missions (
  mission VARCHAR(100) PRIMARY KEY,
  capacite_maximale INTEGER NOT NULL
);

CREATE TABLE capacites_regions (
  region VARCHAR(50) PRIMARY KEY,
  capacite_maximale INTEGER NOT NULL,
  coord_x DECIMAL(5,2),
  coord_y DECIMAL(5,2)
);
```

## 🔄 Calculs automatiques nécessaires

L'application doit calculer automatiquement :

1. **Taux de remplissage** : `(effectif actuel / capacité maximale) * 100`
2. **ETP pour temps partiel** : `tempsPartielPourcentage / 100`
3. **Âge** : `année actuelle - année de naissance`
4. **Tranches d'âge** : Regroupement par tranches de 5 ans
5. **Statistiques agrégées** : Sommes, moyennes, pourcentages par catégorie
6. **Statuts** : Calcul depuis les dates (CDD expiré = inactif, etc.)

## 📋 Données minimales requises pour démarrer

Pour que l'application soit fonctionnelle, il faut au minimum :

1. **Liste des agents** avec au moins :
   - Identifiant unique
   - Nom, prénom
   - Date de naissance (pour calculer l'âge)
   - Genre
   - Statut (Titulaire/CDI/CDD/Stagiaire)
   - Région
   - Service
   - Mission
   - Niveau de responsabilité
   - Statut actif (en poste ou non)

2. **Capacités** :
   - Capacité maximale par mission
   - Capacité maximale par région

3. **Métadonnées** :
   - Date de dernière mise à jour
   - Version des données

## 🎯 Exemple de jeu de données minimal

Pour tester l'application avec 10 agents :

```json
{
  "agents": [
    {"id": 1, "nom": "Martin", "prenom": "Pierre", "dateNaissance": "1985-03-15", "genre": "H", "statut": "Titulaire", "region": "Marseille", "service": "Opérations maritimes", "mission": "Contrôle et surveillance", "metier": "Contrôleur maritime", "niveauResponsabilite": "Opérationnel", "actif": true},
    {"id": 2, "nom": "Bernard", "prenom": "Marie", "dateNaissance": "1990-07-22", "genre": "F", "statut": "CDI", "region": "Nice", "service": "Surveillance et contrôle", "mission": "Police des pêches", "metier": "Inspecteur sécurité", "niveauResponsabilite": "Opérationnel", "actif": true},
    {"id": 3, "nom": "Dubois", "prenom": "Jean", "dateNaissance": "1975-11-08", "genre": "H", "statut": "Titulaire", "region": "Toulon", "service": "Administration", "mission": "Support administratif", "metier": "Agent administratif", "niveauResponsabilite": "Opérationnel", "actif": true},
    {"id": 4, "nom": "Moreau", "prenom": "Sophie", "dateNaissance": "1988-02-14", "genre": "F", "statut": "CDD", "region": "Marseille", "service": "Environnement", "mission": "Protection environnement", "metier": "Technicien environnement", "niveauResponsabilite": "Opérationnel", "actif": true},
    {"id": 5, "nom": "Laurent", "prenom": "Paul", "dateNaissance": "1970-09-30", "genre": "H", "statut": "Titulaire", "region": "Sète", "service": "Formation", "mission": "Formation maritime", "metier": "Formateur maritime", "niveauResponsabilite": "Encadrement", "actif": true},
    {"id": 6, "nom": "Simon", "prenom": "Claire", "dateNaissance": "1992-05-18", "genre": "F", "statut": "Stagiaire", "region": "Nice", "service": "Juridique", "mission": "Affaires maritimes", "metier": "Juriste maritime", "niveauResponsabilite": "Opérationnel", "actif": true},
    {"id": 7, "nom": "Michel", "prenom": "Luc", "dateNaissance": "1965-12-05", "genre": "H", "statut": "Titulaire", "region": "Marseille", "service": "Opérations maritimes", "mission": "Gestion portuaire", "metier": "Officier de port", "niveauResponsabilite": "Encadrement", "actif": true},
    {"id": 8, "nom": "Garcia", "prenom": "Ana", "dateNaissance": "1987-04-20", "genre": "F", "statut": "CDI", "region": "Toulon", "service": "Informatique", "mission": "Support administratif", "metier": "Informaticien", "niveauResponsabilite": "Opérationnel", "actif": true},
    {"id": 9, "nom": "Robert", "prenom": "Marc", "dateNaissance": "1978-08-12", "genre": "H", "statut": "Titulaire", "region": "Marseille", "service": "Opérations maritimes", "mission": "Sauvetage en mer", "metier": "Contrôleur maritime", "niveauResponsabilite": "Opérationnel", "actif": true},
    {"id": 10, "nom": "Petit", "prenom": "Isabelle", "dateNaissance": "1983-01-25", "genre": "F", "statut": "Titulaire", "region": "Nice", "service": "Administration", "mission": "Support administratif", "metier": "Gestionnaire RH", "niveauResponsabilite": "Opérationnel", "actif": true}
  ],
  "capacites": {
    "missions": [
      {"mission": "Contrôle et surveillance", "capaciteMaximale": 95},
      {"mission": "Police des pêches", "capaciteMaximale": 60},
      {"mission": "Sauvetage en mer", "capaciteMaximale": 48},
      {"mission": "Protection environnement", "capaciteMaximale": 42},
      {"mission": "Gestion portuaire", "capaciteMaximale": 35},
      {"mission": "Formation maritime", "capaciteMaximale": 32},
      {"mission": "Affaires maritimes", "capaciteMaximale": 35},
      {"mission": "Support administratif", "capaciteMaximale": 28}
    ],
    "regions": [
      {"region": "Marseille", "capaciteMaximale": 150, "coordonnees": {"x": 83, "y": 81}},
      {"region": "Nice", "capaciteMaximale": 85, "coordonnees": {"x": 94, "y": 76}},
      {"region": "Toulon", "capaciteMaximale": 92, "coordonnees": {"x": 88, "y": 83}},
      {"region": "Sète", "capaciteMaximale": 48, "coordonnees": {"x": 66, "y": 80}}
    ]
  }
}
```

## 📝 Notes importantes

1. **Données sensibles** : Les données RH sont sensibles. Assurez-vous de :
   - Respecter le RGPD
   - Anonymiser les données si nécessaire
   - Sécuriser l'accès aux données

2. **Mise à jour** : Les données doivent être mises à jour régulièrement (mensuellement recommandé)

3. **Validation** : Valider les données avant import :
   - Dates valides
   - Valeurs dans les listes autorisées
   - Cohérence (ex: un stagiaire ne peut pas être en "Direction")

4. **Performance** : Pour de grandes quantités de données (>1000 agents), envisager :
   - Pagination
   - Calculs côté serveur
   - Mise en cache des agrégations
