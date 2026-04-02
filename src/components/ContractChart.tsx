import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Briefcase, ClipboardList } from 'lucide-react';
import { useContratRepartition, useAgentsData, useTempsTravail } from '../hooks/useAgentsData';
import { MethodologyDialog } from './MethodologyDialog';
import { DIRM_MEDITERANEE_LABEL } from '../services/dataService';

export function ContractChart() {
  const repartitionContrat = useContratRepartition();
  const agents = useAgentsData();
  const tempsTravail = useTempsTravail();
  const repartitionAffichee = repartitionContrat.filter((item) => item.service !== DIRM_MEDITERANEE_LABEL);
  
  // Formater les données pour le graphique (sans stagiaires, non présents dans les données actuelles)
  const data = repartitionAffichee.map(item => ({
    service: item.service,
    'Temps plein': item.tempsPlein,
    'Temps partiel': item.tempsPartiel,
    'CDD': item.cdd
  }));
  
  // Calculer les totaux (on garde totalStagiaires pour d'éventuelles évolutions, mais on ne l'affiche plus)
  const totalTempsPlein = repartitionAffichee.reduce((sum, item) => sum + item.tempsPlein, 0);
  const totalTempsPartiel = repartitionAffichee.reduce((sum, item) => sum + item.tempsPartiel, 0);
  const totalCDD = repartitionAffichee.reduce((sum, item) => sum + item.cdd, 0);
  const totalAgents = agents.filter(a => a.actif).length;
  const chartMinWidth = Math.max(680, data.length * 56);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl mb-2">Types de contrats</h2>
          <p className="text-gray-600">
            Répartition des catégories contractuelles observées après filtres
          </p>
        </div>
        <MethodologyDialog
          title="Méthodologie — Types de contrats"
          intro="Calculs réalisés sur les agents filtrés."
          sections={[
            {
              title: 'Sources',
              bullets: [
                'Champ Excel `Temps de travail` -> `contratType` (Temps plein/Temps partiel).',
                'Champ Excel `Catégorie` -> `statut` normalisé (Titulaire/CDI/CDD/Stagiaire).',
                'Service (Excel) pour la répartition par service.'
              ]
            },
            {
              title: 'Calculs affichés',
              bullets: [
                'Base commune: filtres globaux appliqués, puis agents `actif = true`.',
                'Règle de priorité par agent pour la répartition affichée: Stagiaire > CDD > Temps partiel > Temps plein.',
                'Comptage réel par service pour chaque catégorie selon cette priorité.',
                'Pourcentages = (nombre catégorie / effectif filtré) x 100.',
              ]
            }
          ]}
        />
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="overflow-x-auto">
          <div style={{ minWidth: `${chartMinWidth}px` }}>
            <ResponsiveContainer width="100%" height={450}>
              <BarChart
                data={data}
                margin={{ top: 56, right: 30, left: 20, bottom: 88 }}
                barCategoryGap="0%"
                barGap={0}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="service"
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={88}
                />
                <YAxis />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const total = payload.reduce((sum, p) => sum + (p.value as number || 0), 0);
                      return (
                        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                          <p className="mb-2">{label}</p>
                          {payload.map((p, index) => (
                            <p key={index} style={{ color: p.color }}>
                              {p.name}: {p.value} agents
                            </p>
                          ))}
                          <p className="text-gray-900 mt-2 pt-2 border-t">Total: {total} agents</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" align="center" wrapperStyle={{ top: 8 }} />
                <Bar dataKey="Temps plein" stackId="a" fill="#3b82f6" barSize={16} />
                <Bar dataKey="Temps partiel" stackId="a" fill="#10b981" barSize={16} />
                <Bar dataKey="CDD" stackId="a" fill="#f59e0b" barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-4 h-4 bg-blue-500 rounded mx-auto mb-2" />
            <p className="text-blue-900">Temps plein</p>
            <p className="text-2xl text-blue-900">{totalTempsPlein}</p>
            <p className="text-xs text-blue-700">{totalAgents > 0 ? Math.round((totalTempsPlein / totalAgents) * 1000) / 10 : 0}%</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="w-4 h-4 bg-green-500 rounded mx-auto mb-2" />
            <p className="text-green-900">Temps partiel</p>
            <p className="text-2xl text-green-900">{totalTempsPartiel}</p>
            <p className="text-xs text-green-700">{totalAgents > 0 ? Math.round((totalTempsPartiel / totalAgents) * 1000) / 10 : 0}%</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="w-4 h-4 bg-orange-500 rounded mx-auto mb-2" />
            <p className="text-orange-900">CDD</p>
            <p className="text-2xl text-orange-900">{totalCDD}</p>
            <p className="text-xs text-orange-700">{totalAgents > 0 ? Math.round((totalCDD / totalAgents) * 1000) / 10 : 0}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-5 h-5 text-blue-900" />
            <h3 className="text-lg text-blue-900">Temps partiel</h3>
          </div>
          <p className="text-sm text-blue-900 mb-2">
            {tempsTravail.details.tempsPartiel.count} agents en temps partiel ({tempsTravail.details.tempsPartiel.moyennePct}% en moyenne)
          </p>
          <p className="text-sm text-blue-800">
            • Équivalent : {Math.round(tempsTravail.details.tempsPartiel.etp)} ETP (Équivalents Temps Plein)<br />
            • {Math.round(tempsTravail.details.tempsPartiel.pct * 10) / 10}% de l'effectif total
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-5 h-5 text-orange-900" />
            <h3 className="text-lg text-orange-900">CDD</h3>
          </div>
          <p className="text-sm text-orange-900 mb-2">
              {totalCDD} agents classés CDD ({totalAgents > 0 ? Math.round((totalCDD / totalAgents) * 1000) / 10 : 0}% de l'effectif)
          </p>
          <p className="text-sm text-orange-800">
              • Comptage direct des agents avec `statut = CDD`<br />
              • Valeur descriptive (aucune recommandation ajoutée)
          </p>
        </div>
      </div>
    </div>
  );
}