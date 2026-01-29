/**
 * Service de gestion des données pour StatDirm
 * Charge et traite les données des agents
 */

import type { Agent, StatDirmData } from '../types/data';
// Fichier versionné pour que le build (ex. Netlify) réussisse sans agents.json (données sensibles)
import agentsData from '../data/agents.fallback.json';

// Mapping des codes Action vers les noms de missions
const MISSION_MAPPING: Record<string, string> = {
  '0205-01': 'Contrôle et surveillance',
  '0205-02': 'Police des pêches',
  '0205-04': 'Sauvetage en mer',
  '0203': 'Protection environnement',
  '0203-14': 'Gestion portuaire',
  '0203-43': 'Formation maritime',
  '0205': 'Affaires maritimes',
  '1': 'Support administratif',
  '0.8': 'Support administratif',
  '0.5': 'Support administratif'
};

// Mapping des services vers les noms normalisés
const SERVICE_MAPPING: Record<string, string> = {
  'DDTM 06': 'Opérations maritimes',
  'DIRM MED': 'Opérations maritimes',
  'DDTM 13': 'Surveillance et contrôle',
  'DDTM 83': 'Surveillance et contrôle',
  'DDTM 30': 'Administration',
  'DDTM 34': 'Administration',
  'DDTM 11': 'Affaires juridiques',
  'DDTM 66': 'Environnement',
  'DDTM 04': 'Formation',
  'DDTM 05': 'Formation'
};

// Mapping des services (codes DDTM) vers les régions DIRM Méditerranée
// DDTM 06 = Alpes-Maritimes (Nice)
// DDTM 13 = Bouches-du-Rhône (Marseille)
// DDTM 83 = Var (Toulon)
// DDTM 34 = Hérault (Sète/Montpellier)
const SERVICE_TO_REGION_MAPPING: Record<string, string> = {
  'DDTM 06': 'Nice',
  'DDTM 13': 'Marseille',
  'DDTM 83': 'Toulon',
  'DDTM 34': 'Sète',
  'DIRM MED': 'Marseille' // DIRM Méditerranée basée à Marseille
};

/** Libellé de l’option de filtre DIRM Méditerranée */
export const DIRM_MEDITERANEE_LABEL = 'DIRM Méditerranée';

/** Régions de la DIRM Méditerranée (option de filtre "DIRM Méditerranée") */
export const DIRM_MEDITERANEE_REGIONS = ['Marseille', 'Nice', 'Toulon', 'Sète'] as const;

/** Données de repli (build + absence de /data/agents.json) */
export const fallbackData: StatDirmData = agentsData as StatDirmData;

/**
 * Normalise une liste d'agents (mapping région, mission, service, statut)
 */
export function normalizeAgents(agents: Agent[]): Agent[] {
  return agents.map(agent => {
    // Créer une copie pour éviter de muter les données originales
    const normalizedAgent = { ...agent };
    
    // IMPORTANT: Corriger la région AVANT de normaliser le service
    // Car le mapping utilise les codes DDTM originaux (DDTM 13, DDTM 83, etc.)
    const serviceOriginal = normalizedAgent.service;
    if (serviceOriginal && SERVICE_TO_REGION_MAPPING[serviceOriginal]) {
      normalizedAgent.region = SERVICE_TO_REGION_MAPPING[serviceOriginal] as any;
    }
    
    // Normaliser la mission
    if (normalizedAgent.mission && MISSION_MAPPING[normalizedAgent.mission]) {
      normalizedAgent.mission = MISSION_MAPPING[normalizedAgent.mission];
    }
    
    // Normaliser le service si possible (après avoir utilisé le service original pour la région)
    if (normalizedAgent.service && SERVICE_MAPPING[normalizedAgent.service]) {
      normalizedAgent.service = SERVICE_MAPPING[normalizedAgent.service];
    }
    
    // Corriger le statut basé sur la catégorie si nécessaire
    // (les catégories A, B, C sont des titulaires)
    if (normalizedAgent.statut === 'CDD' && normalizedAgent.niveauResponsabilite !== 'Opérationnel') {
      // Si c'est une catégorie, c'est probablement un titulaire
      if (['A', 'B', 'C'].includes(normalizedAgent.niveauResponsabilite as string)) {
        normalizedAgent.statut = 'Titulaire';
      }
    }
    
    return normalizedAgent;
  });
}

