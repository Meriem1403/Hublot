/**
 * Types de données pour l'application StatDirm
 * 
 * Ce fichier définit toutes les interfaces TypeScript nécessaires
 * pour typer les données de l'application.
 */

// ============================================================================
// TYPES DE BASE
// ============================================================================

export type Genre = 'H' | 'F' | 'Autre';
export type Statut = 'Titulaire' | 'CDI' | 'CDD' | 'Stagiaire';
export type ContratType = 'Temps plein' | 'Temps partiel';
export type Region = 'Marseille' | 'Nice' | 'Toulon' | 'Sète' | string; // Permet toutes les régions
export type NiveauResponsabilite = 'Direction' | 'Encadrement' | 'Opérationnel';
export type StatusRegion = 'optimal' | 'normal' | 'tension';
export type TensionRH = 'Faible' | 'Modérée' | 'Élevée';

// ============================================================================
// INTERFACE PRINCIPALE : AGENT
// ============================================================================

export interface Agent {
  // Identifiant unique
  id: string | number;
  
  // Informations personnelles
  nom: string;
  prenom: string;
  dateNaissance: string; // Format ISO: "YYYY-MM-DD"
  genre: Genre;
  
  // Informations professionnelles
  statut: Statut;
  contratType: ContratType;
  tempsPartielPourcentage?: number; // Si temps partiel (ex: 80, 50)
  
  // Affectation
  region: Region;
  service: string;
  mission: string;
  missionCode?: string; // code Action brut issu de l'Excel (ex: 0205-04)
  metier: string;

  // PASA / politiques publiques (si disponibles dans la source)
  pasaCode?: string; // ex: "217-11-04"
  pasaLibelle?: string; // ex: "Police en mer"
  pasaSegment?: string; // ex: "Contrôle et surveillance maritime"
  pasaSousSegment?: string; // ex: "0205-01-03" ou libellé

  // Référentiels RH (si disponibles)
  corps?: string; // ex: issu de "Grade"
  fonctionExercee?: string; // ex: issu de "Poste" ou champ dédié
  fonctionCategorie?: string; // ex: "Encadrement", "Contrôle/Surveillance", "Administratif", ...
  
  // Hiérarchie
  niveauResponsabilite: NiveauResponsabilite;
  poste: string;
  
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

// ============================================================================
// CAPACITÉS ET OBJECTIFS
// ============================================================================

export interface MissionCapacite {
  mission: string;
  capaciteMaximale: number;
  effectifActuel?: number; // Calculé depuis les agents
  tauxRemplissage?: number; // Calculé: effectifActuel / capaciteMaximale * 100
}

export interface RegionCapacite {
  region: Region;
  capaciteMaximale: number;
  effectifActuel?: number; // Calculé depuis les agents
  tauxRemplissage?: number;
  status: StatusRegion;
  coordonnees?: {
    x: number;
    y: number;
  };
}

// ============================================================================
// STATISTIQUES ET AGRÉGATIONS
// ============================================================================

export interface OverviewStats {
  /** Agents actifs (en poste) */
  effectifsTotaux: number;
  /** Encadrants + direction (données source) */
  encadrantsTotal: number;
  /** Opérationnels (données source) */
  operationnelsTotal: number;
  /** Ratio encadrement calculé à partir des niveaux */
  ratioEncadrement: string; // Format "1:8"
  /** ETP total (somme des ETP réels/calculés) */
  etpTotal: number;
  /** Temps plein / temps partiel (données source) */
  nbTempsPlein: number;
  nbTempsPartiel: number;
}

export interface StatutRepartition {
  statut: Statut;
  nombre: number;
  pourcentage: number;
}

export interface ContratRepartition {
  service: string;
  tempsPlein: number;
  tempsPartiel: number;
  cdd: number;
  stagiaires: number;
}

export interface ResponsabiliteRepartition {
  niveau: NiveauResponsabilite;
  nombre: number;
  pourcentage: number;
  exemples: string;
}

export interface MetierRepartition {
  metier: string;
  effectif: number;
}

export type TrancheAge = 
  | '< 25 ans'
  | '25-29 ans'
  | '30-34 ans'
  | '35-39 ans'
  | '40-44 ans'
  | '45-49 ans'
  | '50-54 ans'
  | '55-59 ans'
  | '60-64 ans'
  | '≥ 65 ans';

export interface AgeRepartition {
  tranche: TrancheAge;
  effectif: number;
  hommes: number;
  femmes: number;
}

export interface AgeIndicateurs {
  ageMoyen: number;
  ageMedian: number;
  ageMoyenRecrutement: number;
  ageMoyenDepart: number;
  jeunesMoins35: number;
  coeur35_54: number;
  seniorsPlus55: number;
}

export interface GenreRepartition {
  genre: 'Hommes' | 'Femmes';
  nombre: number;
  pourcentage: number;
}

export interface GenreParService {
  service: string;
  hommes: number;
  femmes: number;
  totalService: number;
}

export interface GenreParNiveau {
  niveau: NiveauResponsabilite;
  hommes: number;
  femmes: number;
}

export interface TempsTravailStats {
  tauxPresence: number;
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
      moyennePct: number;
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

// ============================================================================
// VUE DYNAMIQUE
// ============================================================================

export interface DynamicViewFilters {
  region?: Region | 'all';
  service?: string | 'all';
  statut?: Statut | 'all';
}

export interface DynamicViewData {
  filtres: DynamicViewFilters;
  agentsFiltres: Agent[];
  stats: {
    effectif: number;
    hommes: number;
    femmes: number;
    ageMoyen: number;
  };
  repartitionAge: AgeRepartition[];
  repartitionService: {
    name: string;
    count: number;
  }[];
}

// ============================================================================
// STRUCTURE DE DONNÉES COMPLÈTE
// ============================================================================

export interface StatDirmData {
  agents: Agent[];
  capacites: {
    missions: MissionCapacite[];
    regions: RegionCapacite[];
  };
  metadonnees?: {
    dateExport: string;
    version: string;
  };
  /**
   * Historique d'exports (année/année ou multi-snapshots).
   * Quand présent, `agents` doit représenter le snapshot courant (le plus récent).
   */
  historique?: Array<{
    agents: Agent[];
    metadonnees: {
      dateExport: string;
      version: string;
      source?: string;
    };
  }>;
}

// ============================================================================
// CONSTANTES : LISTES DE VALEURS AUTORISÉES
// ============================================================================

export const SERVICES = [
  'Opérations maritimes',
  'Surveillance et contrôle',
  'Administration',
  'Affaires juridiques',
  'Environnement',
  'Formation',
  'Communication',
  'Informatique'
] as const;

export const MISSIONS = [
  'Contrôle et surveillance',
  'Police des pêches',
  'Sauvetage en mer',
  'Protection environnement',
  'Gestion portuaire',
  'Formation maritime',
  'Affaires maritimes',
  'Support administratif'
] as const;

export const METIERS = [
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
] as const;

export const REGIONS: Region[] = ['Marseille', 'Nice', 'Toulon', 'Sète'];
export const STATUTS: Statut[] = ['Titulaire', 'CDI', 'CDD', 'Stagiaire'];
export const NIVEAUX: NiveauResponsabilite[] = ['Direction', 'Encadrement', 'Opérationnel'];
