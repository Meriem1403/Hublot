import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Calendar, Lightbulb, BarChart3, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAgeRepartition, useAgeIndicateurs } from '../hooks/useAgentsData';
import { MethodologyDialog } from './MethodologyDialog';

export function AgeChart() {
  const data = useAgeRepartition();
  const indicateurs = useAgeIndicateurs();

  const totalEffectif = data.reduce((sum, d) => sum + d.effectif, 0);
  const pctJeunes = totalEffectif > 0 ? Math.round((indicateurs.jeunesMoins35 / totalEffectif) * 1000) / 10 : 0;
  const pctCoeur = totalEffectif > 0 ? Math.round((indicateurs.coeur35_54 / totalEffectif) * 1000) / 10 : 0;
  const pctSeniors = totalEffectif > 0 ? Math.round((indicateurs.seniorsPlus55 / totalEffectif) * 1000) / 10 : 0;

  const getColor = (tranche: string) => {
    if (tranche.includes('55') || tranche.includes('60') || tranche.includes('65')) {
      return '#f59e0b'; // orange - départs proches
    }
    if (tranche.includes('25') || tranche.includes('30')) {
      return '#10b981'; // green - jeunes
    }
    return '#3b82f6'; // blue - normal
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl mb-2">Répartition par âge</h2>
          <p className="text-gray-600">
            Analyse démographique pour anticiper les départs et planifier le renouvellement
          </p>
        </div>
        <MethodologyDialog
          title="Méthodologie — Répartition par âge"
          intro="Âges calculés à partir des dates de naissance des agents."
          sections={[
            {
              title: 'Sources',
              bullets: [
                'Date de naissance (Excel).',
                'Découpage en tranches d’âge via règles de calcul internes.'
              ]
            },
            {
              title: 'Calculs affichés',
              bullets: [
                'Âge = année courante - année de naissance (ajusté selon date).',
                'Comptage des agents par tranche.',
                'Indicateurs jeunes/coeur/seniors dérivés des tranches réelles.'
              ]
            }
          ]}
        />
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tranche" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                      <p className="mb-2">{data.tranche}</p>
                      <p className="text-blue-600">Total: {data.effectif} agents</p>
                      <p className="text-gray-600">Hommes: {data.hommes}</p>
                      <p className="text-gray-600">Femmes: {data.femmes}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="effectif" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.tranche)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-900">{'<'} 35 ans (Jeunes)</p>
            <p className="text-3xl text-green-900">{indicateurs.jeunesMoins35}</p>
            <p className="text-sm text-green-700">
              {pctJeunes}% de l'effectif
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-900">35-54 ans (Cœur)</p>
            <p className="text-3xl text-blue-900">{indicateurs.coeur35_54}</p>
            <p className="text-sm text-blue-700">
              {pctCoeur}% de l'effectif
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-orange-900">≥ 55 ans (Seniors)</p>
            <p className="text-3xl text-orange-900">{indicateurs.seniorsPlus55}</p>
            <p className="text-sm text-orange-700">
              {pctSeniors}% de l'effectif
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="mb-4">Indicateurs démographiques</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-900">Âge moyen</span>
              <span className="text-2xl text-gray-900">{indicateurs.ageMoyen} ans</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-900">Âge médian</span>
              <span className="text-2xl text-gray-900">{indicateurs.ageMedian} ans</span>
            </div>
            {indicateurs.ageMoyenRecrutement > 0 && (
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-blue-900">Âge moyen de recrutement</span>
                <span className="text-2xl text-blue-900">{indicateurs.ageMoyenRecrutement} ans</span>
              </div>
            )}
            {indicateurs.ageMoyenDepart > 0 && (
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-orange-900">Âge moyen de départ</span>
                <span className="text-2xl text-orange-900">{indicateurs.ageMoyenDepart} ans</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-green-900" />
              <h3 className="text-lg text-green-900">Lecture démographique</h3>
            </div>
            <p className="text-sm text-green-900">
              La pyramide des âges montre {pctJeunes}% de jeunes agents (&lt; 35 ans), {pctCoeur}% d'agents au
              cœur de carrière (35-54 ans) et {pctSeniors}% de seniors (≥ 55 ans). Ces indicateurs sont calculés
              directement à partir des dates de naissance présentes dans les données.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-blue-900" />
          <h3 className="text-lg text-blue-900">Analyse de la pyramide des âges</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-blue-900 mb-2">Points positifs</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-center gap-1"><Check className="w-3 h-3" /> {pctJeunes}% de jeunes agents (&lt; 35 ans)</li>
              <li className="flex items-center gap-1"><Check className="w-3 h-3" /> {pctCoeur}% d'agents 35-54 ans (cœur de compétences)</li>
              <li className="flex items-center gap-1"><Check className="w-3 h-3" /> Renouvellement progressif possible</li>
            </ul>
          </div>
          <div>
            <h4 className="text-blue-900 mb-2">Points de vigilance</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {pctSeniors}% de seniors (≥ 55 ans)</li>
              <li className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {indicateurs.seniorsPlus55} agents de 55 ans et plus</li>
              <li className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Risque perte de compétences clés</li>
            </ul>
          </div>
          <div>
            <h4 className="text-blue-900 mb-2">Actions 2025</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Utiliser ces indicateurs pour dimensionner les recrutements et la transmission de compétences</li>
              <li className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Cibler en priorité les métiers / services où les seniors sont très nombreux</li>
              <li className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Suivre régulièrement l'évolution de la pyramide des âges</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}