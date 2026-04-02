import { useState } from 'react';
import { Users, BarChart3, BadgeCheck, Briefcase, Timer, X } from 'lucide-react';
import { useOverviewStats } from '../hooks/useAgentsData';
import { useAgentsData } from '../hooks/useAgentsData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export function OverviewCards() {
  const overviewStats = useOverviewStats();
  const agents = useAgentsData();
  const [openInfo, setOpenInfo] = useState(false);

  const pasaData = (() => {
    const counts = new Map<string, number>();
    const labels = new Map<string, string>();
    agents.filter((a) => a.actif).forEach((a) => {
      const code = a.pasaCode || 'Non renseigné';
      counts.set(code, (counts.get(code) || 0) + 1);
      if (!labels.has(code)) {
        const lib = (a.pasaLibelle || '').trim();
        labels.set(code, lib || code);
      }
    });
    return Array.from(counts.entries())
      .map(([code, value]) => ({
        code,
        libelle: labels.get(code) || code,
        name: labels.get(code) || code,
        value
      }))
      .sort((a, b) => b.value - a.value);
  })();

  const pasaColors = ['#1d4ed8', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#64748b'];
  
  const stats = [
    {
      label: 'Effectifs totaux',
      value: overviewStats.effectifsTotaux.toString(),
      subtext: 'agents en poste',
      icon: Users,
      color: 'blue',
      trend: 'Comptage des agents actifs'
    },
    {
      label: 'ETP total',
      value: overviewStats.etpTotal.toFixed(1),
      subtext: 'somme des ETP (Temps de travail)',
      icon: Timer,
      color: 'green',
      trend: 'Calculé depuis le Temps de travail'
    },
    {
      label: 'Encadrants',
      value: overviewStats.encadrantsTotal.toString(),
      subtext: `ratio ${overviewStats.ratioEncadrement}`,
      icon: BadgeCheck,
      color: 'orange',
      trend: 'Basé sur niveauResponsabilite'
    },
    {
      label: 'Temps partiel',
      value: overviewStats.nbTempsPartiel.toString(),
      subtext: `${overviewStats.nbTempsPlein} temps plein • ${overviewStats.effectifsTotaux > 0 ? Math.round((overviewStats.nbTempsPartiel / overviewStats.effectifsTotaux) * 100) : 0}%`,
      icon: Briefcase,
      color: 'purple',
      trend: 'Comptage selon contratType'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500'
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl mb-2">Vue d'ensemble des effectifs</h2>
            <p className="text-gray-600">
              Indicateurs clés pour évaluer la disponibilité et la stabilité des équipes
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpenInfo(true)}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
            aria-haspopup="dialog"
            aria-expanded={openInfo}
          >
            Méthodologie des calculs
          </button>
        </div>
      </div>

      {openInfo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpenInfo(false);
          }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpenInfo(false)}
            aria-label="Fermer la fiche méthodologie"
          />
          <div className="relative w-[min(920px,calc(100vw-2rem))] max-h-[min(80vh,720px)] overflow-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-2xl text-gray-900">Méthodologie — Vue d’ensemble</h3>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  Cette fiche explique <strong>les calculs</strong> et <strong>les colonnes Excel</strong> utilisées.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenInfo(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="text-gray-900 font-semibold mb-2">1) Effectifs totaux (agents en poste)</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>Source Excel</strong> : feuille <strong>“Données”</strong> (1 ligne = 1 agent).</li>
                  <li><strong>Calcul</strong> : comptage des agents chargés dans l’app (statut “en poste”).</li>
                  <li><strong>Remarque</strong> : si une colonne “Actif / En poste” existe, elle est utilisée ; sinon l’export est supposé ne contenir que des agents en poste.</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="text-gray-900 font-semibold mb-2">2) Temps plein / Temps partiel</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>Source Excel</strong> : colonne <strong>“Temps de travail”</strong>.</li>
                  <li><strong>Règle</strong> : 100 → <strong>Temps plein</strong> ; &lt;100 → <strong>Temps partiel</strong>.</li>
                  <li><strong>Donnée affichée</strong> : nombre d’agents en temps partiel et nombre d’agents en temps plein.</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="text-gray-900 font-semibold mb-2">3) ETP total</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>Source Excel</strong> : colonne <strong>“Temps de travail”</strong>.</li>
                  <li><strong>Calcul</strong> : ETP = 1.0 si 100 ; sinon ETP = (Temps de travail ÷ 100). Exemple : 80 → 0.8.</li>
                  <li><strong>ETP total</strong> = somme des ETP de tous les agents.</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="text-gray-900 font-semibold mb-2">4) Encadrants et ratio d’encadrement</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>Source Excel</strong> : colonne de <strong>catégorie / niveau / hiérarchie</strong> (ex. “Catégorie”).</li>
                  <li><strong>Encadrants</strong> = niveau “Encadrement” + “Direction”.</li>
                  <li><strong>Opérationnels</strong> = niveau “Opérationnel”.</li>
                  <li><strong>Ratio</strong> : “1 encadrant pour X opérationnels” (X = opérationnels ÷ encadrants).</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="text-gray-900 font-semibold mb-2">5) Politique publique (PASA)</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>Source Excel</strong> : colonnes <strong>“Action”</strong>, <strong>“Sous-Action”</strong> et <strong>“Thématique”</strong>.</li>
                  <li><strong>Calcul</strong> : chaque agent est classé dans une politique PASA via des règles de correspondance, puis on compte les agents par politique.</li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${colorClasses[stat.color as keyof typeof colorClasses]} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-gray-600 text-sm">{stat.label}</p>
              <p className="text-4xl text-gray-900">{stat.value}</p>
              <p className="text-gray-500 text-sm">{stat.subtext}</p>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">{stat.trend}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-900" />
            <h3 className="text-lg text-gray-900">Effectifs par politique publique (PASA)</h3>
          </div>
          <div className="h-[360px]">
            {pasaData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={340}>
                <PieChart>
                  <Pie
                    data={pasaData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={120}
                    label={({ value, percent, x, y }) => {
                      // Afficher uniquement les valeurs (ex: 454) pour les parts suffisamment grandes
                      if (typeof value !== 'number') return null;
                      if (typeof percent === 'number' && percent < 0.05) return null; // < 5% : trop petit
                      return (
                        <text
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="fill-gray-900"
                          style={{ fontSize: 12, fontWeight: 700 }}
                        >
                          {value}
                        </text>
                      );
                    }}
                    labelLine={false}
                    isAnimationActive={false}
                  >
                    {pasaData.map((_, idx) => (
                      <Cell key={idx} fill={pasaColors[idx % pasaColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-600">Aucune donnée PASA disponible.</p>
            )}
          </div>
          {pasaData.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Détail (comptage)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pasaData.map((row, idx) => (
                  <div
                    key={row.code}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-200"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="block w-4 h-4 min-w-4 min-h-4 aspect-square rounded-full flex-none ring-2 ring-white shadow"
                        style={{ backgroundColor: pasaColors[idx % pasaColors.length] }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate" title={row.libelle}>
                          {row.libelle}
                        </p>
                        <p className="text-xs text-gray-600 truncate" title={row.code}>
                          {row.code}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Source : colonnes Excel <strong>Action / Sous-Action</strong> (classification déduite).
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-green-900" />
            <h3 className="text-lg text-green-900">Ratio encadrement</h3>
          </div>
          {overviewStats.ratioEncadrement !== 'N/A' ? (
            <>
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-3xl font-bold text-green-900">{overviewStats.encadrantsTotal}</p>
                  <p className="text-lg text-green-700">encadrants</p>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-3xl font-bold text-green-900">{overviewStats.operationnelsTotal}</p>
                  <p className="text-lg text-green-700">agents opérationnels</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3 border border-green-200">
                  <p className="text-sm text-green-800 font-semibold mb-1">Ratio d'encadrement</p>
                  <p className="text-lg text-green-900">
                    <strong>1 encadrant</strong> pour <strong>{(overviewStats.operationnelsTotal / overviewStats.encadrantsTotal).toFixed(1)} agents</strong> opérationnels
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    ({overviewStats.operationnelsTotal} ÷ {overviewStats.encadrantsTotal} = {(overviewStats.operationnelsTotal / overviewStats.encadrantsTotal).toFixed(1)})
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-green-700">Aucun encadrant détecté dans les données</p>
          )}
        </div>

        {/* Bloc Tension RH supprimé : nécessite un référentiel de postes budgétés/vacants dans la source */}
      </div>
    </div>
  );
}