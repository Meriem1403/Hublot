import { Check, AlertTriangle, AlertCircle } from 'lucide-react';
import { useStatsParService, useAgentsData } from '../hooks/useAgentsData';

export function ServiceTreemap() {
  const servicesStats = useStatsParService();
  const agents = useAgentsData();
  
  // Calculer le total pour les pourcentages
  const total = agents.filter(a => a.actif).length;
  
  // Formater les données avec budget estimé (optionnel, peut être retiré si non disponible)
  const services = servicesStats.map(service => ({
    name: service.name,
    effectif: service.effectif,
    budget: Math.round(service.effectif * 0.46), // Estimation basée sur l'effectif
    status: service.status
  })).sort((a, b) => b.effectif - a.effectif);

  const getColor = (status: string) => {
    switch (status) {
      case 'normal': return 'from-blue-500 to-blue-600';
      case 'fragile': return 'from-orange-400 to-orange-500';
      case 'critique': return 'from-red-500 to-red-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'normal': return 'Normal';
      case 'fragile': return 'Fragile';
      case 'critique': return 'Critique';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return Check;
      case 'fragile': return AlertTriangle;
      case 'critique': return AlertTriangle;
      default: return Check;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">Effectifs par service</h2>
        <p className="text-gray-600">
          Vue d'ensemble des services porteurs et identification des équipes fragiles
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="grid grid-cols-4 gap-3 mb-6" style={{ minHeight: '400px' }}>
          {services.map((service, index) => {
            const heightPercent = (service.effectif / total) * 100;
            const colSpan = index < 2 ? 2 : index < 5 ? 1 : 1;
            const rowSpan = index < 2 ? 2 : 1;
            const StatusIcon = getStatusIcon(service.status);
            
            return (
              <div
                key={service.name}
                className={`bg-gradient-to-br ${getColor(service.status)} rounded-lg p-4 text-white hover:scale-105 transition-transform cursor-pointer flex flex-col justify-between shadow-lg`}
                style={{
                  gridColumn: `span ${colSpan}`,
                  gridRow: `span ${rowSpan}`,
                  minHeight: index < 2 ? '190px' : '90px'
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs bg-white/20 px-2 py-1 rounded flex items-center gap-1">
                      <StatusIcon className="w-3 h-3" />
                      {getStatusLabel(service.status)}
                    </span>
                  </div>
                  <h3 className={index < 2 ? 'text-lg mb-2' : 'text-sm mb-1'}>
                    {service.name}
                  </h3>
                </div>
                <div>
                  <p className={index < 2 ? 'text-3xl' : 'text-2xl'}>{service.effectif}</p>
                  <p className="text-sm text-white/80 mt-1">
                    agents • {Math.round(heightPercent)}% du total
                  </p>
                  {index < 2 && (
                    <p className="text-xs text-white/70 mt-2">
                      Budget: {service.budget}M€
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-900">Services normaux</p>
            <p className="text-2xl text-blue-900">{services.filter(s => s.status === 'normal').length}</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-orange-900">Services fragiles</p>
            <p className="text-2xl text-orange-900">{services.filter(s => s.status === 'fragile').length}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-900">Services critiques</p>
            <p className="text-2xl text-red-900">{services.filter(s => s.status === 'critique').length}</p>
          </div>
        </div>
      </div>

      {services.filter(s => s.status === 'critique').length > 0 && (() => {
        const servicesCritiques = services.filter(s => s.status === 'critique');
        const moyenne = total / services.length;
        
        return (
          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-600 rounded-full p-2">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-900">Alerte critique</h3>
                  <p className="text-sm text-red-700">
                    {servicesCritiques.length} service{servicesCritiques.length > 1 ? 's' : ''} en sous-effectif critique
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 max-h-96 overflow-y-auto pr-2">
              {servicesCritiques.map(service => {
                const ecartMoyenne = moyenne - service.effectif;
                const pourcentageMoyenne = moyenne > 0 ? Math.round((service.effectif / moyenne) * 100) : 0;
                
                return (
                  <div
                    key={service.name}
                    className="bg-white rounded-lg border-2 border-red-400 p-4 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-red-900 text-base mb-1">{service.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-red-600">{service.effectif}</span>
                          <span className="text-sm text-gray-600">agents</span>
                        </div>
                      </div>
                      <div className="bg-red-100 rounded-full p-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Écart avec la moyenne:</span>
                        <span className="font-semibold text-red-700">
                          -{Math.round(ecartMoyenne)} agent{Math.round(ecartMoyenne) > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Pourcentage de la moyenne:</span>
                        <span className="font-semibold text-red-700">{pourcentageMoyenne}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, pourcentageMoyenne)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="bg-red-200 rounded-lg p-4 border border-red-300">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-800 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-900 mb-1">Action recommandée</p>
                  <p className="text-sm text-red-800">
                    Recrutement d'urgence + externalisation temporaire pour assurer la continuité opérationnelle
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      
      {services.filter(s => s.status === 'fragile').length > 0 && services.filter(s => s.status === 'critique').length === 0 && (() => {
        const servicesFragiles = services.filter(s => s.status === 'fragile');
        const moyenne = total / services.length;
        
        return (
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 rounded-full p-2">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-orange-900">Services à surveiller</h3>
                  <p className="text-sm text-orange-700">
                    {servicesFragiles.length} service{servicesFragiles.length > 1 ? 's' : ''} nécessitent une attention particulière
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {servicesFragiles.map(service => {
                const ecartMoyenne = moyenne - service.effectif;
                const pourcentageMoyenne = moyenne > 0 ? Math.round((service.effectif / moyenne) * 100) : 0;
                
                return (
                  <div
                    key={service.name}
                    className="bg-white rounded-lg border border-orange-300 p-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-orange-900 text-sm">{service.name}</h4>
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-orange-600">{service.effectif}</span>
                      <span className="text-xs text-gray-600">agents</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-orange-400 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(100, pourcentageMoyenne)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}