/**
 * Fonctions utilitaires pour calculer les statistiques à partir des données brutes
 */

import type {
  Agent,
  OverviewStats,
  StatutRepartition,
  ContratRepartition,
  ResponsabiliteRepartition,
  MetierRepartition,
  AgeRepartition,
  AgeIndicateurs,
  GenreRepartition,
  GenreParService,
  GenreParNiveau,
  TempsTravailStats,
  MissionCapacite,
  RegionCapacite,
  TrancheAge
} from '../types/data';

// ============================================================================
// CALCULS D'ÂGE
// ============================================================================

/**
 * Calcule l'âge à partir d'une date de naissance
 */
export function calculerAge(dateNaissance: string): number {
  const today = new Date();
  const birthDate = new Date(dateNaissance);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Détermine la tranche d'âge à partir d'un âge
 */
export function getTrancheAge(age: number): TrancheAge {
  if (age < 25) return '< 25 ans';
  if (age < 30) return '25-29 ans';
  if (age < 35) return '30-34 ans';
  if (age < 40) return '35-39 ans';
  if (age < 45) return '40-44 ans';
  if (age < 50) return '45-49 ans';
  if (age < 55) return '50-54 ans';
  if (age < 60) return '55-59 ans';
  if (age < 65) return '60-64 ans';
  return '≥ 65 ans';
}

// ============================================================================
// CALCULS ETP (Équivalent Temps Plein)
// ============================================================================

/**
 * Calcule l'ETP d'un agent
 */
export function calculerETP(agent: Agent): number {
  if (agent.contratType === 'Temps plein') {
    return 1.0;
  }
  
  if (agent.contratType === 'Temps partiel' && agent.tempsPartielPourcentage) {
    return agent.tempsPartielPourcentage / 100;
  }
  
  return agent.etp || 1.0;
}

// ============================================================================
// STATISTIQUES GLOBALES
// ============================================================================

/**
 * Calcule les statistiques de vue d'ensemble
 */
export function calculerOverviewStats(
  agents: Agent[],
  capacitesTotal: number
): OverviewStats {
  const agentsActifs = agents.filter(a => a.actif);
  const effectifsTotaux = agentsActifs.length;
  // Ratio encadrement
  const encadrants = agentsActifs.filter(
    a => a.niveauResponsabilite === 'Encadrement' || a.niveauResponsabilite === 'Direction'
  ).length;
  const operationnels = agentsActifs.filter(
    a => a.niveauResponsabilite === 'Opérationnel'
  ).length;
  
  let ratioEncadrement: string;
  if (encadrants > 0 && operationnels > 0) {
    ratioEncadrement = `1:${Math.round(operationnels / encadrants)}`;
  } else if (encadrants > 0 && operationnels === 0) {
    ratioEncadrement = `${encadrants}:0`;
  } else if (encadrants === 0 && operationnels > 0) {
    ratioEncadrement = `0:${operationnels}`;
  } else {
    ratioEncadrement = 'N/A';
  }
  
  const nbTempsPlein = agentsActifs.filter((a) => a.contratType === 'Temps plein').length;
  const nbTempsPartiel = agentsActifs.filter((a) => a.contratType === 'Temps partiel').length;
  const etpTotal = agentsActifs.reduce((sum, a) => sum + (typeof a.etp === 'number' ? a.etp : 0), 0);
  
  return {
    effectifsTotaux,
    ratioEncadrement,
    encadrantsTotal: encadrants,
    operationnelsTotal: operationnels,
    etpTotal,
    nbTempsPlein,
    nbTempsPartiel
  };
}

// ============================================================================
// RÉPARTITIONS PAR STATUT
// ============================================================================

/**
 * Calcule la répartition par statut
 */
export function calculerRepartitionStatut(agents: Agent[]): StatutRepartition[] {
  const agentsActifs = agents.filter(a => a.actif);
  const total = agentsActifs.length;
  
  const statuts: Record<string, number> = {};
  agentsActifs.forEach(agent => {
    statuts[agent.statut] = (statuts[agent.statut] || 0) + 1;
  });
  
  return Object.entries(statuts).map(([statut, nombre]) => ({
    statut: statut as StatutRepartition['statut'],
    nombre,
    pourcentage: total > 0 ? (nombre / total) * 100 : 0
  }));
}

// ============================================================================
// RÉPARTITIONS PAR CONTRAT
// ============================================================================

/**
 * Calcule la répartition par type de contrat par service
 */
export function calculerRepartitionContrat(agents: Agent[]): ContratRepartition[] {
  const agentsActifs = agents.filter(a => a.actif);
  const services: Record<string, ContratRepartition> = {};
  
  agentsActifs.forEach(agent => {
    if (!services[agent.service]) {
      services[agent.service] = {
        service: agent.service,
        tempsPlein: 0,
        tempsPartiel: 0,
        cdd: 0,
        stagiaires: 0
      };
    }
    
    const service = services[agent.service];
    
    if (agent.statut === 'Stagiaire') {
      service.stagiaires++;
    } else if (agent.statut === 'CDD') {
      service.cdd++;
    } else if (agent.contratType === 'Temps partiel') {
      service.tempsPartiel++;
    } else {
      service.tempsPlein++;
    }
  });
  
  return Object.values(services);
}

// ============================================================================
// RÉPARTITIONS PAR RESPONSABILITÉ
// ============================================================================

/**
 * Calcule la répartition par niveau de responsabilité
 */
export function calculerRepartitionResponsabilite(
  agents: Agent[]
): ResponsabiliteRepartition[] {
  const agentsActifs = agents.filter(a => a.actif);
  const total = agentsActifs.length;
  
  const niveaux: Record<string, { count: number; exemples: Set<string> }> = {};
  
  agentsActifs.forEach(agent => {
    if (!niveaux[agent.niveauResponsabilite]) {
      niveaux[agent.niveauResponsabilite] = {
        count: 0,
        exemples: new Set()
      };
    }
    
    niveaux[agent.niveauResponsabilite].count++;
    niveaux[agent.niveauResponsabilite].exemples.add(agent.poste);
  });
  
  const exemplesParNiveau: Record<string, string> = {
    'Direction': 'Directeur, Directeurs adjoints, Chefs de département',
    'Encadrement': 'Chefs de service, Responsables d\'unité, Coordinateurs',
    'Opérationnel': 'Agents de contrôle, Administratifs, Techniciens'
  };
  
  return Object.entries(niveaux).map(([niveau, data]) => ({
    niveau: niveau as ResponsabiliteRepartition['niveau'],
    nombre: data.count,
    pourcentage: total > 0 ? (data.count / total) * 100 : 0,
    exemples: exemplesParNiveau[niveau] || Array.from(data.exemples).slice(0, 3).join(', ')
  }));
}

// ============================================================================
// RÉPARTITIONS PAR MÉTIER
// ============================================================================

/**
 * Calcule la répartition par métier
 * Uniquement basé sur des données réelles (effectif par métier).
 */
export function calculerRepartitionMetier(
  agents: Agent[]
): MetierRepartition[] {
  const agentsActifs = agents.filter(a => a.actif);
  
  const metiers: Record<string, number> = {};
  agentsActifs.forEach(agent => {
    const libelle = (
      agent.libelleNNE ||
      agent.fonctionExercee ||
      agent.corps ||
      agent.metier ||
      'Non défini'
    ).trim();
    metiers[libelle] = (metiers[libelle] || 0) + 1;
  });
  
  return Object.entries(metiers).map(([metier, effectif]) => {
    return {
      metier,
      effectif
    };
  });
}

// ============================================================================
// RÉPARTITIONS PAR ÂGE
// ============================================================================

/**
 * Calcule la répartition par tranche d'âge
 */
export function calculerRepartitionAge(agents: Agent[]): AgeRepartition[] {
  const agentsActifs = agents.filter(a => a.actif);
  
  const tranches: Record<TrancheAge, { total: number; hommes: number; femmes: number }> = {
    '< 25 ans': { total: 0, hommes: 0, femmes: 0 },
    '25-29 ans': { total: 0, hommes: 0, femmes: 0 },
    '30-34 ans': { total: 0, hommes: 0, femmes: 0 },
    '35-39 ans': { total: 0, hommes: 0, femmes: 0 },
    '40-44 ans': { total: 0, hommes: 0, femmes: 0 },
    '45-49 ans': { total: 0, hommes: 0, femmes: 0 },
    '50-54 ans': { total: 0, hommes: 0, femmes: 0 },
    '55-59 ans': { total: 0, hommes: 0, femmes: 0 },
    '60-64 ans': { total: 0, hommes: 0, femmes: 0 },
    '≥ 65 ans': { total: 0, hommes: 0, femmes: 0 }
  };
  
  agentsActifs.forEach(agent => {
    const age = calculerAge(agent.dateNaissance);
    const tranche = getTrancheAge(age);
    
    tranches[tranche].total++;
    if (agent.genre === 'H') {
      tranches[tranche].hommes++;
    } else if (agent.genre === 'F') {
      tranches[tranche].femmes++;
    }
  });
  
  return Object.entries(tranches).map(([tranche, data]) => ({
    tranche: tranche as TrancheAge,
    effectif: data.total,
    hommes: data.hommes,
    femmes: data.femmes
  }));
}

/**
 * Calcule les indicateurs démographiques
 */
export function calculerIndicateursAge(agents: Agent[]): AgeIndicateurs {
  const agentsActifs = agents.filter(a => a.actif);
  const ages = agentsActifs.map(a => calculerAge(a.dateNaissance));
  
  // Âge moyen
  const ageMoyen = ages.length > 0
    ? ages.reduce((sum, age) => sum + age, 0) / ages.length
    : 0;
  
  // Âge médian
  const agesTries = [...ages].sort((a, b) => a - b);
  const ageMedian = agesTries.length > 0
    ? agesTries[Math.floor(agesTries.length / 2)]
    : 0;
  
  // Répartitions
  const jeunesMoins35 = ages.filter(age => age < 35).length;
  const coeur35_54 = ages.filter(age => age >= 35 && age < 55).length;
  const seniorsPlus55 = ages.filter(age => age >= 55).length;
  
  // Âge moyen de recrutement (uniquement si date d'embauche disponible)
  const agesRecrutement = agentsActifs
    .filter(a => a.dateEmbauche)
    .map(a => {
      const ageNaissance = calculerAge(a.dateNaissance);
      const ageAEmbauche = calculerAge(a.dateEmbauche!);
      // âge à l'embauche = âge actuel - ancienneté
      return ageNaissance - (ageNaissance - ageAEmbauche);
    });
  const ageMoyenRecrutement = agesRecrutement.length > 0
    ? agesRecrutement.reduce((sum, age) => sum + age, 0) / agesRecrutement.length
    : 0; // 0 = non disponible (aucune date d'embauche renseignée)
  
  // Âge moyen de départ : non calculable pour l'instant (aucune date de départ renseignée)
  const ageMoyenDepart = 0; // 0 = non disponible
  
  return {
    ageMoyen: Math.round(ageMoyen * 10) / 10,
    ageMedian,
    ageMoyenRecrutement: Math.round(ageMoyenRecrutement),
    ageMoyenDepart,
    jeunesMoins35,
    coeur35_54,
    seniorsPlus55
  };
}

// ============================================================================
// RÉPARTITIONS PAR GENRE
// ============================================================================

/**
 * Calcule la répartition globale par genre
 */
export function calculerRepartitionGenre(agents: Agent[]): GenreRepartition[] {
  const agentsActifs = agents.filter(a => a.actif);
  const total = agentsActifs.length;
  
  const hommes = agentsActifs.filter(a => a.genre === 'H').length;
  const femmes = agentsActifs.filter(a => a.genre === 'F').length;
  
  return [
    {
      genre: 'Hommes',
      nombre: hommes,
      pourcentage: total > 0 ? (hommes / total) * 100 : 0
    },
    {
      genre: 'Femmes',
      nombre: femmes,
      pourcentage: total > 0 ? (femmes / total) * 100 : 0
    }
  ];
}

/**
 * Calcule la répartition par genre par service
 */
export function calculerGenreParService(agents: Agent[]): GenreParService[] {
  const agentsActifs = agents.filter(a => a.actif);
  const services: Record<string, GenreParService> = {};
  
  agentsActifs.forEach(agent => {
    if (!services[agent.service]) {
      services[agent.service] = {
        service: agent.service,
        hommes: 0,
        femmes: 0,
        totalService: 0
      };
    }
    
    const service = services[agent.service];
    service.totalService++;
    
    if (agent.genre === 'H') {
      service.hommes++;
    } else if (agent.genre === 'F') {
      service.femmes++;
    }
  });
  
  return Object.values(services);
}

/**
 * Calcule les statistiques par service pour le treemap
 */
export function calculerStatsParService(agents: Agent[]): Array<{
  name: string;
  effectif: number;
  status: 'normal' | 'fragile' | 'critique';
}> {
  const agentsActifs = agents.filter(a => a.actif);
  const services: Record<string, number> = {};
  
  agentsActifs.forEach(agent => {
    services[agent.service] = (services[agent.service] || 0) + 1;
  });
  
  const total = agentsActifs.length;
  const moyenne = total / Object.keys(services).length;
  
  return Object.entries(services)
    .map(([name, effectif]) => {
      // Déterminer le statut basé sur l'effectif avec des seuils plus réalistes
      // Critique si effectif < 10 agents OU < 30% de la moyenne (pour les très petits services)
      // Fragile si effectif < 20 agents OU < 50% de la moyenne
      // Normal sinon
      let status: 'normal' | 'fragile' | 'critique' = 'normal';
      
      // Seuils absolus pour éviter de marquer tous les petits services comme critiques
      if (effectif < 10 || (moyenne > 20 && effectif < moyenne * 0.3)) {
        status = 'critique';
      } else if (effectif < 20 || (moyenne > 30 && effectif < moyenne * 0.5)) {
        status = 'fragile';
      }
      
      return {
        name,
        effectif,
        status
      };
    })
    .sort((a, b) => b.effectif - a.effectif);
}

/**
 * Calcule la répartition par genre par niveau
 */
export function calculerGenreParNiveau(agents: Agent[]): GenreParNiveau[] {
  const agentsActifs = agents.filter(a => a.actif);
  const niveaux: Record<string, GenreParNiveau> = {};
  
  agentsActifs.forEach(agent => {
    if (!niveaux[agent.niveauResponsabilite]) {
      niveaux[agent.niveauResponsabilite] = {
        niveau: agent.niveauResponsabilite,
        hommes: 0,
        femmes: 0
      };
    }
    
    const niveau = niveaux[agent.niveauResponsabilite];
    
    if (agent.genre === 'H') {
      niveau.hommes++;
    } else if (agent.genre === 'F') {
      niveau.femmes++;
    }
  });
  
  return Object.values(niveaux);
}

// ============================================================================
// TEMPS DE TRAVAIL
// ============================================================================

/**
 * Calcule les statistiques de temps de travail
 */
export function calculerTempsTravail(agents: Agent[]): TempsTravailStats {
  const agentsActifs = agents.filter(a => a.actif);
  const total = agentsActifs.length;
  
  // Temps plein / temps partiel
  const tempsPlein = agentsActifs.filter(a => a.contratType === 'Temps plein').length;
  const tempsPartiel = agentsActifs.filter(a => a.contratType === 'Temps partiel');
  
  const etpTotal = agentsActifs.reduce((sum, a) => sum + calculerETP(a), 0);
  const etpTempsPlein = tempsPlein;
  const etpTempsPartiel = tempsPartiel.reduce(
    (sum, a) => sum + calculerETP(a),
    0
  );
  
  const moyenneTempsPartiel = tempsPartiel.length > 0
    ? tempsPartiel.reduce(
        (sum, a) => sum + (a.tempsPartielPourcentage || 0),
        0
      ) / tempsPartiel.length
    : 0;
  
  // Absences (basées uniquement sur les données réelles)
  const enConges = agentsActifs.filter(a => a.enConges === true).length;
  const enMaladie = agentsActifs.filter(a => a.enArretMaladie === true).length;
  const enFormation = agentsActifs.filter(a => a.enFormation === true).length;
  const autres = agentsActifs.filter(
    a => !a.enConges && !a.enArretMaladie && !a.enFormation && !a.actif
  ).length;
  
  // Taux (basés uniquement sur les données réelles, pas d'estimation)
  const totalAbsents = enConges + enMaladie + enFormation;
  const tauxPresence = total > 0
    ? ((total - totalAbsents) / total) * 100
    : 100; // Si aucune absence enregistrée, considérer 100% de présence
  
  const tauxTempsPlein = total > 0 ? (tempsPlein / total) * 100 : 0;
  const disponibiliteETP = total > 0 ? (etpTotal / total) * 100 : 0;
  const absentéisme = total > 0 && totalAbsents > 0
    ? (totalAbsents / total) * 100
    : 0; // 0% si aucune absence enregistrée
  
  return {
    tauxPresence: Math.round(tauxPresence * 10) / 10,
    tauxTempsPlein: Math.round(tauxTempsPlein * 10) / 10,
    disponibiliteETP: Math.round(disponibiliteETP * 10) / 10,
    absentéisme: Math.round(absentéisme * 10) / 10,
    details: {
      tempsPlein: {
        count: tempsPlein,
        etp: etpTempsPlein,
        pct: total > 0 ? (tempsPlein / total) * 100 : 0
      },
      tempsPartiel: {
        count: tempsPartiel.length,
        etp: etpTempsPartiel,
        pct: total > 0 ? (tempsPartiel.length / total) * 100 : 0,
        moyennePct: Math.round(moyenneTempsPartiel)
      },
      conges: {
        count: enConges,
        pct: total > 0 ? (enConges / total) * 100 : 0
      },
      maladie: {
        count: enMaladie,
        pct: total > 0 ? (enMaladie / total) * 100 : 0
      },
      formation: {
        count: enFormation,
        pct: total > 0 ? (enFormation / total) * 100 : 0
      },
      autres: {
        count: autres,
        pct: total > 0 ? (autres / total) * 100 : 0
      }
    }
  };
}

// ============================================================================
// CAPACITÉS
// ============================================================================

/**
 * Met à jour les capacités avec les effectifs actuels
 */
export function mettreAJourCapacitesMissions(
  capacites: MissionCapacite[],
  agents: Agent[]
): MissionCapacite[] {
  const agentsActifs = agents.filter(a => a.actif);
  
  return capacites.map(capacite => {
    const effectifActuel = agentsActifs.filter(
      a => a.mission === capacite.mission
    ).length;
    
    const tauxRemplissage = capacite.capaciteMaximale > 0
      ? (effectifActuel / capacite.capaciteMaximale) * 100
      : 0;
    
    return {
      ...capacite,
      effectifActuel,
      tauxRemplissage: Math.round(tauxRemplissage * 10) / 10
    };
  });
}

/**
 * Met à jour les capacités des régions avec les effectifs actuels
 * Génère automatiquement les capacités pour toutes les régions présentes dans les données
 */
export function mettreAJourCapacitesRegions(
  capacites: RegionCapacite[],
  agents: Agent[]
): RegionCapacite[] {
  const agentsActifs = agents.filter(a => a.actif);
  
  // Créer un map des capacités existantes par région
  const capacitesMap = new Map<string, RegionCapacite>();
  capacites.forEach(cap => {
    capacitesMap.set(cap.region, cap);
  });
  
  // Calculer les effectifs par région depuis les agents
  const effectifsParRegion = new Map<string, number>();
  agentsActifs.forEach(agent => {
    if (agent.region) {
      const count = effectifsParRegion.get(agent.region) || 0;
      effectifsParRegion.set(agent.region, count + 1);
    }
  });
  
  // Créer les capacités pour toutes les régions présentes dans les données
  const toutesLesRegions: RegionCapacite[] = [];
  
  effectifsParRegion.forEach((effectifActuel, region) => {
    // Utiliser la capacité existante si disponible, sinon créer une nouvelle
    const capaciteExistante = capacitesMap.get(region);
    
    // Capacité maximale = effectif actuel + 10% de marge
    const capaciteMaximale = capaciteExistante?.capaciteMaximale ?? Math.ceil(effectifActuel * 1.1);
    
    const tauxRemplissage = capaciteMaximale > 0
      ? (effectifActuel / capaciteMaximale) * 100
      : 0;
    
    let status: StatusRegion = 'normal';
    if (tauxRemplissage >= 95) {
      status = 'optimal';
    } else if (tauxRemplissage < 85) {
      status = 'tension';
    }
    
    toutesLesRegions.push({
      region: region as any,
      capaciteMaximale,
      effectifActuel,
      tauxRemplissage: Math.round(tauxRemplissage * 10) / 10,
      status,
      coordonnees: capaciteExistante?.coordonnees
    });
  });
  
  return toutesLesRegions;
}
