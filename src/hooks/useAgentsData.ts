/**
 * Hook React pour accéder aux données des agents
 * Utilise le contexte (données chargées depuis /data/agents.json) quand il est disponible.
 */

import { useMemo } from 'react';
import { getAllAgents, filterAgentsFrom, loadCapacites, DIRM_MEDITERANEE_LABEL, DIRM_MEDITERANEE_REGIONS } from '../services/dataService';
import { useAgentsDataContextOptional } from '../contexts/AgentsDataContext';
import { useGlobalFilterContext } from '../contexts/GlobalFilterContext';
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

/** Agents bruts (sans filtre global) — pour construire les listes de filtres. */
export function useAgentsDataRaw(): Agent[] {
  const ctx = useAgentsDataContextOptional();
  return useMemo(() => (ctx ? ctx.agents : getAllAgents()), [ctx]);
}

/** Agents éventuellement filtrés par le filtre global (Région / Service dont DIRM Méditerranée / Statut). */
export function useAgentsData(): Agent[] {
  const rawAgents = useAgentsDataRaw();
  const globalFilter = useGlobalFilterContext();
  return useMemo(() => {
    if (!globalFilter || (globalFilter.filters.region === 'all' && globalFilter.filters.service === 'all' && globalFilter.filters.statut === 'all')) {
      return rawAgents;
    }
    return filterAgentsFrom(rawAgents, {
      region: globalFilter.filters.region !== 'all' ? globalFilter.filters.region : undefined,
      service: globalFilter.filters.service !== 'all' ? globalFilter.filters.service : undefined,
      statut: globalFilter.filters.statut !== 'all' ? globalFilter.filters.statut : undefined
    });
  }, [rawAgents, globalFilter]);
}

export function useFilteredAgents(filters: {
  region?: string;
  service?: string;
  statut?: string;
  mission?: string;
}) {
  const agents = useAgentsData();
  return useMemo(() => filterAgentsFrom(agents, filters), [agents, filters.region, filters.service, filters.statut, filters.mission]);
}

export function useUniqueValues() {
  const agents = useAgentsData();
  return useMemo(
    () => {
      const servicesSet = new Set(agents.map((a) => a.service));
      servicesSet.add(DIRM_MEDITERANEE_LABEL);
      const services = [DIRM_MEDITERANEE_LABEL, ...Array.from(servicesSet).filter((s) => s !== DIRM_MEDITERANEE_LABEL).sort()];
      return {
        regions: Array.from(new Set(agents.map((a) => a.region))).sort(),
        services,
        statuts: Array.from(new Set(agents.map((a) => a.statut))).sort(),
        missions: Array.from(new Set(agents.map((a) => a.mission))).sort(),
        metiers: Array.from(new Set(agents.map((a) => a.metier))).sort()
      };
    },
    [agents]
  );
}

/** Options pour la barre de filtres globale (basées sur les agents bruts, avec DIRM Méditerranée dans Service). */
export function useFilterOptions() {
  const rawAgents = useAgentsDataRaw();
  return useMemo(
    () => {
      const regions = Array.from(new Set(rawAgents.map((a) => a.region))).sort();
      const servicesSet = new Set(rawAgents.map((a) => a.service));
      servicesSet.add(DIRM_MEDITERANEE_LABEL);
      const services = [DIRM_MEDITERANEE_LABEL, ...Array.from(servicesSet).filter((s) => s !== DIRM_MEDITERANEE_LABEL)].sort((a, b) => a.localeCompare(b, 'fr'));
      const statuts = Array.from(new Set(rawAgents.map((a) => a.statut))).sort();
      return { regions, services, statuts };
    },
    [rawAgents]
  );
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
  return useMemo(() => {
    const base = calculerRepartitionContrat(agents);
    const agentsActifs = agents.filter((a) => a.actif);
    const dirmMedAgents = agentsActifs.filter((a) =>
      (DIRM_MEDITERANEE_REGIONS as readonly string[]).includes(a.region)
    );
    let tempsPlein = 0;
    let tempsPartiel = 0;
    let cdd = 0;
    let stagiaires = 0;
    dirmMedAgents.forEach((agent) => {
      if (agent.statut === 'Stagiaire') stagiaires++;
      else if (agent.statut === 'CDD') cdd++;
      else if (agent.contratType === 'Temps partiel') tempsPartiel++;
      else tempsPlein++;
    });
    const dirmMedEntry = {
      service: DIRM_MEDITERANEE_LABEL,
      tempsPlein,
      tempsPartiel,
      cdd,
      stagiaires
    };
    const withDirmMed = [...base.filter((s) => s.service !== DIRM_MEDITERANEE_LABEL), dirmMedEntry];
    return withDirmMed.sort((a, b) => (b.tempsPlein + b.tempsPartiel + b.cdd + b.stagiaires) - (a.tempsPlein + a.tempsPartiel + a.cdd + a.stagiaires));
  }, [agents]);
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
  const ctx = useAgentsDataContextOptional();
  const agents = useAgentsData();
  const capacites = ctx ? ctx.capacites : loadCapacites();
  return useMemo(
    () => mettreAJourCapacitesMissions(capacites.missions, agents),
    [agents, capacites.missions]
  );
}

export function useCapacitesRegions() {
  const ctx = useAgentsDataContextOptional();
  const agents = useAgentsData();
  const capacites = ctx ? ctx.capacites : loadCapacites();
  return useMemo(
    () => mettreAJourCapacitesRegions(capacites.regions, agents),
    [agents, capacites.regions]
  );
}

export function useStatsParService() {
  const agents = useAgentsData();
  return useMemo(() => {
    const baseStats = calculerStatsParService(agents);
    const agentsActifs = agents.filter((a) => a.actif);
    const total = agentsActifs.length;
    const nbServices = baseStats.length || 1;
    const moyenne = total / nbServices;

    const dirmMedEffectif = agentsActifs.filter((a) =>
      (DIRM_MEDITERANEE_REGIONS as readonly string[]).includes(a.region)
    ).length;

    let dirmMedStatus: 'normal' | 'fragile' | 'critique' = 'normal';
    if (dirmMedEffectif < 10 || (moyenne > 20 && dirmMedEffectif < moyenne * 0.3)) {
      dirmMedStatus = 'critique';
    } else if (dirmMedEffectif < 20 || (moyenne > 30 && dirmMedEffectif < moyenne * 0.5)) {
      dirmMedStatus = 'fragile';
    }

    const dirmMedEntry = {
      name: DIRM_MEDITERANEE_LABEL,
      effectif: dirmMedEffectif,
      status: dirmMedStatus
    };

    const withDirmMed = [...baseStats.filter((s) => s.name !== DIRM_MEDITERANEE_LABEL), dirmMedEntry];
    return withDirmMed.sort((a, b) => b.effectif - a.effectif);
  }, [agents]);
}