/**
 * Charge et normalise les données des agents (depuis une source donnée)
 */
export function loadAgentsDataFrom(data: StatDirmData): Agent[] {
  return normalizeAgents(data.agents);
}

/**
 * Charge et normalise les données des agents (fallback intégré)
 */
export function loadAgentsData(): Agent[] {
  return loadAgentsDataFrom(fallbackData);
}

const DEFAULT_CAPACITES = {
  missions: [
    { mission: 'Contrôle et surveillance', capaciteMaximale: 95 },
    { mission: 'Police des pêches', capaciteMaximale: 60 },
    { mission: 'Sauvetage en mer', capaciteMaximale: 48 },
    { mission: 'Protection environnement', capaciteMaximale: 42 },
    { mission: 'Gestion portuaire', capaciteMaximale: 35 },
    { mission: 'Formation maritime', capaciteMaximale: 32 },
    { mission: 'Affaires maritimes', capaciteMaximale: 35 },
    { mission: 'Support administratif', capaciteMaximale: 28 }
  ],
  regions: [
    { region: 'Marseille', capaciteMaximale: 150, status: 'normal' as const, coordonnees: { x: 83, y: 81 } },
    { region: 'Nice', capaciteMaximale: 85, status: 'normal' as const, coordonnees: { x: 94, y: 76 } },
    { region: 'Toulon', capaciteMaximale: 92, status: 'normal' as const, coordonnees: { x: 88, y: 83 } },
    { region: 'Sète', capaciteMaximale: 48, status: 'normal' as const, coordonnees: { x: 66, y: 80 } }
  ]
};

/**
 * Charge les capacités depuis les données
 */
export function loadCapacitesFrom(data: StatDirmData) {
  return data.capacites || DEFAULT_CAPACITES;
}

export function loadCapacites() {
  return loadCapacitesFrom(fallbackData);
}

/**
 * Obtient tous les agents
 */
export function getAllAgents(): Agent[] {
  return loadAgentsData();
}

export type AgentsFilters = {
  region?: string;
  service?: string;
  statut?: string;
  mission?: string;
};

/** Filtre une liste d'agents selon des critères */
export function filterAgentsFrom(agents: Agent[], filters: AgentsFilters): Agent[] {
  let result = agents;
  if (filters.region && filters.region !== 'all') result = result.filter((a) => a.region === filters.region);
  if (filters.service && filters.service !== 'all') {
    if (filters.service === DIRM_MEDITERANEE_LABEL) {
      result = result.filter((a) => DIRM_MEDITERANEE_REGIONS.includes(a.region as typeof DIRM_MEDITERANEE_REGIONS[number]));
    } else {
      result = result.filter((a) => a.service === filters.service);
    }
  }
  if (filters.statut && filters.statut !== 'all') result = result.filter((a) => a.statut === filters.statut);
  if (filters.mission && filters.mission !== 'all') result = result.filter((a) => a.mission === filters.mission);
  return result;
}

/**
 * Filtre les agents selon des critères (utilise getAllAgents)
 */
export function filterAgents(filters: AgentsFilters): Agent[] {
  return filterAgentsFrom(getAllAgents(), filters);
}

/**
 * Obtient les valeurs uniques pour les filtres
 */
export function getUniqueValues() {
  const agents = getAllAgents();
  
  return {
    regions: Array.from(new Set(agents.map(a => a.region))).sort(),
    services: Array.from(new Set(agents.map(a => a.service))).sort(),
    statuts: Array.from(new Set(agents.map(a => a.statut))).sort(),
    missions: Array.from(new Set(agents.map(a => a.mission))).sort(),
    metiers: Array.from(new Set(agents.map(a => a.metier))).sort()
  };
}
