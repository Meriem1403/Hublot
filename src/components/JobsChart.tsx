import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Lightbulb } from 'lucide-react';
import { useMetierRepartition, useAgentsData } from '../hooks/useAgentsData';
import { MethodologyDialog } from './MethodologyDialog';

export function JobsChart() {
  const repartitionMetiers = useMetierRepartition();
  const agents = useAgentsData();
  
  // Trier par effectif décroissant et limiter aux 20 premiers
  const data = repartitionMetiers
    .sort((a, b) => b.effectif - a.effectif)
    .slice(0, 20)
    .map(item => ({
      corps: item.metier,
      effectif: item.effectif
    }));

  const correspondances = useMemo(() => {
    const topLabels = new Set(data.map((d) => d.corps));
    const grouped = new Map<string, {
      count: number;
      libelleNNE: Map<string, number>;
      poste: Map<string, number>;
      grade: Map<string, number>;
    }>();

    agents
      .filter((a) => a.actif)
      .forEach((a) => {
        const label = (
          a.libelleNNE ||
          a.fonctionExercee ||
          a.corps ||
          a.metier ||
          'Non défini'
        ).trim();
        if (!topLabels.has(label)) return;

        if (!grouped.has(label)) {
          grouped.set(label, {
            count: 0,
            libelleNNE: new Map<string, number>(),
            poste: new Map<string, number>(),
            grade: new Map<string, number>()
          });
        }
        const row = grouped.get(label)!;
        row.count += 1;

        const l = (a.libelleNNE || 'Non défini').trim();
        const p = (a.fonctionExercee || 'Non défini').trim();
        const g = (a.corps || 'Non défini').trim();
        row.libelleNNE.set(l, (row.libelleNNE.get(l) || 0) + 1);
        row.poste.set(p, (row.poste.get(p) || 0) + 1);
        row.grade.set(g, (row.grade.get(g) || 0) + 1);
      });

    const topValue = (m: Map<string, number>) =>
      Array.from(m.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Non défini';

    return data.map((d) => {
      const g = grouped.get(d.corps);
      return {
        libelleAffiche: d.corps,
        effectif: d.effectif,
        sourceLibelleNNE: g ? topValue(g.libelleNNE) : 'Non défini',
        sourcePoste: g ? topValue(g.poste) : 'Non défini',
        sourceGrade: g ? topValue(g.grade) : 'Non défini'
      };
    });
  }, [agents, data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl mb-2">Métiers (libellés)</h2>
          <p className="text-gray-600">
            Répartition des effectifs par intitulé métier lisible issu des données réelles
          </p>
        </div>
        <MethodologyDialog
          title="Méthodologie — Métiers (libellés)"
          intro="Répartition par intitulé métier lisible depuis les champs agents."
          sections={[
            {
              title: 'Sources',
              bullets: [
                'Colonne Excel `Libellé NNE` -> `libelleNNE` (source prioritaire pour l’affichage).',
                'Colonne Excel `Poste` -> `fonctionExercee` (repli si `Libellé NNE` absent).',
                'Colonne Excel `Grade` -> `corps` (repli supplémentaire).',
                'Colonne Excel `Catégorie` -> utilisée indirectement pour déterminer `actif`/normalisation dans le pipeline.',
                'Colonne Excel `Service` -> non utilisée pour l’agrégation principale de cet onglet, mais conservée dans les données agents.',
                'Champ `actif` : seuls les agents actifs sont comptés.',
              ]
            },
            {
              title: 'Calculs affichés',
              bullets: [
                'Base commune: filtres globaux appliqués, puis agents `actif = true`.',
                'Comptage des agents par libellé selon priorité : `Libellé NNE` > `Poste` > `Grade` > `metier`.',
                'Tri décroissant des effectifs.',
                'Top 20 affiché pour lisibilité (les autres valeurs restent présentes dans les données brutes).'
              ]
            },
            {
              title: 'Calculs détaillés de l’onglet',
              bullets: [
                'Graphique principal: 1 barre = 1 libellé métier agrégé ; longueur de barre = effectif agrégé.',
                'Ordonnée (labels): même libellé agrégé que le graphique, sans recodage supplémentaire.',
                'Tooltip: ré-affiche l’effectif de la barre et la correspondance source majoritaire observée dans les champs `Libellé NNE` / `Poste` / `Grade`.',
                'Tableau de correspondance: pour chaque libellé affiché (Top 20), sélection de la valeur majoritaire par champ source via comptage des occurrences.',
              ]
            }
          ]}
        />
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <p className="text-sm text-gray-600 mb-3">
          Ordonnée: <strong>intitulé métier lisible</strong> (priorité Excel:
          <strong> Libellé NNE</strong>, puis <strong>Poste</strong>, puis <strong>Grade</strong>).
        </p>
        <div className="-mx-6">
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 20, right: 24, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="corps"
                width={260}
                tickMargin={2}
                tick={{ dx: -42 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const corr = correspondances.find((c) => c.libelleAffiche === data.corps);
                    return (
                      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                        <p className="mb-2">Métier: {data.corps}</p>
                        <p className="text-blue-600">Effectif: {data.effectif} agents</p>
                        {corr && (
                          <div className="mt-2 pt-2 border-t text-xs text-gray-700 space-y-1">
                            <p>Libellé NNE (source): {corr.sourceLibelleNNE}</p>
                            <p>Poste (source): {corr.sourcePoste}</p>
                            <p>Grade (source): {corr.sourceGrade}</p>
                          </div>
                        )}
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
                      key={`cell-${entry.corps}`}
                      fill={colors[index % colors.length]}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-blue-900" />
          <h3 className="text-lg text-blue-900">Comment lire ce graphique</h3>
        </div>
        <p className="text-sm text-blue-900 leading-relaxed">
          Chaque barre représente un intitulé métier, avec sa longueur proportionnelle au nombre d'agents en poste.
          Les intitulés sont triés du plus au moins représenté et seuls les 20 premiers sont affichés pour
          garder une bonne lisibilité. Cela permet d’identifier rapidement les métiers dominants dans la DIRM
          ainsi que ceux qui sont plus rares.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="mb-3">Correspondance des libellés affichés</h3>
        <p className="text-sm text-gray-600 mb-4">
          Pour aider la lecture des acronymes, ce tableau affiche la correspondance
          principale observée dans les colonnes Excel <strong>Libellé NNE</strong>, <strong>Poste</strong> et <strong>Grade</strong>.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-semibold text-gray-700">Libellé affiché</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Libellé NNE (source)</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Poste (source)</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Grade (source)</th>
                <th className="text-right py-2 pl-2 font-semibold text-gray-700">Effectif</th>
              </tr>
            </thead>
            <tbody>
              {correspondances.map((row, idx) => (
                <tr key={row.libelleAffiche} className={idx % 2 === 0 ? 'bg-gray-50/50' : ''}>
                  <td className="py-1.5 pr-4 text-gray-900">{row.libelleAffiche}</td>
                  <td className="py-1.5 px-2 text-gray-800">{row.sourceLibelleNNE}</td>
                  <td className="py-1.5 px-2 text-gray-800">{row.sourcePoste}</td>
                  <td className="py-1.5 px-2 text-gray-800">{row.sourceGrade}</td>
                  <td className="py-1.5 pl-2 text-right text-gray-900 font-medium">{row.effectif}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}