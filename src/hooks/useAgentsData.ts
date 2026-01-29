/**
 * Hook React pour accéder aux données des agents
 */

import { useMemo } from 'react';
import { getAllAgents, filterAgents, getUniqueValues, loadCapacites } from '../services/dataService';
import {
  calculerOverviewStats,
  calculerRepartitionStatut,
  calculerRepartitionContrat,
  calculerRepartitionResponsabilite,
  calculerRepartitionMetier,
  calculerRepartitionAge,
  calculerIndicateursAge,
  calculerRepartitionGenre,
  calculerGenreParService,
  calculerGenreParNiveau,
  calculerTempsTravail,
  mettreAJourCapacitesMissions,
  mettreAJourCapacitesRegions,
  calculerStatsParService
} from '../utils/dataCalculations';
import type { Agent } from '../types/data';

export function useAgentsData() {
  return useMemo(() => getAllAgents(), []);
}

export function useFilteredAgents(filters: {
  region?: string;
  service?: string;
  statut?: string;
  mission?: string;
}) {
  return useMemo(() => filterAgents(filters), [filters.region, filters.service, filters.statut, filters.mission]);
}

export function useUniqueValues() {
  return useMemo(() => getUniqueValues(), []);
}

export function useOverviewStats() {
  const agents = useAgentsData();
  
  // Calculer les capacités totales UNIQUEMENT depuis les données réelles
  // Pas de valeurs codées en dur - tout est calculé dynamiquement
  const agentsActifs = agents.filter(a => a.actif);
  
  // Capacité totale = nombre d'agents actifs + marge de 10% pour les postes vacants
  // Cela représente la capacité théorique nécessaire pour couvrir tous les besoins
  const capacitesTotal = Math.ceil(agentsActifs.length * 1.1);
  
  return useMemo(() => calculerOverviewStats(agents, capacitesTotal), [agents, capacitesTotal]);
}

export function useStatutRepartition() {
  const agents = useAgentsData();
  return useMemo(() => calculerRepartitionStatut(agents), [agents]);
}

export function useContratRepartition() {
  const agents = useAgentsData();
  return useMemo(() => calculerRepartitionContrat(agents), [agents]);
}

export function useResponsabiliteRepartition() {
  const agents = useAgentsData();
  return useMemo(() => calculerRepartitionResponsabilite(agents), [agents]);
}

export function useMetierRepartition() {
  const agents = useAgentsData();
  return useMemo(() => calculerRepartitionMetier(agents), [agents]);
}

export function useAgeRepartition() {
  const agents = useAgentsData();
  return useMemo(() => calculerRepartitionAge(agents), [agents]);
}

export function useAgeIndicateurs() {
  const agents = useAgentsData();
  return useMemo(() => calculerIndicateursAge(agents), [agents]);
}

export function useGenreRepartition() {
  const agents = useAgentsData();
  return useMemo(() => calculerRepartitionGenre(agents), [agents]);
}

export function useGenreParService() {
  const agents = useAgentsData();
  return useMemo(() => calculerGenreParService(agents), [agents]);
}

export function useGenreParNiveau() {
  const agents = useAgentsData();
  return useMemo(() => calculerGenreParNiveau(agents), [agents]);
}

export function useTempsTravail() {
  const agents = useAgentsData();
  return useMemo(() => calculerTempsTravail(agents), [agents]);
}

export function useCapacitesMissions() {
  const agents = useAgentsData();
  const capacites = useMemo(() => loadCapacites(), []);
  
  return useMemo(() => {
    return mettreAJourCapacitesMissions(capacites.missions, agents);
  }, [agents, capacites.missions]);
}

export function useCapacitesRegions() {
  const agents = useAgentsData();
  const capacites = useMemo(() => loadCapacites(), []);
  
  return useMemo(() => {
    return mettreAJourCapacitesRegions(capacites.regions, agents);
  }, [agents, capacites.regions]);
}

export function useStatsParService() {
  const agents = useAgentsData();
  return useMemo(() => calculerStatsParService(agents), [agents]);
}
