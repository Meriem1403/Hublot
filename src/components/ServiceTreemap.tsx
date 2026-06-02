import { useMemo } from 'react';
import { useAgentsData } from '../hooks/useAgentsData';
import { MethodologyDialog } from './MethodologyDialog';

// --- Paramètres de calibrage du calcul "métiers en tension" ---
// Effectif minimum d'un service pour que le calcul ait du sens (sinon « n/a »).
const MIN_SERVICE_EFFECTIF = 10;
// Un intitulé n'est considéré comme un "métier" que s'il est représenté au moins
// ce nombre de fois dans l'ensemble de la DIRMMED. En-dessous, c'est un poste
// spécifique/unique (direction, expertise...) et non un métier en tension.
// Valeur calibrée : <5 réintroduit du bruit, >5 ne change quasiment plus rien.
const MIN_METIER_RECURRENCE = 5;
// Un métier est "en tension" si son effectif <= max(plancher, ratio x moyenne
// des effectifs par métier du service).
const TENSION_RATIO = 0.3;
const TENSION_FLOOR = 3;

// Normalisation d'un libellé métier : minuscules, sans accents ni ponctuation,
// pour fusionner les variantes d'orthographe ("Chargé d'enseignement" vs
// "Charge d enseignement").
function normalizeMetier(value: string | null | undefined): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "'")
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Traduction des codes de grade MG_MTES en intitulés lisibles.
// Correspondance établie en croisant le code MG14 avec le libellé « Grade NNE »
// de l'export RenoiRH (ex. BTEC -> TECH.SUP.CH.DEV.DUR.).
const GRADE_LABELS: Record<string, string> = {
  BTEC: 'Technicien supérieur (dév. durable)',
  BADM: 'Secrétaire administratif',
  CADM: 'Adjoint administratif',
  AADM: "Attaché d'administration",
  ATEC: 'Ingénieur des TPE',
  OPAB: 'Ouvrier des parcs et ateliers (B)',
  OPAA: 'Ouvrier des parcs et ateliers (A)',
  OPAC: 'Ouvrier des parcs et ateliers (C)',
  CEXP: "Personnel d'exploitation (TPE)",
  CTEC: 'Adjoint technique',
  'A+ADM': 'Encadrement supérieur administratif',
  'A+TEC': 'Ingénieur Ponts, Eaux et Forêts (IPEF)'
};

