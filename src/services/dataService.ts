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

/** Libellé de l’option de filtre DIRM Méditerranée */
export const DIRM_MEDITERANEE_LABEL = 'DIRM Méditerranée';

/** Services rattachés à la façade DIRM Méditerranée (option de filtre dédiée). */
export const DIRM_MEDITERANEE_SERVICES = ['DIRM MED', 'DDTM 06', 'DDTM 13', 'DDTM 34', 'DDTM 83', 'DMLC CORSE', 'DML CORSE'] as const;

export function isDirmMediterraneeAgent(agent: Agent): boolean {
  return DIRM_MEDITERANEE_SERVICES.includes(agent.service as typeof DIRM_MEDITERANEE_SERVICES[number]);
}

/** Données de repli (build + absence de /data/agents.json) */
export const fallbackData: StatDirmData = agentsData as StatDirmData;

/**
 * Normalise une liste d'agents (mapping région, mission, service, statut)
 */
export function normalizeAgents(agents: Agent[]): Agent[] {
  return agents.map(agent => {
    // Créer une copie pour éviter de muter les données originales
    const normalizedAgent = { ...agent };
    
    // Normaliser la mission
    if (normalizedAgent.mission && MISSION_MAPPING[normalizedAgent.mission]) {
      normalizedAgent.mission = MISSION_MAPPING[normalizedAgent.mission];
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
  pasa?: string;
  corps?: string;
  fonction?: string; // catégorie générique
};

/** Filtre une liste d'agents selon des critères */
export function filterAgentsFrom(agents: Agent[], filters: AgentsFilters): Agent[] {
  let result = agents;
  if (filters.region && filters.region !== 'all') result = result.filter((a) => a.region === filters.region);
  if (filters.service && filters.service !== 'all') {
    if (filters.service === DIRM_MEDITERANEE_LABEL) {
      result = result.filter((a) => isDirmMediterraneeAgent(a));
    } else {
      result = result.filter((a) => a.service === filters.service);
    }
  }
  if (filters.statut && filters.statut !== 'all') result = result.filter((a) => a.statut === filters.statut);
  if (filters.mission && filters.mission !== 'all') result = result.filter((a) => a.mission === filters.mission);
  if (filters.pasa && filters.pasa !== 'all') result = result.filter((a) => a.pasaCode === filters.pasa);
  if (filters.corps && filters.corps !== 'all') result = result.filter((a) => (a.corps || a.metier) === filters.corps);
  if (filters.fonction && filters.fonction !== 'all') result = result.filter((a) => a.fonctionCategorie === filters.fonction);
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
