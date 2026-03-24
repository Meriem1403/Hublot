/**
 * Contexte de données agents : charge /data/agents.json à l'exécution si disponible.
 * Permet d'afficher les vraies données sur Netlify en plaçant le fichier dans public/data/agents.json.
 */

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { fallbackData, loadAgentsDataFrom, loadCapacitesFrom } from '../services/dataService';
import type { Agent, StatDirmData } from '../types/data';

const DATA_URL = import.meta.env.VITE_APP_DATA_URL || '/data/agents.json';

type AgentsDataContextValue = {
  data: StatDirmData;
  loading: boolean;
  error: Error | null;
  agents: Agent[];
  capacites: StatDirmData['capacites'];
};

const AgentsDataContext = createContext<AgentsDataContextValue | null>(null);

export function AgentsDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StatDirmData>(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = `${DATA_URL}${DATA_URL.includes('?') ? '&' : '?'}t=${Date.now()}`;
    fetch(url, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: unknown) => {
        if (cancelled) return;
        if (!json || typeof json !== 'object') return;

        // Format standard : { agents: [...] }
        if ('agents' in json && Array.isArray((json as StatDirmData).agents)) {
          setData(json as StatDirmData);
          return;
        }

        // Format historique : { historique: [{ agents, metadonnees }, ...] }
        if ('historique' in json && Array.isArray((json as StatDirmData).historique)) {
          const h = (json as StatDirmData).historique || [];
          const last = h.length > 0 ? h[h.length - 1] : undefined;
          if (last && Array.isArray(last.agents)) {
            setData({
              ...(json as StatDirmData),
              agents: last.agents
            });
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setData(fallbackData);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AgentsDataContextValue>(() => ({
    data,
    loading,
    error,
    agents: loadAgentsDataFrom(data),
    capacites: loadCapacitesFrom(data)
  }), [data, loading, error]);

  return (
    <AgentsDataContext.Provider value={value}>
      {children}
    </AgentsDataContext.Provider>
  );
}

export function useAgentsDataContext(): AgentsDataContextValue {
  const ctx = useContext(AgentsDataContext);
  if (!ctx) {
    throw new Error('useAgentsDataContext must be used within AgentsDataProvider');
  }
  return ctx;
}

/** Retourne le contexte s'il existe (pour fallback sync en dehors du provider). */
export function useAgentsDataContextOptional(): AgentsDataContextValue | null {
  return useContext(AgentsDataContext);
}
