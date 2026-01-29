import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AlertTriangle, BarChart3, Target, Check, ArrowRight } from 'lucide-react';
import { useGenreRepartition, useGenreParService, useGenreParNiveau } from '../hooks/useAgentsData';

export function GenderDonut() {
  const globalData = useGenreRepartition();
  const byService = useGenreParService();
  const byLevel = useGenreParNiveau();
  
  // Formater les données pour le graphique
  const formattedGlobalData = globalData.map(item => ({
    name: item.genre,
    value: item.nombre,
    percent: Math.round(item.pourcentage * 10) / 10
  }));

  const totalGlobal = formattedGlobalData.reduce((sum, d) => sum + d.value, 0);
  const hommesGlobal = formattedGlobalData.find(d => d.name === 'Hommes');
  const femmesGlobal = formattedGlobalData.find(d => d.name === 'Femmes');
  const pctHommesGlobal = hommesGlobal?.percent || 0;
  const pctFemmesGlobal = femmesGlobal?.percent || 0;

  // Préparer des stats agrégées par niveau hiérarchique
  const directionLevel = byLevel.find(l => l.level === 'Direction');
  const directionTotal = directionLevel ? directionLevel.hommes + directionLevel.femmes : 0;
  const directionFemmesPct = directionTotal > 0 ? Math.round((directionLevel!.femmes / directionTotal) * 1000) / 10 : 0;

  // Préparer des stats agrégées par service pour l'analyse générale
  const servicesWithPct = byService.map(s => {
    const total = s.totalService || 0;
    const pctH = total > 0 ? (s.hommes / total) * 100 : 0;
    const pctF = total > 0 ? (s.femmes / total) * 100 : 0;
    return { ...s, pctH, pctF };
  });
  const mostFemService = servicesWithPct
    .filter(s => s.totalService > 0)
    .sort((a, b) => b.pctF - a.pctF)[0];
  const mostMaleService = servicesWithPct
    .filter(s => s.totalService > 0)
    .sort((a, b) => b.pctH - a.pctH)[0];
  const balancedServices = servicesWithPct.filter(s => s.pctH >= 40 && s.pctH <= 60);

  const COLORS = ['#3b82f6', '#ec4899'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">Répartition femmes / hommes</h2>
        <p className="text-gray-600">
          Suivi de l'équilibre et de la parité au sein de la DIRM
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="mb-4">Distribution globale</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={formattedGlobalData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
              >
                {formattedGlobalData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                        <p className="mb-1">{data.name}</p>
                        <p className="text-blue-600">{data.value} agents</p>
                        <p className="text-gray-600">{data.percent}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-6 h-6 bg-blue-500 rounded mx-auto mb-2" />
              <p className="text-blue-900">Hommes</p>
              <p className="text-3xl text-blue-900">{formattedGlobalData.find(d => d.name === 'Hommes')?.value || 0}</p>
              <p className="text-sm text-blue-700">{formattedGlobalData.find(d => d.name === 'Hommes')?.percent || 0}%</p>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg border border-pink-200">
              <div className="w-6 h-6 bg-pink-500 rounded mx-auto mb-2" />
              <p className="text-pink-900">Femmes</p>
              <p className="text-3xl text-pink-900">{formattedGlobalData.find(d => d.name === 'Femmes')?.value || 0}</p>
              <p className="text-sm text-pink-700">{formattedGlobalData.find(d => d.name === 'Femmes')?.percent || 0}%</p>
            </div>
          </div>
        </div>

        {/* By Level */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="mb-4">Par niveau hiérarchique</h3>
          <div className="space-y-4">
            {byLevel.map((level, index) => {
              const total = level.hommes + level.femmes;
              const hommesPct = (level.hommes / total) * 100;
              const femmesPct = (level.femmes / total) * 100;
              
              return (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-900">{level.level}</span>
                    <span className="text-sm text-gray-600">{total} agents</span>
                  </div>
                  <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
                    <div
                      className="bg-blue-500 flex items-center justify-center text-white text-xs"
                      style={{ width: `${hommesPct}%` }}
                    >
                      {level.hommes}
                    </div>
                    <div
                      className="bg-pink-500 flex items-center justify-center text-white text-xs"
                      style={{ width: `${femmesPct}%` }}
                    >
                      {level.femmes}
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-600">
                    <span>{Math.round(hommesPct)}% H</span>
                    <span>{Math.round(femmesPct)}% F</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-900" />
              <h4 className="text-orange-900">Point de vigilance</h4>
            </div>
            <p className="text-sm text-orange-800">
              Les postes de direction sont actuellement occupés à {directionFemmesPct}% par des femmes 
              (objectif ministériel : 40% d'ici 2027).
            </p>
          </div>
        </div>
      </div>

      {/* By Service */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="mb-4">Par service</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {byService.map((service, index) => {
            const hommesPct = (service.hommes / service.totalService) * 100;
            const femmesPct = (service.femmes / service.totalService) * 100;
            const isBalanced = hommesPct >= 40 && hommesPct <= 60;
            
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  isBalanced
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-gray-900">{service.service}</h4>
                  {isBalanced && (
                    <span className="flex items-center gap-1 text-green-600 text-xs">
                      <Check className="w-3 h-3" />
                      Équilibré
                    </span>
                  )}
                </div>
                <div className="flex gap-1 h-6 rounded overflow-hidden mb-2">
                  <div
                    className="bg-blue-500"
                    style={{ width: `${hommesPct}%` }}
                  />
                  <div
                    className="bg-pink-500"
                    style={{ width: `${femmesPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600">{service.hommes} H ({Math.round(hommesPct)}%)</span>
                  <span className="text-pink-600">{service.femmes} F ({Math.round(femmesPct)}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analysis and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-blue-900" />
            <h3 className="text-lg text-blue-900">Analyse générale</h3>
          </div>
          <div className="space-y-2 text-sm text-blue-900">
            <p className="flex items-center gap-1">
              <Check className="w-3 h-3" />
              Ratio global&nbsp;: {pctHommesGlobal}% d'hommes / {pctFemmesGlobal}% de femmes.
            </p>
            {mostFemService && (
              <p className="flex items-center gap-1">
                <Check className="w-3 h-3" />
                Service le plus féminisé&nbsp;: {mostFemService.service} ({Math.round(mostFemService.pctF)}% de femmes).
              </p>
            )}
            {mostMaleService && (
              <p className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Service le plus masculinisé&nbsp: {mostMaleService.service} ({Math.round(mostMaleService.pctH)}% d'hommes).
              </p>
            )}
            <p className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Nombre de services proches de la parité (40-60% d'hommes)&nbsp;: {balancedServices.length}.
            </p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-green-900" />
            <h3 className="text-lg text-green-900">Plan d'action égalité</h3>
          </div>
          <div className="space-y-2 text-sm text-green-900">
            <p className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Favoriser candidatures féminines postes direction</p>
            <p className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Encourager mixité dans services opérationnels</p>
            <p className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Formations sur égalité professionnelle</p>
            <p className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Mentorat femmes à potentiel</p>
            <p className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Objectif 2027 : 40% de femmes à tous niveaux</p>
          </div>
        </div>
      </div>

    </div>
  );
}