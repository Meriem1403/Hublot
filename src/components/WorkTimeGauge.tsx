import { useMemo } from 'react';
import { CheckCircle, Lightbulb, BarChart3 } from 'lucide-react';
import { useAgentsData } from '../hooks/useAgentsData';
import { MethodologyDialog } from './MethodologyDialog';

export function WorkTimeGauge() {
  const agents = useAgentsData();
  const stats = useMemo(() => {
    const actifs = agents.filter((a) => a.actif);
    const avecTemps = actifs.filter((a) => a.tempsTravailRenseigne !== false);
    const nonRenseigne = actifs.length - avecTemps.length;

    const tempsPleinAgents = avecTemps.filter((a) => a.contratType === 'Temps plein');
    const tempsPartielAgents = avecTemps.filter((a) => a.contratType === 'Temps partiel');

    const etpTempsPlein = tempsPleinAgents.length;
    const etpTempsPartiel = tempsPartielAgents.reduce((sum, a) => {
      if (typeof a.tempsPartielPourcentage === 'number') return sum + (a.tempsPartielPourcentage / 100);
      return sum + (typeof a.etp === 'number' ? a.etp : 0);
    }, 0);
    const etpTotal = etpTempsPlein + etpTempsPartiel;
    const base = avecTemps.length || 1;
    const moyennePartiel = tempsPartielAgents.length > 0
      ? tempsPartielAgents.reduce((sum, a) => {
          if (typeof a.tempsPartielPourcentage === 'number') return sum + a.tempsPartielPourcentage;
          return sum + Math.round(((typeof a.etp === 'number' ? a.etp : 0) * 100));
        }, 0) / tempsPartielAgents.length
      : 0;

    return {
      totalActifs: actifs.length,
      totalRenseigne: avecTemps.length,
      nonRenseigne,
      tempsPleinCount: tempsPleinAgents.length,
      tempsPartielCount: tempsPartielAgents.length,
      tempsPleinPct: (tempsPleinAgents.length / base) * 100,
      tempsPartielPct: (tempsPartielAgents.length / base) * 100,
      etpTempsPlein,
      etpTempsPartiel,
      etpTotal,
      disponibiliteETP: (etpTotal / base) * 100,
      moyennePartiel: Math.round(moyennePartiel)
    };
  }, [agents]);

  const indicators = [
    {
      label: 'Taux temps plein',
      value: Math.round(stats.tempsPleinPct * 10) / 10,
      color: 'green'
    },
    {
      label: 'Disponibilité ETP',
      value: Math.round(stats.disponibiliteETP * 10) / 10,
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: { bg: string; border: string; text: string; gauge: string } } = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', gauge: 'bg-blue-500' },
      green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', gauge: 'bg-green-500' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', gauge: 'bg-purple-500' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', gauge: 'bg-orange-500' }
    };
    return colors[color];
  };

  const Gauge = ({ value, color }: { value: number; color: string }) => {
    const percent = value;
    
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
            Valeur observée
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
            Analyse des quotités de travail réellement renseignées dans l'Excel
          </p>
        </div>
        <MethodologyDialog
          title="Méthodologie — Temps de travail et disponibilité"
          intro="Indicateurs calculés uniquement à partir du champ Excel `Temps de travail`."
          sections={[
            {
              title: 'Sources',
              bullets: [
                'Colonne Excel `Temps de travail` (quotité en %).',
                'Champ `actif` : seuls les agents actifs sont considérés.',
                'Aucune colonne d’absence n’est utilisée dans cet onglet.'
              ]
            },
            {
              title: 'Calculs affichés',
              bullets: [
                'Base commune: filtres globaux appliqués, puis agents `actif = true`.',
                'On distingue les agents avec `Temps de travail` renseigné et non renseigné.',
                'Temps plein = quotité = 100 ; Temps partiel = quotité < 100.',
                'Les lignes sans quotité sont comptabilisées dans "Temps de travail non renseigné".',
                'ETP partiel = somme(quotité/100) ; ETP plein = nombre de temps plein.',
                'Disponibilité ETP = (ETP total / effectif avec temps renseigné) x 100.',
                'Aucune cible externe, aucune absence synthétique, aucune projection.'
              ]
            }
          ]}
        />
      </div>

      {/* Main Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                color={indicator.color}
              />
              <p className="text-center text-sm text-gray-600 mt-2 flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Calculé depuis les données Excel</span>
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
                <span className="text-2xl text-blue-900">{stats.tempsPleinCount}</span>
              </div>
              <p className="text-sm text-blue-800">
                = {Math.round(stats.etpTempsPlein)} ETP • {(Math.round(stats.tempsPleinPct * 10) / 10).toFixed(1)}% de la base renseignée
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-green-900">Temps partiel (moy. {stats.moyennePartiel}%)</span>
                <span className="text-2xl text-green-900">{stats.tempsPartielCount}</span>
              </div>
              <p className="text-sm text-green-800">
                = {stats.etpTempsPartiel.toFixed(1)} ETP • {(Math.round(stats.tempsPartielPct * 10) / 10).toFixed(1)}% de la base renseignée
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-purple-900">Capacité totale (ETP)</span>
                <span className="text-2xl text-purple-900">{stats.etpTotal.toFixed(1)}</span>
              </div>
              <p className="text-sm text-purple-800">
                Sur {stats.totalRenseigne} agents renseignés (sur {stats.totalActifs}) • Disponibilité: {(Math.round(stats.disponibiliteETP * 10) / 10).toFixed(1)}%
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-900">Temps de travail non renseigné</span>
                <span className="text-2xl text-gray-900">{stats.nonRenseigne}</span>
              </div>
              <p className="text-sm text-gray-700">
                {stats.totalActifs > 0 ? ((stats.nonRenseigne / stats.totalActifs) * 100).toFixed(1) : '0.0'}% des agents actifs.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="mb-4">Lecture des indicateurs</h3>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-blue-900" />
              <p className="text-sm text-blue-900">
                Les pourcentages de cet onglet sont calculés sur la base des agents avec
                `Temps de travail` renseigné ({stats.totalRenseigne}/{stats.totalActifs}).
              </p>
            </div>
            <p className="text-sm text-blue-900">
              Les lignes sans quotité sont comptabilisées séparément dans la catégorie
              "Temps de travail non renseigné".
            </p>
          </div>
        </div>
      </div>

      {/* Analyse factuelle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-900" />
            <h3 className="text-lg text-green-900">Synthèse factuelle</h3>
          </div>
          <ul className="text-sm text-green-900 space-y-2">
            <li>• Base renseignée: {stats.totalRenseigne} agents sur {stats.totalActifs} actifs.</li>
            <li>• Temps plein: {stats.tempsPleinCount} agents ({(Math.round(stats.tempsPleinPct * 10) / 10).toFixed(1)}%).</li>
            <li>• Temps partiel: {stats.tempsPartielCount} agents ({(Math.round(stats.tempsPartielPct * 10) / 10).toFixed(1)}%).</li>
            <li>• Disponibilité ETP: {(Math.round(stats.disponibiliteETP * 10) / 10).toFixed(1)}%.</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-blue-900" />
            <h3 className="text-lg text-blue-900">Traçabilité</h3>
          </div>
          <p className="text-sm text-blue-900">
            L'onglet n'utilise pas de benchmark externe, pas de cible normative et
            pas de motifs d'absence synthétiques. Les chiffres proviennent uniquement
            du champ Excel `Temps de travail` et des agents actifs après filtres.
          </p>
        </div>
      </div>
    </div>
  );
}