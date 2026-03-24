import { describe, it, expect } from 'vitest';
import {
  calculerAge,
  getTrancheAge,
  calculerETP,
  calculerRepartitionStatut,
  calculerRepartitionContrat,
  calculerOverviewStats,
  calculerStatsParService,
  calculerRepartitionGenre,
  calculerRepartitionResponsabilite,
  calculerRepartitionAge
} from './dataCalculations';
import type { Agent } from '../types/data';

function mockAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: '1',
    nom: 'Test',
    prenom: 'Agent',
    dateNaissance: '1990-01-01',
    genre: 'H',
    statut: 'Titulaire',
    contratType: 'Temps plein',
    region: 'Marseille',
    service: 'Service A',
    mission: 'Mission test',
    metier: 'Métier test',
    niveauResponsabilite: 'Opérationnel',
    poste: 'Poste test',
    dateEmbauche: '2020-01-01',
    etp: 1,
    actif: true,
    dateMaj: '2025-01-01',
    enConges: false,
    enFormation: false,
    enArretMaladie: false,
    ...overrides
  };
}

describe('calculerAge', () => {
  it('calcule l’âge à partir d’une date de naissance', () => {
    const age = calculerAge('1990-06-15');
    expect(typeof age).toBe('number');
    expect(age).toBeGreaterThanOrEqual(34);
    expect(age).toBeLessThanOrEqual(36);
  });

  it('retourne un âge cohérent pour 1985', () => {
    const age = calculerAge('1985-01-01');
    expect(age).toBeGreaterThanOrEqual(39);
    expect(age).toBeLessThanOrEqual(41);
  });
});

describe('getTrancheAge', () => {
  it('retourne la tranche < 25 ans pour 24', () => {
    expect(getTrancheAge(24)).toBe('< 25 ans');
  });

  it('retourne la tranche 25-29 ans pour 27', () => {
    expect(getTrancheAge(27)).toBe('25-29 ans');
  });

  it('retourne la tranche 25-29 ans pour 25 (limite)', () => {
    expect(getTrancheAge(25)).toBe('25-29 ans');
  });

  it('retourne la tranche 55-59 ans pour 55', () => {
    expect(getTrancheAge(55)).toBe('55-59 ans');
  });

  it('retourne la tranche 60-64 ans pour 64', () => {
    expect(getTrancheAge(64)).toBe('60-64 ans');
  });

  it('retourne la tranche ≥ 65 ans pour 65 et 70', () => {
    expect(getTrancheAge(65)).toBe('≥ 65 ans');
    expect(getTrancheAge(70)).toBe('≥ 65 ans');
  });
});

describe('calculerETP', () => {
  const baseAgent: Agent = {
    id: '1',
    nom: 'Test',
    prenom: 'Agent',
    dateNaissance: '1990-01-01',
    genre: 'H',
    statut: 'Titulaire',
    contratType: 'Temps plein',
    region: 'Marseille',
    service: 'DDTM 13',
    mission: 'Mission test',
    metier: 'Métier test',
    niveauResponsabilite: 'Opérationnel',
    poste: 'Poste test',
    dateEmbauche: '2020-01-01',
    etp: 1,
    actif: true,
    dateMaj: '2025-01-01',
    enConges: false,
    enFormation: false,
    enArretMaladie: false
  };

  it('retourne 1 pour un agent temps plein', () => {
    expect(calculerETP({ ...baseAgent, contratType: 'Temps plein' })).toBe(1);
  });

  it('retourne 0.8 pour un temps partiel à 80%', () => {
    expect(
      calculerETP({
        ...baseAgent,
        contratType: 'Temps partiel',
        tempsPartielPourcentage: 80
      })
    ).toBe(0.8);
  });

  it('retourne etp si fourni quand temps partiel sans pourcentage', () => {
    expect(
      calculerETP({ ...baseAgent, contratType: 'Temps partiel', etp: 0.5 })
    ).toBe(0.5);
  });
});

describe('calculerRepartitionStatut', () => {
  it('calcule la répartition par statut avec effectifs et pourcentages', () => {
    const agents: Agent[] = [
      mockAgent({ id: '1', statut: 'Titulaire' }),
      mockAgent({ id: '2', statut: 'Titulaire' }),
      mockAgent({ id: '3', statut: 'CDD' })
    ];
    const result = calculerRepartitionStatut(agents);
    expect(result).toHaveLength(2);
    const titulaires = result.find((r) => r.statut === 'Titulaire');
    const cdd = result.find((r) => r.statut === 'CDD');
    expect(titulaires?.nombre).toBe(2);
    expect(titulaires?.pourcentage).toBeCloseTo(66.67, 1);
    expect(cdd?.nombre).toBe(1);
    expect(cdd?.pourcentage).toBeCloseTo(33.33, 1);
  });

  it('exclut les agents inactifs', () => {
    const agents: Agent[] = [
      mockAgent({ id: '1', statut: 'Titulaire', actif: true }),
      mockAgent({ id: '2', statut: 'Titulaire', actif: false })
    ];
    const result = calculerRepartitionStatut(agents);
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe(1);
  });
});