// Rend un libellé métier lisible : traduit les codes de grade connus, sinon
// renvoie l'intitulé d'origine (qui est déjà en clair).
function prettyMetier(label: string | null | undefined): string {
  const raw = (label || '').trim();
  return GRADE_LABELS[raw.toUpperCase()] || raw || 'Non défini';
}

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
        available: boolean;
        count: number;
        items: Array<{ metier: string; effectif: number }>;
      };
    };

    const actifs = agents.filter((a) => a.actif);

    // Fréquence globale (toute la DIRMMED) de chaque métier normalisé : sert à
    // écarter les postes quasi uniques qui faussaient le calcul.
    const globalMetierCount = new Map<string, number>();
    actifs.forEach((a) => {
      const key = normalizeMetier(a.metier);
      if (!key || key === 'non defini') return;
      globalMetierCount.set(key, (globalMetierCount.get(key) || 0) + 1);
    });

    const map = new Map<string, ServiceAgg>();

    actifs.forEach((a) => {
      const name = (a.service || '').trim();
      if (!name) return;
      const prev = map.get(name) || {
        effectif: 0,
        etpTotal: 0,
        nbTempsPlein: 0,
        nbTempsPartiel: 0,
        metiersEnTension: { available: false, count: 0, items: [] }
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
      // Calcul non pertinent pour les très petits services.
      if (agg.effectif < MIN_SERVICE_EFFECTIF) {
        return { name, ...agg, metiersEnTension: { available: false, count: 0, items: [] } };
      }

      // Comptage par métier dans le service, en ne retenant que les vrais métiers
      // (récurrents dans la DIRMMED) et en fusionnant les variantes d'orthographe.
      const metMap = new Map<string, { effectif: number; label: string }>();
      actifs
        .filter((a) => (a.service || '').trim() === name)
        .forEach((a) => {
          const key = normalizeMetier(a.metier);
          if (!key || key === 'non defini') return;
          if ((globalMetierCount.get(key) || 0) < MIN_METIER_RECURRENCE) return;
          const prev = metMap.get(key);
          const label = (a.metier || '').trim();
          metMap.set(key, {
            effectif: (prev?.effectif || 0) + 1,
            label: prev?.label || label
          });
        });

      const entries = Array.from(metMap.values());

      if (entries.length === 0) {
        return { name, ...agg, metiersEnTension: { available: true, count: 0, items: [] } };
      }

      const totalMetiersEffectifs = entries.reduce((sum, e) => sum + e.effectif, 0);
      const moyenneParMetier = totalMetiersEffectifs / entries.length;

      // Règle explicable et vérifiable :
      // un métier est "en tension" s'il est <= ratio x moyenne des effectifs par
      // métier du service, avec un plancher pour éviter un bruit trop important.
      const seuilTension = Math.max(TENSION_FLOOR, moyenneParMetier * TENSION_RATIO);

      const metiersTension = entries
        .filter((e) => e.effectif <= seuilTension)
        .sort((a, b) => a.effectif - b.effectif);

      return {
        name,
        ...agg,
        metiersEnTension: {
          available: true,
          count: metiersTension.length,
          items: metiersTension
            .slice(0, 3)
            .map((e) => ({ metier: prettyMetier(e.label), effectif: e.effectif }))
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
                'TP = agents à temps plein (`contratType = Temps plein`) ; TPP = agents à temps partiel (`contratType = Temps partiel`).',
                'Métiers retenus : on ne garde que les intitulés représentés au moins 5 fois dans toute la DIRMMED (les variantes d’orthographe/casse sont fusionnées). Un poste quasi unique (direction, expertise…) est un poste spécifique, pas un métier suivi : il est écarté pour éviter le bruit.',
                'Calcul réservé aux services d’au moins 10 agents (sinon affiché « n/a », non significatif).',
                'Métiers à faible effectif (dans un service) : sur les métiers retenus, on calcule la moyenne des effectifs par métier du service, puis le seuil = max(3, 30% de cette moyenne).',
                'Un métier est classé “à faible effectif” si son effectif est <= ce seuil. Exemple : moyenne = 10 => seuil = max(3, 3) = 3 ; tous les métiers retenus avec <= 3 agents sont signalés. Lecture : il s’agit d’un risque de fragilité (compétence tenue par peu d’agents), pas d’une difficulté de recrutement.'
              ]
            }
          ]}
        />
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <div className="font-semibold mb-1">Comment lire ces cartes</div>
        <ul className="space-y-1 text-blue-900/90">
          <li><span className="font-semibold">Effectif (actifs)</span> : nombre d’agents en poste dans le service.</li>
          <li><span className="font-semibold">ETP total</span> : « équivalent temps plein » — total des quotités de travail (un mi-temps compte 0,5).</li>
          <li><span className="font-semibold">TP / TPP</span> : agents à <span className="font-semibold">temps plein</span> / à <span className="font-semibold">temps partiel</span>.</li>
          <li>
            <span className="font-semibold">Métiers à faible effectif</span> : familles de métiers tenues par très peu d’agents dans le service.
            Indicateur de <span className="font-semibold">fragilité</span> (perte de compétence si un départ), pas une difficulté de recrutement.
          </li>
          <li><span className="font-semibold">n/a</span> : service trop petit (&lt; {MIN_SERVICE_EFFECTIF} agents) pour un calcul fiable.</li>
        </ul>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
          {services.map((service, index) => {
            const pct = total > 0 ? (service.effectif / total) * 100 : 0;
            const tensionAvailable = service.metiersEnTension.available;
            const tensionCount = service.metiersEnTension.count;

            const accent =
              !tensionAvailable || tensionCount === 0
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
                        {!tensionAvailable ? 'n/a' : tensionCount === 0 ? 'OK' : `Faible effectif : ${tensionCount}`}
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
                        Métiers à faible effectif : {!tensionAvailable ? 'n/a' : service.metiersEnTension.count}
                        <span className="block text-[11px] text-current/70 font-normal">
                          {tensionAvailable
                            ? 'tenus par très peu d’agents (max 3 affichés)'
                            : 'service trop petit pour ce calcul'}
                        </span>
                      </summary>
                      <div className={`mt-2 ${accent.detailsBg} ${accent.detailsBorder} rounded-lg p-2 border ${accent.detailsText}`}>
                        {!tensionAvailable ? (
                          <div className={`text-xs ${accent.emptyText}`}>
                            Effectif trop faible (&lt; {MIN_SERVICE_EFFECTIF}) pour un calcul fiable.
                          </div>
                        ) : service.metiersEnTension.count > 0 ? (
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
                            Aucun métier à faible effectif : les métiers sont bien dotés.
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

