import { useMemo } from 'react';
import { useAgentsData } from '../hooks/useAgentsData';
import { MethodologyDialog } from './MethodologyDialog';

export function ServiceTreemap() {
  const agents = useAgentsData();

  // Données strictement Excel : effectif réel par service (agents actifs).
  const services = useMemo(() => {
    type ServiceAgg = {
      effectif: number;
      etpTotal: number;
      nbTempsPlein: number;
      nbTempsPartiel: number;
      metiersEnTension: {
        count: number;
        items: Array<{ metier: string; effectif: number }>;
      };
    };

    const map = new Map<string, ServiceAgg>();

    agents
      .filter((a) => a.actif)
      .forEach((a) => {
        const name = (a.service || '').trim();
        if (!name) return;
        const prev = map.get(name) || {
          effectif: 0,
          etpTotal: 0,
          nbTempsPlein: 0,
          nbTempsPartiel: 0,
          metiersEnTension: { count: 0, items: [] }
        };
        const etp = typeof a.etp === 'number' ? a.etp : 0;
        prev.effectif += 1;
        prev.etpTotal += etp;
        if (a.contratType === 'Temps plein') prev.nbTempsPlein += 1;
        if (a.contratType === 'Temps partiel') prev.nbTempsPartiel += 1;
        map.set(name, prev);
      });

    // Pour chaque service, calculer les métiers peu représentés ("en tension")
    const result = Array.from(map.entries()).map(([name, agg]) => {
      const metMap = new Map<string, number>();
      agents
        .filter((a) => a.actif && (a.service || '').trim() === name)
        .forEach((a) => {
          const metier = (a.metier || '').trim() || 'Non défini';
          metMap.set(metier, (metMap.get(metier) || 0) + 1);
        });

      const entries = Array.from(metMap.entries()).map(([metier, effectif]) => ({
        metier,
        effectif
      }));

      if (entries.length === 0) {
        return { name, ...agg, metiersEnTension: { count: 0, items: [] } };
      }

      const totalMetiersEffectifs = entries.reduce((sum, e) => sum + e.effectif, 0);
      const moyenneParMetier = totalMetiersEffectifs / entries.length;

      // Règle explicable et vérifiable :
      // un métier est "en tension" s'il est <= 30% de la moyenne des effectifs par métier du service
      // avec un plancher à 3 agents pour éviter un bruit trop important.
      const seuilTension = Math.max(3, moyenneParMetier * 0.3);

      const metiersTension = entries
        .filter((e) => e.effectif <= seuilTension)
        .sort((a, b) => a.effectif - b.effectif)
        .slice(0, 3);

      return {
        name,
        ...agg,
        metiersEnTension: {
          count: entries.filter((e) => e.effectif <= seuilTension).length,
          items: metiersTension
        }
      };
    });

    return result.sort((a, b) => b.effectif - a.effectif);
  }, [agents]);

  const total = services.reduce((sum, s) => sum + s.effectif, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl mb-2">Effectifs par service</h2>
          <p className="text-gray-600">
            Vue d'ensemble des effectifs réels par service
          </p>
        </div>

        <MethodologyDialog
          title="Méthodologie — Effectifs par service"
          intro="Mesure des effectifs réels par service après filtres."
          sections={[
            {
              title: 'Sources',
              bullets: [
                'Service agent (Excel) : champ `service`.',
                'Champ `actif` (Excel) : on compte uniquement les agents en poste.',
                'Champ `Temps de travail` (Excel) : alimente `agent.etp` et `agent.contratType`.',
              ]
            },
            {
              title: 'Calculs affichés',
              bullets: [
                'Effectif service = nombre d’agents actifs dont `service` correspond.',
                'Pourcentage service = effectif service / total effectif filtré x 100.',
                'TP = agents avec `contratType = Temps plein` ; TPP = agents avec `contratType = Temps partiel`.',
                'Métiers en tension (dans un service) : on compte les effectifs par métier, on calcule la moyenne des effectifs métiers du service, puis le seuil = max(3, 30% de cette moyenne).',
                'Un métier est classé “en tension” si son effectif est <= ce seuil. Exemple : moyenne = 10 => seuil = max(3, 3) = 3 ; tous les métiers avec <= 3 agents sont en tension.'
              ]
            }
          ]}
        />
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
          {services.map((service, index) => {
            const pct = total > 0 ? (service.effectif / total) * 100 : 0;
            const tensionCount = service.metiersEnTension.count;

            const accent =
              tensionCount === 0
                ? {
                    border: 'border-blue-200',
                    stripColor: '#3b82f6',
                    cardFrom: '#3b82f6',
                    cardTo: '#2563eb',
                    detailsBg: 'bg-blue-600/15',
                    detailsBorder: 'border-blue-200/35',
                    detailsText: 'text-white',
                    pillBg: 'bg-white/20',
                    pillText: 'text-white',
                    pillBorder: 'border-blue-200',
                    metaValue: 'text-white'
                    ,
                    emptyText: 'text-white/80'
                  }
                : tensionCount <= 2
                  ? {
                      border: 'border-amber-200',
                      stripColor: '#f59e0b',
                      cardFrom: '#f59e0b',
                      cardTo: '#d97706',
                      detailsBg: 'bg-amber-500/15',
                      detailsBorder: 'border-amber-200/35',
                      detailsText: 'text-white',
                      pillBg: 'bg-white/20',
                      pillText: 'text-white',
                      pillBorder: 'border-amber-200',
                      metaValue: 'text-white',
                      emptyText: 'text-white/80'
                    }
                  : {
                      border: 'border-red-200',
                      stripColor: '#ef4444',
                      cardFrom: '#ef4444',
                      cardTo: '#dc2626',
                      detailsBg: 'bg-red-600/15',
                      detailsBorder: 'border-red-200/35',
                      detailsText: 'text-white',
                      pillBg: 'bg-white/20',
                      pillText: 'text-white',
                      pillBorder: 'border-red-200',
                      metaValue: 'text-white',
                      emptyText: 'text-white/80'
                    };

            return (
              <div
                key={service.name}
                className={`relative rounded-xl p-4 border ${accent.border} shadow-sm hover:shadow-md transition-shadow text-white`}
                style={{
                  minHeight: index < 4 ? 175 : 125,
                  background: `linear-gradient(135deg, ${accent.cardFrom}, ${accent.cardTo})`
                }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                  style={{ backgroundColor: accent.stripColor }}
                />
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold break-words text-white">{service.name}</h3>
                    <div className="mt-1">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${accent.pillBorder} ${accent.pillBg} ${accent.pillText}`}>
                        {tensionCount === 0 ? 'OK' : `En tension: ${tensionCount}`}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-white/90 whitespace-nowrap">{Math.round(pct)}% du total</div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <div className="text-white/85 text-xs">Effectif (actifs)</div>
                      <div className={`text-3xl font-bold leading-none ${accent.metaValue}`}>
                        {service.effectif.toLocaleString('fr-FR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/85 text-xs">ETP total</div>
                      <div className={`text-base font-semibold ${accent.metaValue}`}>
                        {service.etpTotal.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-white/95">
                    TP: <span className="font-semibold">{service.nbTempsPlein}</span> • TPP: <span className="font-semibold">{service.nbTempsPartiel}</span>
                  </div>

                  <div className="mt-2">
                    <details className="group">
                      <summary className={`cursor-pointer list-none text-sm font-semibold ${accent.detailsText}`}>
                        Métiers en tension: {service.metiersEnTension.count}
                        <span className="text-current/70 font-normal">
                          {" "}
                          (max 3 affichés)
                        </span>
                      </summary>
                      <div className={`mt-2 ${accent.detailsBg} ${accent.detailsBorder} rounded-lg p-2 border ${accent.detailsText}`}>
                        {service.metiersEnTension.count > 0 ? (
                          <div className="space-y-1.5">
                            {service.metiersEnTension.items.map((it) => (
                              <div key={it.metier} className="flex items-center justify-between gap-3">
                                <span className="text-xs text-white/95 truncate">{it.metier}</span>
                                <span className="text-xs font-semibold text-white whitespace-nowrap">
                                  {it.effectif}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                              <div className={`text-xs ${accent.emptyText}`}>
                            Aucun métier en tension selon le comptage Excel.
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            );
          })}

          {services.length === 0 && (
            <div className="col-span-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-4">
              Aucun agent actif pour les filtres actuels.
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 text-sm text-gray-700">
          <div>
            Total effectifs : <span className="font-semibold">{total.toLocaleString('fr-FR')}</span> agents
          </div>
          <div>
            Services affichés : <span className="font-semibold">{services.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

