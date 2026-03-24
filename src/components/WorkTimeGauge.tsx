import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CheckCircle, AlertTriangle, Lightbulb, BarChart3 } from 'lucide-react';
import { useTempsTravail, useAgentsData } from '../hooks/useAgentsData';
import { MethodologyDialog } from './MethodologyDialog';

export function WorkTimeGauge() {
  const tempsTravail = useTempsTravail();
  const agents = useAgentsData();
  const total = agents.filter(a => a.actif).length;
  
  const indicators = [
    {
      label: 'Taux de présence',
      value: tempsTravail.tauxPresence,
      target: 95,
      color: 'blue',
      status: tempsTravail.tauxPresence >= 95 ? 'good' : 'warning'
    },
    {
      label: 'Taux temps plein',
      value: tempsTravail.tauxTempsPlein,
      target: 85,
      color: 'green',
      status: tempsTravail.tauxTempsPlein >= 85 ? 'good' : 'warning'
    },
    {
      label: 'Disponibilité ETP',
      value: tempsTravail.disponibiliteETP,
      target: 90,
      color: 'purple',
      status: tempsTravail.disponibiliteETP >= 90 ? 'good' : 'warning'
    },
    {
      label: 'Absentéisme',
      value: tempsTravail.absentéisme,
      target: 6,
      color: 'orange',
      status: tempsTravail.absentéisme <= 6 ? 'good' : 'warning',
      inverted: true
    }
  ];

  const details = tempsTravail.details;
  const capaciteETP = agents.filter(a => a.actif).reduce((sum, a) => sum + a.etp, 0);

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: { bg: string; border: string; text: string; gauge: string } } = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', gauge: 'bg-blue-500' },
      green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', gauge: 'bg-green-500' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', gauge: 'bg-purple-500' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', gauge: 'bg-orange-500' }
    };
    return colors[color];
  };

  const Gauge = ({ value, target, color, inverted = false }: { value: number; target: number; color: string; inverted?: boolean }) => {
    const percent = inverted ? 100 - value : value;
    const colorClasses = getColorClasses(color);
    
    return (
      <div className="relative">
        <svg viewBox="0 0 200 120" className="w-full">
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="20"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : color === 'purple' ? '#8b5cf6' : '#f59e0b'}
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray={`${(percent / 100) * 251.2} 251.2`}
            className="transition-all duration-1000"
          />
          {/* Value text */}
          <text
            x="100"
            y="80"
            textAnchor="middle"
            className="text-3xl fill-gray-900"
          >
            {value}%
          </text>
          <text
            x="100"
            y="100"
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            Cible: {target}%
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl mb-2">Temps de travail et disponibilité</h2>
          <p className="text-gray-600">
            Analyse de la disponibilité réelle des équipes et des absences
          </p>
        </div>
        <MethodologyDialog
          title="Méthodologie — Temps de travail et disponibilité"
          intro="Indicateurs agrégés sur les champs de temps de travail et présence."
          sections={[
            {
              title: 'Sources',
              bullets: [
                'Temps de travail (Excel): temps plein / temps partiel.',
                'Statuts de présence/absence disponibles dans les données agents.'
              ]
            },
            {
              title: 'Calculs affichés',
              bullets: [
                'Taux = nombre catégorie / total filtré x 100.',
                'Disponibilité ETP dérivée des équivalents temps plein effectifs.',
                'Aucune absence synthétique générée à l’affichage.'
              ]
            }
          ]}
        />
      </div>

      {/* Main Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {indicators.map((indicator, index) => {
          const colorClasses = getColorClasses(indicator.color);
          return (
            <div
              key={index}
              className={`${colorClasses.bg} border ${colorClasses.border} rounded-xl p-6`}
            >
              <h3 className={`${colorClasses.text} text-center mb-4`}>
                {indicator.label}
              </h3>
              <Gauge
                value={indicator.value}
                target={indicator.target}
                color={indicator.color}
                inverted={indicator.inverted}
              />
              <p className="text-center text-sm text-gray-600 mt-2 flex items-center justify-center gap-1">
                {indicator.status === 'good' ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Objectif atteint</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 text-orange-600" />
                    <span>Amélioration nécessaire</span>
                  </>
                )}
              </p>
            </div>
          );
        })}
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="mb-4">Répartition du temps de travail</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-blue-900">Temps plein (100%)</span>
                <span className="text-2xl text-blue-900">{details.tempsPlein.count}</span>
              </div>
              <p className="text-sm text-blue-800">
                = {Math.round(details.tempsPlein.etp)} ETP • {details.tempsPlein.pct.toFixed(1)}% de l'effectif
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-green-900">Temps partiel (moy. {details.tempsPartiel.moyennePct}%)</span>
                <span className="text-2xl text-green-900">{details.tempsPartiel.count}</span>
              </div>
              <p className="text-sm text-green-800">
                = {details.tempsPartiel.etp.toFixed(1)} ETP • {details.tempsPartiel.pct.toFixed(1)}% de l'effectif
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-purple-900">Capacité totale (ETP)</span>
                <span className="text-2xl text-purple-900">{Math.round(capaciteETP)}</span>
              </div>
              <p className="text-sm text-purple-800">
                Sur {total} agents • Disponibilité: {tempsTravail.disponibiliteETP.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="mb-4">Motifs d'absence</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-12 bg-blue-500 rounded" />
                <div>
                  <p className="text-gray-900">Congés annuels</p>
                  <p className="text-sm text-gray-600">{details.conges.count} agents</p>
                </div>
              </div>
              <span className="text-xl text-gray-900">{details.conges.pct.toFixed(1)}%</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-12 bg-orange-500 rounded" />
                <div>
                  <p className="text-gray-900">Arrêts maladie</p>
                  <p className="text-sm text-gray-600">{details.maladie.count} agents</p>
                </div>
              </div>
              <span className="text-xl text-gray-900">{details.maladie.pct.toFixed(1)}%</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-12 bg-green-500 rounded" />
                <div>
                  <p className="text-gray-900">Formation</p>
                  <p className="text-sm text-gray-600">{details.formation.count} agents</p>
                </div>
              </div>
              <span className="text-xl text-gray-900">{details.formation.pct.toFixed(1)}%</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-blue-900" />
              <p className="text-sm text-blue-900">
                Total absences : {details.conges.count + details.maladie.count + details.formation.count} agents 
                ({(details.conges.pct + details.maladie.pct + details.formation.pct).toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trends and Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-900" />
            <h3 className="text-lg text-green-900">Points positifs</h3>
          </div>
          <ul className="text-sm text-green-900 space-y-2">
            <li>• Taux de présence : {tempsTravail.tauxPresence.toFixed(1)}%</li>
            <li>• Absentéisme : {tempsTravail.absentéisme.toFixed(1)}%</li>
            <li>• Disponibilité ETP : {tempsTravail.disponibiliteETP.toFixed(1)}%</li>
            <li>• Temps partiel : {details.tempsPartiel.count} agents ({details.tempsPartiel.pct.toFixed(1)}%)</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-blue-900" />
            <h3 className="text-lg text-blue-900">Comparaisons</h3>
          </div>
          <ul className="text-sm text-blue-900 space-y-2">
            <li>• DIRM Méditerranée : {tempsTravail.absentéisme.toFixed(1)}% d'absences</li>
            <li>• Dont congés : {details.conges.pct.toFixed(1)}%</li>
            <li>• Dont arrêts maladie : {details.maladie.pct.toFixed(1)}%</li>
            <li>• Dont formation : {details.formation.pct.toFixed(1)}%</li>
          </ul>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-orange-900" />
            <h3 className="text-lg text-orange-900">Recommandations</h3>
          </div>
          <ul className="text-sm text-orange-900 space-y-2">
            <li>• Maintenir actions QVT</li>
            <li>• Surveiller arrêts maladie longs</li>
            <li>• Faciliter accès temps partiel</li>
            <li>• Renforcer prévention santé</li>
          </ul>
        </div>
      </div>
    </div>
  );
}