describe('calculerRepartitionContrat', () => {
  it('répartit par service : temps plein, temps partiel, CDD, stagiaires', () => {
    const agents: Agent[] = [
      mockAgent({ id: '1', service: 'S1', statut: 'Titulaire', contratType: 'Temps plein' }),
      mockAgent({ id: '2', service: 'S1', statut: 'CDD' }),
      mockAgent({ id: '3', service: 'S1', statut: 'Stagiaire' }),
      mockAgent({ id: '4', service: 'S2', statut: 'Titulaire', contratType: 'Temps partiel' })
    ];
    const result = calculerRepartitionContrat(agents);
    expect(result).toHaveLength(2);
    const s1 = result.find((r) => r.service === 'S1');
    const s2 = result.find((r) => r.service === 'S2');
    expect(s1?.tempsPlein).toBe(1);
    expect(s1?.cdd).toBe(1);
    expect(s1?.stagiaires).toBe(1);
    expect(s2?.tempsPartiel).toBe(1);
  });
});

describe('calculerOverviewStats', () => {
  it('calcule effectifs, postes pourvus/vacants et taux pourvu', () => {
    const agents: Agent[] = [
      mockAgent({ id: '1' }),
      mockAgent({ id: '2' }),
      mockAgent({ id: '3' })
    ];
    const capacitesTotal = 10;
    const result = calculerOverviewStats(agents, capacitesTotal);
    expect(result.effectifsTotaux).toBe(3);
    expect(result).toHaveProperty('ratioEncadrement');
    expect(result).toHaveProperty('etpTotal');
    expect(result).toHaveProperty('nbTempsPlein');
    expect(result).toHaveProperty('nbTempsPartiel');
  });

  it('calcule encadrants et opérationnels depuis niveauResponsabilite', () => {
    const agents: Agent[] = [
      mockAgent({ id: '1', niveauResponsabilite: 'Encadrement' }),
      mockAgent({ id: '2', niveauResponsabilite: 'Opérationnel' }),
      mockAgent({ id: '3', niveauResponsabilite: 'Direction' }),
    ];
    const result = calculerOverviewStats(agents, 0);
    expect(result.encadrantsTotal).toBe(2);
    expect(result.operationnelsTotal).toBe(1);
  });
});

describe('calculerStatsParService', () => {
  it('retourne effectif et statut (normal/fragile/critique) par service', () => {
    const agents: Agent[] = [
      mockAgent({ id: '1', service: 'Grand service' }),
      ...Array.from({ length: 25 }, (_, i) =>
        mockAgent({ id: `g${i}`, service: 'Grand service' })
      ),
      mockAgent({ id: 's1', service: 'Petit service' })
    ];
    const result = calculerStatsParService(agents);
    expect(result.length).toBeGreaterThanOrEqual(2);
    const grand = result.find((r) => r.name === 'Grand service');
    expect(grand?.effectif).toBe(26);
    expect(['normal', 'fragile', 'critique']).toContain(grand?.status);
  });
});

describe('calculerRepartitionGenre', () => {
  it('calcule hommes et femmes avec pourcentages', () => {
    const agents: Agent[] = [
      mockAgent({ id: '1', genre: 'H' }),
      mockAgent({ id: '2', genre: 'H' }),
      mockAgent({ id: '3', genre: 'F' })
    ];
    const result = calculerRepartitionGenre(agents);
    expect(result).toHaveLength(2);
    const hommes = result.find((r) => r.genre === 'Hommes');
    const femmes = result.find((r) => r.genre === 'Femmes');
    expect(hommes?.nombre).toBe(2);
    expect(femmes?.nombre).toBe(1);
    expect(hommes?.pourcentage).toBeCloseTo(66.67, 1);
  });
});

describe('calculerRepartitionResponsabilite', () => {
  it('calcule la répartition par niveau avec pourcentages', () => {
    const agents: Agent[] = [
      mockAgent({ id: '1', niveauResponsabilite: 'Opérationnel' }),
      mockAgent({ id: '2', niveauResponsabilite: 'Opérationnel' }),
      mockAgent({ id: '3', niveauResponsabilite: 'Encadrement' })
    ];
    const result = calculerRepartitionResponsabilite(agents);
    expect(result.length).toBe(2);
    const op = result.find((r) => r.niveau === 'Opérationnel');
    expect(op?.nombre).toBe(2);
    expect(op?.pourcentage).toBeCloseTo(66.67, 1);
  });
});

describe('calculerRepartitionAge', () => {
  it('répartit les agents par tranche d’âge avec genre', () => {
    const agents: Agent[] = [
      mockAgent({ id: '1', dateNaissance: '2001-06-15', genre: 'H' }),
      mockAgent({ id: '2', dateNaissance: '1995-01-01', genre: 'F' })
    ];
    const result = calculerRepartitionAge(agents);
    expect(result.length).toBe(10);
    const tranchesAvecEffectif = result.filter((r) => r.effectif > 0);
    expect(tranchesAvecEffectif.length).toBeGreaterThanOrEqual(2);
    const totalEffectif = result.reduce((sum, r) => sum + r.effectif, 0);
    expect(totalEffectif).toBe(2);
  });
});
