import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Lightbulb, AlertTriangle, Info, Users, Target, TrendingUp, Calculator } from 'lucide-react';
import { useAgentsData } from '../hooks/useAgentsData';
import { useMemo } from 'react';

export function MissionChart() {
  const agents = useAgentsData();
  
  // Calculer les effectifs par mission depuis les données réelles
  const data = useMemo(() => {
    const agentsActifs = agents.filter(a => a.actif);
    
    // Compter les effectifs par mission réelle
    const missionsMap = new Map<string, number>();
    agentsActifs.forEach(agent => {
      const mission = agent.mission || 'Non définie';
      missionsMap.set(mission, (missionsMap.get(mission) || 0) + 1);
    });
    
    // Convertir en tableau et calculer les capacités dynamiquement
    const maxEffectif = Math.max(...Array.from(missionsMap.values()));
    const missionsData = Array.from(missionsMap.entries()).map(([mission, effectif]) => {
      // Capacité = effectif actuel + marge de 10% pour les postes vacants
      const capacite = Math.ceil(effectif * 1.1);
      const taux = capacite > 0 ? Math.round((effectif / capacite) * 100) : 0;
      
      // Pour les petits effectifs, garantir une hauteur minimale visuelle (2% du maximum)
      // Cela permet de voir les bâtonnets même pour 1-2 agents
      const effectifVisuel = Math.max(effectif, maxEffectif * 0.02);
      const capaciteVisuelle = Math.max(capacite, maxEffectif * 0.02);
      
      return {
        mission,
        effectif,
        effectifVisuel, // Pour l'affichage visuel
        capacite,
        capaciteVisuelle, // Pour l'affichage visuel
        taux
      };
    }).sort((a, b) => b.effectif - a.effectif);
    
    return missionsData;
  }, [agents]);

  const getColor = (taux: number) => {
    if (taux >= 95) return '#10b981'; // green
    if (taux >= 85) return '#3b82f6'; // blue
    return '#f59e0b'; // orange
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">Effectifs par mission</h2>
        <p className="text-gray-600">
          Identification des missions prioritaires et des besoins en renfort
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <ResponsiveContainer width="100%" height={Math.max(600, data.length * 40)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              label={{ value: 'Nombre d\'agents', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fontSize: '14px', fontWeight: 'bold' } }}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toLocaleString('fr-FR')}
              domain={[0, (dataMax: number) => Math.max(dataMax * 1.1, 10)]}
            />
            <YAxis 
              type="category" 
              dataKey="mission" 
              width={180}
              tick={{ fontSize: 10 }}
              interval={0}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const postesVacants = data.capacite - data.effectif;
                  return (
                    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[200px]">
                      <p className="mb-3 font-semibold text-gray-900 text-base border-b pb-2">{data.mission}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Effectif actuel:</span>
                          <span className="font-bold text-blue-600">{data.effectif.toLocaleString('fr-FR')} agents</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Capacité totale:</span>
                          <span className="font-semibold text-gray-700">{data.capacite.toLocaleString('fr-FR')} agents</span>
                        </div>
                        {postesVacants > 0 ? (
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-gray-600">Postes vacants:</span>
                            <span className="font-bold text-orange-600">{postesVacants} postes</span>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-gray-600">Statut:</span>
                            <span className="font-semibold text-green-600">Complet</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Taux de remplissage:</span>
                          <span className={`font-bold ${data.taux >= 95 ? 'text-green-600' : data.taux >= 85 ? 'text-blue-600' : 'text-orange-600'}`}>
                            {data.taux}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="effectifVisuel" 
              name="Effectif actuel" 
              radius={[0, 8, 8, 0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.taux)} />
              ))}
            </Bar>
            <Bar 
              dataKey="capaciteVisuelle" 
              name="Capacité" 
              fill="#e5e7eb" 
              radius={[0, 8, 8, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-300 shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <p className="text-green-900 font-semibold">≥ 95% : Bien doté</p>
            </div>
            <p className="text-3xl font-bold text-green-900">{data.filter(d => d.taux >= 95).length}</p>
            <p className="text-sm text-green-700 mt-1">missions</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-300 shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <p className="text-blue-900 font-semibold">85-94% : Normal</p>
            </div>
            <p className="text-3xl font-bold text-blue-900">{data.filter(d => d.taux >= 85 && d.taux < 95).length}</p>
            <p className="text-sm text-blue-700 mt-1">missions</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border-2 border-orange-300 shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <p className="text-orange-900 font-semibold">{'<'} 85% : Sous tension</p>
            </div>
            <p className="text-3xl font-bold text-orange-900">{data.filter(d => d.taux < 85).length}</p>
            <p className="text-sm text-orange-700 mt-1">missions</p>
          </div>
        </div>
        
        {/* Explication des calculs */}
        <div className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-2.5 rounded-lg">
              <Calculator className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="text-xl font-bold text-blue-900">Explication des calculs</h4>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Effectif actuel */}
            <div className="bg-white rounded-lg p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-2.5 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h5 className="text-base font-bold text-blue-900">Effectif actuel</h5>
              </div>
              <p className="text-sm text-gray-700 mb-6 leading-relaxed">
                Nombre d'agents actifs comptabilisés pour chaque mission.
              </p>
              <div className="mt-auto pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 leading-relaxed">
                  <span className="font-semibold text-gray-800">Calcul :</span> Comptage de tous les agents dont le champ "mission" correspond à la mission concernée et dont le statut est "actif".
                </p>
              </div>
            </div>

            {/* Capacité totale */}
            <div className="bg-white rounded-lg p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-100 p-2.5 rounded-lg">
                  <Target className="w-5 h-5 text-indigo-600" />
                </div>
                <h5 className="text-base font-bold text-indigo-900">Capacité totale</h5>
              </div>
              <p className="text-sm text-gray-700 mb-6 leading-relaxed">
                Capacité théorique nécessaire pour chaque mission.
              </p>
              <div className="mt-auto space-y-3 pt-4 border-t border-gray-200">
                <div className="bg-indigo-50 rounded-md p-3.5 border border-indigo-200">
                  <p className="text-sm font-mono text-indigo-800 text-center font-semibold">
                    Capacité = Effectif actuel × 1.1
                  </p>
                </div>
                <p className="text-xs text-gray-600 text-center italic leading-relaxed">
                  (Effectif actuel + 10% de marge pour les postes vacants)
                </p>
              </div>
            </div>

            {/* Postes vacants */}
            <div className="bg-white rounded-lg p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-100 p-2.5 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <h5 className="text-base font-bold text-orange-900">Postes vacants</h5>
              </div>
              <p className="text-sm text-gray-700 mb-6 leading-relaxed">
                Nombre de postes à pourvoir pour atteindre la capacité totale.
              </p>
              <div className="mt-auto pt-4 border-t border-gray-200">
                <div className="bg-orange-50 rounded-md p-3.5 border border-orange-200">
                  <p className="text-sm font-mono text-orange-800 text-center font-semibold">
                    Postes vacants = Capacité totale - Effectif actuel
                  </p>
                </div>
              </div>
            </div>

            {/* Taux de remplissage */}
            <div className="bg-white rounded-lg p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 p-2.5 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <h5 className="text-base font-bold text-green-900">Taux de remplissage</h5>
              </div>
              <p className="text-sm text-gray-700 mb-6 leading-relaxed">
                Pourcentage indiquant dans quelle mesure la mission est dotée en personnel.
              </p>
              <div className="mt-auto pt-4 border-t border-gray-200">
                <div className="bg-green-50 rounded-md p-3.5 border border-green-200">
                  <p className="text-sm font-mono text-green-800 text-center font-semibold">
                    Taux = (Effectif actuel ÷ Capacité totale) × 100
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-orange-100 p-2.5 rounded-lg">
            <Lightbulb className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-orange-900">Actions prioritaires</h3>
            <p className="text-sm text-orange-700 mt-2">
              Missions nécessitant un recrutement urgent (taux de remplissage &lt; 85%)
            </p>
          </div>
        </div>
        
        {data.filter(d => d.taux < 85).length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data
              .filter(d => d.taux < 85)
              .sort((a, b) => a.taux - b.taux) // Trier par taux croissant (plus critique en premier)
              .map(mission => {
                const postesVacants = mission.capacite - mission.effectif;
                const criticite = mission.taux < 60 ? 'critique' : mission.taux < 70 ? 'élevée' : 'modérée';
                const bgColor = mission.taux < 60 ? 'bg-red-50 border-red-200' : mission.taux < 70 ? 'bg-orange-50 border-orange-200' : 'bg-amber-50 border-amber-200';
                const textColor = mission.taux < 60 ? 'text-red-900' : mission.taux < 70 ? 'text-orange-900' : 'text-amber-900';
                const badgeColor = mission.taux < 60 ? 'bg-red-100 text-red-800' : mission.taux < 70 ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800';
                
                return (
                  <div key={mission.mission} className={`${bgColor} border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`}>
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 text-sm leading-tight flex-1 pr-2">
                        {mission.mission}
                      </h4>
                      <span className={`${badgeColor} px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap`}>
                        {mission.taux}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Postes vacants:</span>
                        <span className={`text-sm font-bold ${textColor}`}>
                          {postesVacants} poste{postesVacants > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Effectif actuel:</span>
                        <span className="text-sm font-semibold text-gray-700">
                          {mission.effectif} agent{mission.effectif > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <span className={`text-xs font-medium ${textColor}`}>
                          Criticité: {criticite}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-semibold">
              ✓ Toutes les missions sont correctement dotées
            </p>
          </div>
        )}
      </div>
    </div>
  );
}