/**
 * Filtres globaux (Région, Service dont DIRM Méditerranée, Statut) appliqués à tous les onglets.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type GlobalFilters = {
  region: string;
  service: string;
  unite: string;
  statut: string;
  pasa: string;
  corps: string;
  fonction: string;
};

const defaultFilters: GlobalFilters = {
  region: 'all',
  service: 'all',
  unite: 'all',
  statut: 'all',
  pasa: 'all',
  corps: 'all',
  fonction: 'all'
};

type GlobalFilterContextValue = {
  filters: GlobalFilters;
  setRegion: (v: string) => void;
  setService: (v: string) => void;
  setUnite: (v: string) => void;
  setStatut: (v: string) => void;
  setPasa: (v: string) => void;
  setCorps: (v: string) => void;
  setFonction: (v: string) => void;
  resetFilters: () => void;
};

const GlobalFilterContext = createContext<GlobalFilterContextValue | null>(null);

export function GlobalFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<GlobalFilters>(defaultFilters);

  const setRegion = useCallback((v: string) => {
    setFilters((prev) => ({ ...prev, region: v }));
  }, []);
  const setService = useCallback((v: string) => {
    // Les unités dépendent du service : on réinitialise l'unité quand le service change.
    setFilters((prev) => ({ ...prev, service: v, unite: 'all' }));
  }, []);
  const setUnite = useCallback((v: string) => {
    setFilters((prev) => ({ ...prev, unite: v }));
  }, []);
  const setStatut = useCallback((v: string) => {
    setFilters((prev) => ({ ...prev, statut: v }));
  }, []);
  const setPasa = useCallback((v: string) => {
    setFilters((prev) => ({ ...prev, pasa: v }));
  }, []);
  const setCorps = useCallback((v: string) => {
    setFilters((prev) => ({ ...prev, corps: v }));
  }, []);
  const setFonction = useCallback((v: string) => {
    setFilters((prev) => ({ ...prev, fonction: v }));
  }, []);
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const value: GlobalFilterContextValue = {
    filters,
    setRegion,
    setService,
    setUnite,
    setStatut,
    setPasa,
    setCorps,
    setFonction,
    resetFilters
  };

  return (
    <GlobalFilterContext.Provider value={value}>
      {children}
    </GlobalFilterContext.Provider>
  );
}

export function useGlobalFilterContext(): GlobalFilterContextValue | null {
  return useContext(GlobalFilterContext);
}
