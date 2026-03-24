/**
 * Annexe 11 — Tests unitaires dataService (fichier original : src/services/dataService.test.ts)
 * 12 tests : filtres (région, service DIRM Méditerranée, statut, mission), normalisation, chargement.
 */

import { describe, it, expect } from 'vitest';
import {
  filterAgentsFrom,
  DIRM_MEDITERANEE_LABEL,
  normalizeAgents,
  loadAgentsDataFrom
} from './dataService';
import type { Agent, StatDirmData } from '../types/data';

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
    enArretMaladie: false,
    ...overrides
  };
}

describe('filterAgentsFrom', () => {
  const agents: Agent[] = [
    mockAgent({ id: '1', region: 'Marseille', service: 'DDTM 13' }),
    mockAgent({ id: '2', region: 'Nice', service: 'DDTM 06' }),
    mockAgent({ id: '3', region: 'Toulon', service: 'DDTM 83' }),
    mockAgent({ id: '4', region: 'Sète', service: 'DDTM 34' }),
    mockAgent({ id: '5', region: 'Paris', service: 'DIRM BNEM' })
  ];

  it('filtre par région', () => {
    const result = filterAgentsFrom(agents, { region: 'Marseille' });
    expect(result).toHaveLength(1);
    expect(result[0].region).toBe('Marseille');
  });

  it('filtre par service DIRM Méditerranée (régions Marseille, Nice, Toulon, Sète)', () => {
    const result = filterAgentsFrom(agents, { service: DIRM_MEDITERANEE_LABEL });
    expect(result).toHaveLength(4);
    const regions = result.map((a) => a.region).sort();
    expect(regions).toEqual(['Marseille', 'Nice', 'Sète', 'Toulon']);
  });

  it('filtre par service classique', () => {
    const result = filterAgentsFrom(agents, { service: 'DDTM 06' });
    expect(result).toHaveLength(1);
    expect(result[0].service).toBe('DDTM 06');
    expect(result[0].region).toBe('Nice');
  });

  it('sans filtre retourne tous les agents', () => {
    const result = filterAgentsFrom(agents, {});
    expect(result).toHaveLength(5);
  });

  it('filtre "all" pour région ne filtre pas', () => {
    const result = filterAgentsFrom(agents, { region: 'all' });
    expect(result).toHaveLength(5);
  });

  it('filtre par statut', () => {
    const agentsWithStatut = [
      mockAgent({ id: '1', statut: 'Titulaire' }),
      mockAgent({ id: '2', statut: 'CDD' }),
      mockAgent({ id: '3', statut: 'Titulaire' })
    ];
    const result = filterAgentsFrom(agentsWithStatut, { statut: 'Titulaire' });
    expect(result).toHaveLength(2);
    expect(result.every((a) => a.statut === 'Titulaire')).toBe(true);
  });

  it('filtre par mission', () => {
    const agentsWithMission = [
      mockAgent({ id: '1', mission: 'Sauvetage en mer' }),
      mockAgent({ id: '2', mission: 'Police des pêches' }),
      mockAgent({ id: '3', mission: 'Sauvetage en mer' })
    ];
    const result = filterAgentsFrom(agentsWithMission, { mission: 'Sauvetage en mer' });
    expect(result).toHaveLength(2);
    expect(result.every((a) => a.mission === 'Sauvetage en mer')).toBe(true);
  });

  it('filtre "all" pour mission ne filtre pas', () => {
    const agentsWithMission = [
      mockAgent({ id: '1', mission: 'M1' }),
      mockAgent({ id: '2', mission: 'M2' })
    ];
    const result = filterAgentsFrom(agentsWithMission, { mission: 'all' });
    expect(result).toHaveLength(2);
  });
});

describe('normalizeAgents', () => {
  it('mappe la région depuis le code service (ex. DDTM 13 → Marseille)', () => {
    const agents: Agent[] = [
      mockAgent({ id: '1', service: 'DDTM 13', region: 'Inconnu' })
    ];
    const result = normalizeAgents(agents);
    expect(result).toHaveLength(1);
    expect(result[0].region).toBe('Marseille');
  });

  it('mappe le service vers le nom normalisé (ex. DDTM 13 → Surveillance et contrôle)', () => {
    const agents: Agent[] = [
      mockAgent({ id: '1', service: 'DDTM 13' })
    ];
    const result = normalizeAgents(agents);
    expect(result[0].service).toBe('Surveillance et contrôle');
  });

  it('conserve les agents sans mapping inchangés pour les champs non mappés', () => {
    const agents: Agent[] = [
      mockAgent({ id: '1', service: 'Service inconnu', region: 'Paris' })
    ];
    const result = normalizeAgents(agents);
    expect(result).toHaveLength(1);
    expect(result[0].region).toBe('Paris');
    expect(result[0].service).toBe('Service inconnu');
  });
});

describe('loadAgentsDataFrom', () => {
  it('charge et normalise les agents depuis un StatDirmData', () => {
    const data: StatDirmData = {
      agents: [
        mockAgent({ id: '1', service: 'DDTM 06', region: '?' })
      ],
      capacites: { missions: [], regions: [] }
    };
    const result = loadAgentsDataFrom(data);
    expect(result).toHaveLength(1);
    expect(result[0].region).toBe('Nice');
    expect(result[0].service).toBe('Opérations maritimes');
  });
});
