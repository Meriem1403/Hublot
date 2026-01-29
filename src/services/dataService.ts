/**
 * Service de gestion des données pour StatDirm
 * Charge et traite les données des agents
 */

import type { Agent, StatDirmData } from '../types/data';
import agentsData from '../data/agents.json';

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

/**
 * Charge et normalise les données des agents
 */
export function loadAgentsData(): Agent[] {
  const data = agentsData as StatDirmData;
  
  return data.agents.map(agent => {
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
 * Charge les capacités depuis les données
 */
export function loadCapacites() {
  const data = agentsData as StatDirmData;
  return data.capacites || {
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
      { region: 'Marseille', capaciteMaximale: 150, coordonnees: { x: 83, y: 81 } },
      { region: 'Nice', capaciteMaximale: 85, coordonnees: { x: 94, y: 76 } },
      { region: 'Toulon', capaciteMaximale: 92, coordonnees: { x: 88, y: 83 } },
      { region: 'Sète', capaciteMaximale: 48, coordonnees: { x: 66, y: 80 } }
    ]
  };
}

/**
 * Obtient tous les agents
 */
export function getAllAgents(): Agent[] {
  return loadAgentsData();
}

/**
 * Filtre les agents selon des critères
 */
export function filterAgents(filters: {
  region?: string;
  service?: string;
  statut?: string;
  mission?: string;
}): Agent[] {
  let agents = getAllAgents();
  
  if (filters.region && filters.region !== 'all') {
    agents = agents.filter(a => a.region === filters.region);
  }
  
  if (filters.service && filters.service !== 'all') {
    agents = agents.filter(a => a.service === filters.service);
  }
  
  if (filters.statut && filters.statut !== 'all') {
    agents = agents.filter(a => a.statut === filters.statut);
  }
  
  if (filters.mission && filters.mission !== 'all') {
    agents = agents.filter(a => a.mission === filters.mission);
  }
  
  return agents;
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
