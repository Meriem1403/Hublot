import { Users, UserCheck, AlertCircle, TrendingUp, Briefcase, BarChart3, Zap } from 'lucide-react';
import { useOverviewStats, useTempsTravail, useAgentsData } from '../hooks/useAgentsData';

export function OverviewCards() {
  const overviewStats = useOverviewStats();
  const tempsTravail = useTempsTravail();
  const agents = useAgentsData();
  
  const stats = [
    {
      label: 'Effectifs totaux',
      value: overviewStats.effectifsTotaux.toString(),
      subtext: 'agents en poste',
      icon: Users,
      color: 'blue',
      trend: 'Données actualisées'
    },
    {
      label: 'Postes pourvus',
      value: `${Math.round(overviewStats.tauxPourvu)}%`,
      subtext: `${overviewStats.postesPourvus} / ${overviewStats.postesPourvus + Math.max(0, overviewStats.postesVacants)} postes`,
      icon: UserCheck,
      color: 'green',
      trend: overviewStats.tauxPourvu >= 90 ? 'Taux excellent' : overviewStats.tauxPourvu >= 85 ? 'Taux stable' : overviewStats.tauxPourvu >= 70 ? 'Taux correct' : 'À améliorer'
    },
    {
      label: 'Postes vacants',
      value: Math.max(0, overviewStats.postesVacants).toString(),
      subtext: overviewStats.postesVacants > 0 
        ? `${Math.round((overviewStats.postesVacants / (overviewStats.postesPourvus + overviewStats.postesVacants)) * 100)}% des effectifs`
        : 'Tous les postes pourvus',
      icon: AlertCircle,
      color: 'orange',
      trend: overviewStats.postesVacants > 0 ? 'À pourvoir rapidement' : 'Tous les postes pourvus'
    },
    {
      label: 'Départs prévus 2025',
      value: overviewStats.departsPrevu2025.toString(),
      subtext: 'estimations retraites et fin CDD',
      icon: TrendingUp,
      color: 'purple',
      trend: overviewStats.effectifsTotaux > 0 
        ? `${Math.round((overviewStats.departsPrevu2025 / overviewStats.effectifsTotaux) * 100)}% de leffectif`
        : '0% de leffectif'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">Vue d'ensemble des effectifs</h2>
        <p className="text-gray-600">
          Indicateurs clés pour évaluer la disponibilité et la stabilité des équipes
        </p>
      </div>

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-blue-900" />
            <h3 className="text-lg text-blue-900">Taux de présence</h3>
          </div>
          {(() => {
            const agentsActifs = agents.filter(a => a.actif);
            const totalAgents = agentsActifs.length;
            const totalAbsents = tempsTravail.details.conges.count + tempsTravail.details.maladie.count + tempsTravail.details.formation.count;
            const agentsPresents = totalAgents - totalAbsents;
            
            return (
              <>
                <div className="mb-4">
                  <div className="flex items-baseline gap-2 mb-2">
                    <p className="text-3xl font-bold text-blue-900">{agentsPresents}</p>
                    <p className="text-lg text-blue-700">agents présents</p>
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-3xl font-bold text-blue-900">{totalAbsents}</p>
                    <p className="text-lg text-blue-700">agents absents</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 border border-blue-200 mb-3">
                    <p className="text-sm text-blue-800 font-semibold mb-1">Taux de présence</p>
                    <p className="text-lg text-blue-900 mb-2">
                      <strong>{tempsTravail.tauxPresence.toFixed(1)}%</strong> des agents sont présents
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      ({agentsPresents} ÷ {totalAgents} × 100)
                    </p>
                  </div>
                </div>
                {totalAbsents > 0 ? (
                  <div className="bg-white/60 rounded-lg p-3 border border-blue-200">
                    <p className="text-sm text-blue-800 font-semibold mb-2">Répartition des absences</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">Congés:</span>
                        <span className="text-blue-900 font-semibold">
                          {tempsTravail.details.conges.count} ({tempsTravail.details.conges.pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">Maladie:</span>
                        <span className="text-blue-900 font-semibold">
                          {tempsTravail.details.maladie.count} ({tempsTravail.details.maladie.pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">Formation:</span>
                        <span className="text-blue-900 font-semibold">
                          {tempsTravail.details.formation.count} ({tempsTravail.details.formation.pct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/60 rounded-lg p-3 border border-blue-200">
                    <p className="text-sm text-blue-700">Aucune absence enregistrée dans les données</p>
                  </div>
                )}
              </>
            );
          })()}
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

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-orange-900" />
            <h3 className="text-lg text-orange-900">Tension RH</h3>
          </div>
          {overviewStats.postesVacants > 0 ? (
            <>
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-3xl font-bold text-orange-900">{overviewStats.postesPourvus}</p>
                  <p className="text-lg text-orange-700">postes pourvus</p>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-3xl font-bold text-orange-900">{overviewStats.postesVacants}</p>
                  <p className="text-lg text-orange-700">postes vacants</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3 border border-orange-200">
                  <p className="text-sm text-orange-800 font-semibold mb-1">Taux de postes vacants</p>
                  <p className="text-lg text-orange-900 mb-2">
                    <strong>{overviewStats.tauxVacants.toFixed(1)}%</strong> des postes sont à pourvoir
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    ({overviewStats.postesVacants} ÷ {overviewStats.postesPourvus + overviewStats.postesVacants} × 100)
                  </p>
                </div>
              </div>
              <div className="bg-white/60 rounded-lg p-3 border border-orange-200">
                <p className="text-sm text-orange-800 font-semibold mb-1">Niveau de tension</p>
                <p className="text-lg font-bold text-orange-900 mb-1">{overviewStats.tensionRH}</p>
                <p className="text-xs text-orange-600">
                  {overviewStats.tensionRH === 'Élevée' && 'Plus de 15% de postes vacants - Recrutement urgent nécessaire'}
                  {overviewStats.tensionRH === 'Modérée' && 'Entre 10% et 15% de postes vacants - Recrutement à planifier'}
                  {overviewStats.tensionRH === 'Faible' && 'Moins de 10% de postes vacants - Situation stable'}
                </p>
              </div>
            </>
          ) : (
            <div className="bg-white/60 rounded-lg p-3 border border-orange-200">
              <p className="text-lg text-orange-900 font-semibold mb-1">Situation stable</p>
              <p className="text-sm text-orange-700">
                Tous les postes sont pourvus ({overviewStats.postesPourvus} postes)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}