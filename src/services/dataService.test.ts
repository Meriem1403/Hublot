import { describe, it, expect } from 'vitest';
import { filterAgentsFrom, DIRM_MEDITERANEE_LABEL } from './dataService';
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
});
