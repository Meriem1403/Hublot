import { useEffect, useState } from 'react';
import type { PasaEffectifsData } from '../types/pasaEffectifs';

let cache: PasaEffectifsData | null = null;

export function usePasaEffectifsData(): {
  data: PasaEffectifsData | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<PasaEffectifsData | null>(cache);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache) return;

    let cancelled = false;

    fetch('/data/pasa-effectifs.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<PasaEffectifsData>;
      })
      .then((json) => {
        if (cancelled) return;
        cache = json;
        setData(json);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setData(null);
        setError(err instanceof Error ? err.message : 'Impossible de charger les données PASA.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
