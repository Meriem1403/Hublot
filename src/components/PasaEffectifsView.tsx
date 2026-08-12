import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { usePasaEffectifsData } from '../hooks/usePasaEffectifsData';
import type { PasaActionEffectifs, PasaEffectifsData } from '../types/pasaEffectifs';
import { MethodologyDialog } from './MethodologyDialog';

const PALETTE = ['#1d4ed8', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#64748b'];
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#64748b'];

type Metric = 'effectif' | 'etpt';

function pct(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
}

function exportCsv(action: PasaActionEffectifs) {
  const lines = ['PASA;Catégorie;Service;Poste;Effectif;ETPT'];
  action.categories.forEach((cat) => {
    if (cat.detailsParPoste?.length) {
      cat.detailsParPoste.forEach((row) => {
        lines.push(
          [
            `"${action.code}"`,
            `"${cat.label}"`,
            `"${row.service}"`,
            `"${row.poste.replace(/"/g, '""')}"`,
            row.effectif,
            row.etpt.toFixed(2),
          ].join(';')
        );
      });
    } else {
      cat.detailsParService.forEach((row) => {
        lines.push(
          [`"${action.code}"`, `"${cat.label}"`, `"${row.service}"`, '""', row.effectif, row.etpt.toFixed(2)].join(';')
        );
      });
    }
  });
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `effectifs-pasa-${action.id}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function methodologySections(data: PasaEffectifsData) {
  return [
    {
      title: 'Source',
      bullets: [
        `Fichier : ${data.metadonnees.source}`,
        `Feuille : ${data.metadonnees.feuille}`,
        `Mois de référence : ${data.metadonnees.moisReference ?? 'non déterminé'}`,
        'Données indépendantes de agents.json.',
      ],
    },
    {
      title: 'PASA 2 — Emplois et formations maritimes',
      bullets: [
        'LPM : repérage « LPM » dans Niveau 06 ou 08.',
        'SSGM : repérage « SSGM » dans Niveau 06 ou 08.',
        'Services formation : structures DIRM (hors LPM/SSGM).',
        'Services instructions : structures DDTM / DML + mots-clés « activités maritimes », « instruction ».',
        'Gens de mer AC : agents DGAMPA.',
      ],
    },
    {
      title: 'PASA 3 — Flotte de commerce et sécurité des navires',
      bullets: [
        'Flotte de commerce AC : Niveau 08 commençant par SFM/MFC (MFC, MFC1, MFC2, MFC/GURIF…).',
        'Sécurité maritime AC : Niveau 08 commençant par SFM/STEN (STEN, STEN1, STEN2, STEN3…).',
        'Autres : tous les autres agents.',
      ],
    },
    {
      title: 'PASA 4 — Contrôle des activités en mer',
      bullets: ['Administration centrale : agents DGAMPA.', 'Autres : tous les autres agents.'],
    },
    {
      title: 'PASA 5 — Soutien',
      bullets: ['Tous les agents sans sous-catégorisation.'],
    },
    {
      title: 'PASA 8 — Planification et plaisance',
      bullets: [
        'Plaisance AC : Niveau 08 = SEML/MNP, MNP1, MNP2.',
        'Planification AC : Niveau 08 = SEML/PM, PM1, PM2.',
        'Planification : DIRM + mots-clés (DPM, économie bleue, SDDM, litt., maritimes…).',
        'Plaisance : DDTM / DML + mots-clés (plaisance, protection sociale, marin, gens…).',
      ],
    },
    {
      title: 'PASA 7 — Pêche et aquaculture',
      bullets: [
        'Administration centrale : tous les agents DGAMPA (priorité absolue).',
        'Pêche : mots-clés territoriaux (réglementation, FEAMP, filières, captures…).',
        'Aquaculture : mots-clés territoriaux (conchylicole, cult. marines, technicien…).',
      ],
    },
    {
      title: 'Règle générale — Administration centrale',
      bullets: [
        'Les agents DGAMPA sont toujours classés en administration centrale, avant tout autre critère (mots-clés, structure…).',
      ],
    },
    {
      title: 'PASA 11, 13, 16 — CROSS, Phares & Balises, Capitaineries',
      bullets: [
        'Administration centrale : agents DGAMPA.',
        'Autres : tous les autres agents.',
      ],
    },
    {
      title: 'Calculs',
      bullets: [
        'Effectif = matricules distincts avec ETPT > 0.',
        'ETPT = somme ETPT RH des lignes retenues.',
      ],
    },
  ];
}

function PasaActionPanel({
  action,
  metric,
}: {
  action: PasaActionEffectifs;
  metric: Metric;
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    () => action.categories.find((c) => c.effectif > 0)?.id ?? action.categories[0]?.id ?? ''
  );
  const [detailView, setDetailView] = useState<'service' | 'poste'>('service');
  const [posteSearch, setPosteSearch] = useState('');

  useEffect(() => {
    if (selectedCategoryId === 'autres') {
      setDetailView('poste');
    }
    setPosteSearch('');
  }, [selectedCategoryId]);

  const activeCategories = useMemo(
    () => action.categories.filter((c) => c.effectif > 0 || c.etpt > 0),
    [action.categories]
  );

  const selectedCategory =
    action.categories.find((c) => c.id === selectedCategoryId) ?? activeCategories[0];

  const filteredPostes = useMemo(() => {
    const rows = selectedCategory?.detailsParPoste ?? [];
    const q = posteSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) => row.poste.toLowerCase().includes(q) || row.service.toLowerCase().includes(q)
    );
  }, [selectedCategory, posteSearch]);

  const filteredPostesTotals = useMemo(
    () =>
      filteredPostes.reduce(
        (acc, row) => ({
          effectif: acc.effectif + row.effectif,
          etpt: acc.etpt + row.etpt,
        }),
        { effectif: 0, etpt: 0 }
      ),
    [filteredPostes]
  );

  const total = metric === 'effectif' ? action.totalEffectif : action.totalEtpt;
  const dataKey = metric;

  const chartData = useMemo(
    () =>
      activeCategories.map((c) => ({
        label: c.label.replace(/\([^)]*\)/g, '').trim(),
        effectif: c.effectif,
        etpt: c.etpt,
        id: c.id,
      })),
    [activeCategories]
  );

  const pieData = useMemo(
    () =>
      activeCategories.map((c) => ({
        name: c.label.replace(/\([^)]*\)/g, '').trim(),
        value: metric === 'effectif' ? c.effectif : c.etpt,
        effectif: c.effectif,
        etpt: c.etpt,
      })),
    [activeCategories, metric]
  );

  const gradientCards = [
    { label: 'Effectif total', value: action.totalEffectif, sub: 'agents', from: 'from-blue-500', to: 'to-blue-600', text: 'text-blue-100' },
    { label: 'ETPT total', value: action.totalEtpt.toFixed(1), sub: 'équivalents temps plein', from: 'from-green-500', to: 'to-green-600', text: 'text-green-100' },
    {
      label: 'Catégories actives',
      value: activeCategories.length,
      sub: `sur ${action.categories.length}`,
      from: 'from-purple-500',
      to: 'to-purple-600',
      text: 'text-purple-100',
    },
    {
      label: selectedCategory?.label.split('(')[0].trim() ?? 'Sélection',
      value: selectedCategory ? (metric === 'effectif' ? selectedCategory.effectif : selectedCategory.etpt.toFixed(1)) : '—',
      sub: selectedCategory ? `${pct(metric === 'effectif' ? selectedCategory.effectif : selectedCategory.etpt, total)}% du total` : '',
      from: 'from-orange-500',
      to: 'to-orange-600',
      text: 'text-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {gradientCards.map((card) => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.from} ${card.to} rounded-xl p-6 text-white shadow-lg`}
          >
            <p className={`${card.text} mb-2 text-sm`}>{card.label}</p>
            <p className="text-4xl mb-2 tabular-nums">{card.value}</p>
            <p className={`text-sm ${card.text}`}>{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {action.categories.map((cat, idx) => {
          const val = metric === 'effectif' ? cat.effectif : cat.etpt;
          return (
            <div
              key={cat.id}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-200"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="block w-4 h-4 min-w-4 rounded-full flex-none ring-2 ring-white shadow"
                  style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate" title={cat.label}>
                    {cat.label}
                  </p>
                  <p className="text-xs text-gray-600 tabular-nums">
                    {cat.effectif} ag. · {cat.etpt.toFixed(1)} ETPT
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-900 tabular-nums shrink-0 ml-2">
                {metric === 'etpt' ? val.toFixed(1) : val}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="mb-4">Répartition par catégorie</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as (typeof pieData)[number];
                      return (
                        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                          <p className="mb-1 font-semibold">{d.name}</p>
                          <p className="text-blue-600 font-bold">
                            {metric === 'effectif' ? d.effectif : d.etpt.toFixed(1)}{' '}
                            {metric === 'effectif' ? 'agents' : 'ETPT'}
                          </p>
                          <p className="text-gray-600 text-sm">
                            {d.effectif} ag. · {d.etpt.toFixed(1)} ETPT
                          </p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                {pieData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded flex-shrink-0"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-600 tabular-nums">
                        {metric === 'effectif' ? item.value : item.etpt.toFixed(1)} (
                        {pct(item.value, total)}%)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 py-12 text-center">Aucune donnée.</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="mb-4">Comparaison par catégorie</h3>
          <ResponsiveContainer width="100%" height={Math.max(350, chartData.length * 44)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 11 }} interval={0} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as (typeof chartData)[number];
                  return (
                    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[200px]">
                      <p className="mb-2 font-semibold text-gray-900 border-b pb-2">{d.label}</p>
                      <p className="text-blue-600 font-semibold">
                        {metric === 'effectif' ? d.effectif : d.etpt.toFixed(1)}{' '}
                        {metric === 'effectif' ? 'agents' : 'ETPT'}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey={dataKey} radius={[0, 8, 8, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={entry.id} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3>Détail par catégorie</h3>
            <p className="text-sm text-gray-500 mt-1">
              Consultez la répartition par service ou par intitulé de poste.
            </p>
          </div>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {action.categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {selectedCategory?.id === 'autres' && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Cette catégorie regroupe les agents non classés automatiquement. Utilisez l&apos;onglet
            « Par poste » pour voir les intitulés de fonction correspondants.
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setDetailView('service')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              detailView === 'service'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Par service
          </button>
          <button
            type="button"
            onClick={() => setDetailView('poste')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              detailView === 'poste'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Par poste
          </button>
        </div>

        {detailView === 'service' && selectedCategory && selectedCategory.detailsParService.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700">Service (Niveau 03)</th>
                  <th className="px-4 py-3 text-right text-gray-700">Effectif</th>
                  <th className="px-4 py-3 text-right text-gray-700">ETPT</th>
                  <th className="px-4 py-3 text-right text-gray-700">Part</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedCategory.detailsParService.map((row) => (
                  <tr key={row.service} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{row.service}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.effectif}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.etpt.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                      {pct(
                        metric === 'effectif' ? row.effectif : row.etpt,
                        metric === 'effectif' ? selectedCategory.effectif : selectedCategory.etpt
                      )}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td className="px-4 py-3 text-gray-900">Total</td>
                  <td className="px-4 py-3 text-right tabular-nums">{selectedCategory.effectif}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{selectedCategory.etpt.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : detailView === 'service' ? (
          <p className="text-sm text-gray-500">Aucun détail par service pour cette catégorie.</p>
        ) : null}

        {detailView === 'poste' && selectedCategory && (selectedCategory.detailsParPoste?.length ?? 0) > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                {filteredPostes.length} poste{filteredPostes.length > 1 ? 's' : ''}
                {posteSearch.trim() ? ` (filtré sur ${selectedCategory.detailsParPoste.length})` : ''}
              </p>
              <input
                type="search"
                value={posteSearch}
                onChange={(e) => setPosteSearch(e.target.value)}
                placeholder="Rechercher un poste ou un service…"
                className="w-full sm:w-72 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto border border-gray-100 rounded-lg">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-700">Poste / fonction</th>
                    <th className="px-4 py-3 text-left text-gray-700">Service</th>
                    <th className="px-4 py-3 text-right text-gray-700">Effectif</th>
                    <th className="px-4 py-3 text-right text-gray-700">ETPT</th>
                    <th className="px-4 py-3 text-right text-gray-700">Part</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPostes.map((row) => (
                    <tr key={`${row.poste}::${row.service}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{row.poste}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.service}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.effectif}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.etpt.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                        {pct(
                          metric === 'effectif' ? row.effectif : row.etpt,
                          metric === 'effectif' ? selectedCategory.effectif : selectedCategory.etpt
                        )}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
                {filteredPostes.length > 0 && (
                  <tfoot className="bg-gray-50 font-semibold sticky bottom-0">
                    <tr>
                      <td className="px-4 py-3 text-gray-900" colSpan={2}>
                        {posteSearch.trim() ? 'Total filtré' : 'Total'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {posteSearch.trim() ? filteredPostesTotals.effectif : selectedCategory.effectif}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {(posteSearch.trim() ? filteredPostesTotals.etpt : selectedCategory.etpt).toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {posteSearch.trim()
                          ? `${pct(
                              metric === 'effectif'
                                ? filteredPostesTotals.effectif
                                : filteredPostesTotals.etpt,
                              metric === 'effectif' ? selectedCategory.effectif : selectedCategory.etpt
                            )}%`
                          : '100%'}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            {filteredPostes.length === 0 && (
              <p className="text-sm text-gray-500">Aucun poste ne correspond à votre recherche.</p>
            )}
          </div>
        ) : detailView === 'poste' ? (
          <p className="text-sm text-gray-500">Aucun détail par poste pour cette catégorie.</p>
        ) : null}
      </div>
    </div>
  );
}

export function PasaEffectifsView() {
  const { data, loading, error } = usePasaEffectifsData();
  const [activeActionId, setActiveActionId] = useState('pasa2');
  const [metric, setMetric] = useState<Metric>('effectif');

  const activeAction = useMemo(
    () => data?.actions.find((a) => a.id === activeActionId) ?? data?.actions[0],
    [data, activeActionId]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        Chargement des effectifs PASA…
      </div>
    );
  }

  if (!data || !activeAction) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        Impossible de charger les données PASA.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-2xl mb-2">Effectifs PASA</h2>
          <p className="text-gray-600">
            Répartition des effectifs par action et catégorie
          </p>
          {error && <p className="text-sm text-amber-700 mt-1">{error}</p>}
        </div>
        <div className="flex flex-col gap-2 w-full">
          <MethodologyDialog
            title="Méthodologie — Effectifs PASA"
            intro="Classification automatique à partir de la feuille « Données annuelles » du fichier ETPT_RPROG."
            sections={methodologySections(data)}
            buttonClassName="w-full"
          />
          <label className="flex flex-col gap-1.5 w-full">
            <span className="text-sm text-gray-600">Afficher</span>
            <div className="flex w-full items-center pr-3 rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as Metric)}
                className="w-full px-4 py-2.5 text-sm bg-transparent border-0 outline-none"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                title="Afficher"
              >
                <option value="effectif">Effectifs (agents)</option>
                <option value="etpt">ETPT</option>
              </select>
              <span className="pointer-events-none flex h-4 w-6 items-center justify-center text-gray-500 shrink-0">
                <ChevronDown className="h-4 w-4 shrink-0" />
              </span>
            </div>
          </label>
          <button
            type="button"
            onClick={() => exportCsv(activeAction)}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
          >
            Exporter CSV
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-visible">
        {data.actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => setActiveActionId(action.id)}
            className={`px-3 sm:px-4 py-2.5 rounded-lg transition-all text-sm whitespace-nowrap shrink-0 ${
              activeActionId === action.id
                ? 'bg-blue-900 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span className="hidden sm:inline">{action.title.replace(/^PASA \d+ — /, 'PASA ' + action.id.replace('pasa', '') + ' — ')}</span>
            <span className="sm:hidden">PASA {action.id.replace('pasa', '')}</span>
            <span className="ml-2 tabular-nums opacity-80">({action.totalEffectif})</span>
          </button>
        ))}
      </div>

      <PasaActionPanel key={activeAction.id} action={activeAction} metric={metric} />
    </div>
  );
}
