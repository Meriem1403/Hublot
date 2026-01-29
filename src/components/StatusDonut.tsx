import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CheckCircle, Lightbulb } from 'lucide-react';
import { useStatutRepartition } from '../hooks/useAgentsData';

export function StatusDonut() {
  const repartition = useStatutRepartition();
  
  // Calculer le total des agents actifs pour recalculer les pourcentages après regroupement
  const totalAgents = repartition.reduce((sum, item) => sum + item.nombre, 0);
  
  // Mapper les statuts vers les noms d'affichage et regrouper si nécessaire
  const mappedData = repartition
    .filter(item => item.nombre > 0) // Filtrer les statuts avec 0 agents
    .map(item => {
      const statutUpper = String(item.statut).toUpperCase().trim();
      let name = 'Autre';
      
      if (statutUpper === 'TITULAIRE' || statutUpper.includes('TITULAIRE')) {
        name = 'Titulaires';
      } else if (statutUpper === 'CDI' || statutUpper.includes('CDI') || statutUpper.includes('CONTRACTUEL CDI')) {
        name = 'Contractuels CDI';
      } else if (statutUpper === 'CDD' || statutUpper.includes('CDD') || statutUpper.includes('CONTRACTUEL CDD')) {
        name = 'Contractuels CDD';
      } else if (statutUpper === 'STAGIAIRE' || statutUpper.includes('STAGIAIRE') || statutUpper.includes('STAGE')) {
        name = 'Stagiaires';
      } else {
        // Si le statut n'est pas reconnu, utiliser la valeur originale
        name = String(item.statut);
      }
      
      return {
        name,
        value: item.nombre,
        originalStatut: item.statut
      };
    });
  
  // Regrouper les statuts qui ont le même nom et recalculer les pourcentages
  const groupedData = mappedData.reduce((acc, item) => {
    const existing = acc.find(d => d.name === item.name);
    if (existing) {
      existing.value += item.value;
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, [] as Array<{ name: string; value: number; originalStatut: string }>);
  
  // Recalculer les pourcentages basés sur le total réel
  // Créer deux structures : une pour le graphique (sans percent) et une pour l'affichage (avec percent)
  const dataWithPercent = groupedData
    .map(item => ({
      ...item,
      percent: totalAgents > 0 ? Math.round((item.value / totalAgents) * 1000) / 10 : 0
    }))
    .sort((a, b) => {
      // Trier par ordre : Titulaires, CDI, CDD, Stagiaires, Autre
      const order: Record<string, number> = {
        'Titulaires': 1,
        'Contractuels CDI': 2,
        'Contractuels CDD': 3,
        'Stagiaires': 4
      };
      return (order[a.name] || 99) - (order[b.name] || 99);
    });
  
  // Données pour Recharts (sans le champ percent pour éviter les conflits)
  const chartData = dataWithPercent.map(({ percent, ...rest }) => rest);
  
  // Données pour l'affichage (avec percent)
  const data = dataWithPercent;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">Répartition des statuts</h2>
        <p className="text-gray-600">
          Analyse de la stabilité des équipes et du risque de turnover
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="mb-4">Distribution par statut</h3>
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-[350px] text-gray-500">
              <p>Aucune donnée disponible</p>
            </div>
          ) : data.length === 1 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center h-[200px]">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: COLORS[0] + '20' }}>
                    <div className="w-16 h-16 rounded-full"
                      style={{ backgroundColor: COLORS[0] }} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{data[0].name}</p>
                  <p className="text-lg text-gray-600 mt-2">{data[0].value} agents</p>
                  <p className="text-sm text-gray-500 mt-1">{data[0].percent}% du total</p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note :</strong> Tous les agents ont le même statut. Vérifiez que les données sont correctement normalisées.
                </p>
              </div>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={chartData.length > 1 ? 2 : 0}
                    dataKey="value"
                    label={({ percent }) => {
                      // percent de Recharts est entre 0 et 1, on le convertit en pourcentage
                      return `${(percent * 100).toFixed(1)}%`;
                    }}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const payloadData = payload[0].payload;
                        // Trouver les données complètes avec percent depuis data
                        const fullData = data.find(d => d.name === payloadData.name);
                        return (
                          <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                            <p className="mb-1 font-semibold">{payloadData.name}</p>
                            <p className="text-blue-600 font-bold">{payloadData.value} agents</p>
                            <p className="text-gray-600">{fullData?.percent || 0}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className={`grid gap-3 mt-4 ${data.length <= 2 ? 'grid-cols-2' : data.length <= 4 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {data.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-600">{item.value} ({item.percent}%)</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h3 className="mb-4">Analyse de stabilité</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-blue-900">Taux de titularisation</span>
                  <span className="text-2xl text-blue-900">
                    {Math.round((data.find(d => d.name === 'Titulaires')?.percent || 0) * 10) / 10}%
                  </span>
                </div>
                <p className="text-sm text-blue-800">
                  Base stable, conforme aux objectifs du ministère
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-green-900">Agents permanents</span>
                  <span className="text-2xl text-green-900">
                    {Math.round(((data.find(d => d.name === 'Titulaires')?.percent || 0) + 
                                 (data.find(d => d.name === 'Contractuels CDI')?.percent || 0)) * 10) / 10}%
                  </span>
                </div>
                <p className="text-sm text-green-800">
                  Titulaires + CDI : stabilité élevée
                </p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-orange-900">Agents temporaires</span>
                  <span className="text-2xl text-orange-900">
                    {Math.round(((data.find(d => d.name === 'Contractuels CDD')?.percent || 0) + 
                                 (data.find(d => d.name === 'Stagiaires')?.percent || 0)) * 10) / 10}%
                  </span>
                </div>
                <p className="text-sm text-orange-800">
                  CDD + Stagiaires : turnover potentiel
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-900" />
              <h3 className="text-lg text-green-900">Stabilité bonne</h3>
            </div>
            <p className="text-sm text-green-900">
              {Math.round(((data.find(d => d.name === 'Titulaires')?.percent || 0) + 
                          (data.find(d => d.name === 'Contractuels CDI')?.percent || 0)))}% des agents sont en situation stable (titulaires ou CDI), 
              ce qui garantit la continuité du service public maritime.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-blue-900" />
              <h3 className="text-lg text-blue-900">Recommandation</h3>
            </div>
            <p className="text-sm text-blue-900">
              {data.find(d => d.name === 'Contractuels CDI')?.value ? 
                `Prévoir la titularisation de ${Math.max(1, Math.round((data.find(d => d.name === 'Contractuels CDI')?.value || 0) * 0.2))} contractuels CDI éligibles d'ici fin 2025.` :
                'Surveiller les opportunités de titularisation.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}