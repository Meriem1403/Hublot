import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Lightbulb } from 'lucide-react';
import { useMetierRepartition } from '../hooks/useAgentsData';
import { MethodologyDialog } from './MethodologyDialog';

export function JobsChart() {
  const repartitionMetiers = useMetierRepartition();
  
  // Trier par effectif décroissant et limiter aux 20 premiers
  const data = repartitionMetiers
    .sort((a, b) => b.effectif - a.effectif)
    .slice(0, 20)
    .map(item => ({
      metier: item.metier,
      effectif: item.effectif
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl mb-2">Corps (grade)</h2>
          <p className="text-gray-600">
            Répartition des effectifs par corps à partir des données réelles
          </p>
        </div>
        <MethodologyDialog
          title="Méthodologie — Corps (grade)"
          intro="Répartition par corps depuis les champs agents."
          sections={[
            {
              title: 'Sources',
              bullets: [
                'Corps (prioritaire) sinon métier historique dans les données agents.',
                'Filtres globaux appliqués avant agrégation.'
              ]
            },
            {
              title: 'Calculs affichés',
              bullets: [
                'Comptage des agents par corps.',
                'Tri décroissant des effectifs.',
                'Top 20 affiché pour lisibilité.'
              ]
            }
          ]}
        />
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 140, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" />
            <YAxis type="category" dataKey="metier" width={130} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                      <p className="mb-2">{data.metier}</p>
                      <p className="text-blue-600">Effectif: {data.effectif} agents</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="effectif" radius={[0, 8, 8, 0]}>
              {data.map((entry, index) => {
                const colors = [
                  '#3b82f6', // bleu
                  '#10b981', // vert
                  '#f59e0b', // orange
                  '#6366f1', // indigo
                  '#ec4899', // rose
                  '#22c55e', // vert clair
                  '#eab308', // jaune
                  '#0ea5e9'  // cyan
                ];
                return (
                  <Cell
                    key={`cell-${entry.metier}`}
                    fill={colors[index % colors.length]}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-blue-900" />
          <h3 className="text-lg text-blue-900">Comment lire ce graphique</h3>
        </div>
        <p className="text-sm text-blue-900 leading-relaxed">
          Chaque barre représente un corps, avec sa longueur proportionnelle au nombre d'agents en poste.
          Les corps sont triés du plus au moins représenté et seuls les 20 premiers sont affichés pour
          garder une bonne lisibilité. Cela permet d’identifier rapidement les métiers dominants dans la DIRM
          ainsi que ceux qui sont plus rares.
        </p>
      </div>
    </div>
  );
}