import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle, Lightbulb } from 'lucide-react';
import { useResponsabiliteRepartition, useAgentsData } from '../hooks/useAgentsData';

export function ResponsibilityPyramid() {
  const repartition = useResponsabiliteRepartition();
  const agents = useAgentsData();
  const total = agents.filter(a => a.actif).length;
  
  // Mapper les données avec les couleurs et exemples
  const levels = repartition.map(item => {
    let color = 'from-green-500 to-green-600';
    if (item.niveau === 'Direction') {
      color = 'from-purple-500 to-purple-600';
    } else if (item.niveau === 'Encadrement') {
      color = 'from-blue-500 to-blue-600';
    }
    
    return {
      level: item.niveau,
      count: item.nombre,
      percent: Math.round(item.pourcentage * 10) / 10,
      examples: item.exemples,
      color
    };
  });
  
  // Calculer les ratios
  const direction = repartition.find(r => r.niveau === 'Direction')?.nombre || 0;
  const encadrement = repartition.find(r => r.niveau === 'Encadrement')?.nombre || 0;
  const operationnel = repartition.find(r => r.niveau === 'Opérationnel')?.nombre || 0;
  
  const ratioDirection = direction > 0 ? `1:${Math.round(total / direction)}` : '1:0';
  const ratioEncadrement = encadrement > 0 ? `1:${Math.round(operationnel / encadrement)}` : '1:0';

  // Calculer la répartition par niveau de responsabilité pour TOUS les services
  const agentsActifs = agents.filter(a => a.actif);
  const servicesMap: Record<string, { service: string; direction: number; encadrement: number; operationnel: number; total: number }> = {};

  agentsActifs.forEach(agent => {
    const serviceName = agent.service || 'Non renseigné';
    if (!servicesMap[serviceName]) {
      servicesMap[serviceName] = {
        service: serviceName,
        direction: 0,
        encadrement: 0,
        operationnel: 0,
        total: 0
      };
    }

    const s = servicesMap[serviceName];
    s.total += 1;

    if (agent.niveauResponsabilite === 'Direction') {
      s.direction += 1;
    } else if (agent.niveauResponsabilite === 'Encadrement') {
      s.encadrement += 1;
    } else {
      // Par défaut, considérer comme opérationnel
      s.operationnel += 1;
    }
  });

  const servicesLevels = Object.values(servicesMap)
    .map(s => ({
      ...s,
      pctDirection: s.total > 0 ? Math.round((s.direction / s.total) * 1000) / 10 : 0,
      pctEncadrement: s.total > 0 ? Math.round((s.encadrement / s.total) * 1000) / 10 : 0,
      pctOperationnel: s.total > 0 ? Math.round((s.operationnel / s.total) * 1000) / 10 : 0
    }))
    // Trier par taille de service (du plus grand au plus petit)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">Niveaux de responsabilité</h2>
        <p className="text-gray-600">
          Analyse de l'équilibre entre encadrement et agents opérationnels
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pyramid Visual */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="mb-6">Pyramide hiérarchique</h3>
          
          <div className="space-y-3">
            {levels.map((level, index) => {
              const width = 30 + (index * 35); // Progressive width
              return (
                <div key={level.level} className="flex flex-col items-center">
                  <div
                    className={`bg-gradient-to-r ${level.color} text-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer w-full`}
                    style={{ maxWidth: `${width}%` }}
                  >
                    <div className="text-center">
                      <p className="text-sm opacity-90 mb-1">{level.level}</p>
                      <p className="text-4xl mb-1">{level.count}</p>
                      <p className="text-sm opacity-90">agents • {level.percent}%</p>
                      <p className="text-xs opacity-75 mt-3 border-t border-white/20 pt-3">
                        {level.examples}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="mb-3">Ratios clés</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Direction / Total</p>
                <p className="text-2xl text-gray-900">{ratioDirection}</p>
                <p className="text-xs text-gray-500">{direction} directeurs pour {total} agents</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Encadrement / Opérationnel</p>
                <p className="text-2xl text-gray-900">{ratioEncadrement}</p>
                <p className="text-xs text-gray-500">{encadrement} encadrants pour {operationnel} agents</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h3 className="mb-4">Analyse de l'équilibre</h3>
            
            <div className="space-y-4">
              {repartition.map((item) => {
                const levelData = levels.find(l => l.level === item.niveau);
                if (!levelData) return null;
                
                const getClasses = (niveau: string) => {
                  if (niveau === 'Direction') {
                    return {
                      bg: 'bg-purple-50',
                      border: 'border-purple-200',
                      text: 'text-purple-900',
                      textLight: 'text-purple-800'
                    };
                  } else if (niveau === 'Encadrement') {
                    return {
                      bg: 'bg-blue-50',
                      border: 'border-blue-200',
                      text: 'text-blue-900',
                      textLight: 'text-blue-800'
                    };
                  } else {
                    return {
                      bg: 'bg-green-50',
                      border: 'border-green-200',
                      text: 'text-green-900',
                      textLight: 'text-green-800'
                    };
                  }
                };
                
                const classes = getClasses(item.niveau);
                const ratioValue = item.niveau === 'Encadrement' ? parseFloat(ratioEncadrement.split(':')[1]) : null;
                
                return (
                  <div key={item.niveau} className={`p-4 ${classes.bg} rounded-lg border ${classes.border}`}>
                    <h4 className={`${classes.text} mb-2`}>
                      {item.niveau} ({levelData.percent}%)
                    </h4>
                    <p className={`text-sm ${classes.textLight}`}>
                      {item.niveau === 'Direction' && `Effectif cohérent pour une structure de cette taille. Ratio ${ratioDirection} conforme aux standards.`}
                      {item.niveau === 'Encadrement' && `Bon équilibre. Ratio ${ratioEncadrement}, ${ratioValue !== null && ratioValue >= 6 && ratioValue <= 8 ? 'conforme' : 'à ajuster'} à la cible (1:6-8).`}
                      {item.niveau === 'Opérationnel' && `Base opérationnelle solide. Permet une bonne capacité d'action sur le terrain.`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-900" />
              <h3 className="text-lg text-green-900">Équilibre satisfaisant</h3>
            </div>
            <p className="text-sm text-green-900">
              La pyramide est bien proportionnée avec une base opérationnelle large 
              et un encadrement adapté.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-blue-900" />
              <h3 className="text-lg text-blue-900">Perspective</h3>
            </div>
            <p className="text-sm text-blue-900">
              {encadrement > 0 ? 
                `Prévoir le renouvellement de ${Math.max(1, Math.round(encadrement * 0.15))} postes d'encadrement d'ici 2026 (départs en retraite).` :
                'Surveiller les besoins en encadrement.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Comparaison avec les standards de la fonction publique */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="mb-4">Comparaison avec les standards de la fonction publique</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* DIRM Méditerranée (valeurs calculées) */}
          <div className="text-center">
            <p className="text-gray-600 mb-2">DIRM Méditerranée</p>
            <div className="flex justify-center gap-2">
              {levels.map((level) => {
                const getColorClass = (niveau: string) => {
                  if (niveau === 'Direction') return 'bg-purple-500';
                  if (niveau === 'Encadrement') return 'bg-blue-500';
                  return 'bg-green-500';
                };
                return (
                  <div key={level.level} className="text-sm">
                    <div className={`${getColorClass(level.level)} text-white px-3 py-1 rounded`}>{level.percent}%</div>
                    <p className="text-xs text-gray-500 mt-1">{level.level}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Moyenne DIRM (référence fixe) */}
          <div className="text-center">
            <p className="text-gray-600 mb-2">Moyenne DIRM</p>
            <div className="flex justify-center gap-2">
              <div className="text-sm">
                <div className="bg-purple-400 text-white px-3 py-1 rounded">4%</div>
                <p className="text-xs text-gray-500 mt-1">Direction</p>
              </div>
              <div className="text-sm">
                <div className="bg-blue-400 text-white px-3 py-1 rounded">15%</div>
                <p className="text-xs text-gray-500 mt-1">Encadrement</p>
              </div>
              <div className="text-sm">
                <div className="bg-green-400 text-white px-3 py-1 rounded">81%</div>
                <p className="text-xs text-gray-500 mt-1">Opérationnel</p>
              </div>
            </div>
          </div>

          {/* Cible optimale (référence fixe) */}
          <div className="text-center">
            <p className="text-gray-600 mb-2">Cible optimale</p>
            <div className="flex justify-center gap-2">
              <div className="text-sm">
                <div className="bg-purple-300 text-gray-800 px-3 py-1 rounded">3-5%</div>
                <p className="text-xs text-gray-500 mt-1">Direction</p>
              </div>
              <div className="text-sm">
                <div className="bg-blue-300 text-gray-800 px-3 py-1 rounded">12-18%</div>
                <p className="text-xs text-gray-500 mt-1">Encadrement</p>
              </div>
              <div className="text-sm">
                <div className="bg-green-300 text-gray-800 px-3 py-1 rounded">77-85%</div>
                <p className="text-xs text-gray-500 mt-1">Opérationnel</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparaison par service */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="mb-4">Répartition des responsabilités par service</h3>
        <p className="text-sm text-gray-600 mb-4">
          Vue détaillée de tous les services&nbsp;: part de la Direction, de l'Encadrement et des agents Opérationnels
          dans chaque entité (DDTM, DIRM, etc.).
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-semibold text-gray-700">Service</th>
                <th className="text-right py-2 px-2 font-semibold text-purple-700">Direction</th>
                <th className="text-right py-2 px-2 font-semibold text-blue-700">Encadrement</th>
                <th className="text-right py-2 px-2 font-semibold text-green-700">Opérationnel</th>
                <th className="text-right py-2 pl-2 font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {servicesLevels.map((s, idx) => (
                <tr key={s.service} className={idx % 2 === 0 ? 'bg-gray-50/50' : ''}>
                  <td className="py-1.5 pr-4 text-gray-900">{s.service}</td>
                  <td className="py-1.5 px-2 text-right text-purple-900">
                    {s.pctDirection}% <span className="text-xs text-gray-500">({s.direction})</span>
                  </td>
                  <td className="py-1.5 px-2 text-right text-blue-900">
                    {s.pctEncadrement}% <span className="text-xs text-gray-500">({s.encadrement})</span>
                  </td>
                  <td className="py-1.5 px-2 text-right text-green-900">
                    {s.pctOperationnel}% <span className="text-xs text-gray-500">({s.operationnel})</span>
                  </td>
                  <td className="py-1.5 pl-2 text-right text-gray-900 font-medium">
                    {s.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}