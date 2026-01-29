import { useState, useMemo, useRef } from 'react';
import { AlertTriangle, Info, BarChart3, ZoomIn, ZoomOut } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { useCapacitesRegions, useAgentsData } from '../hooks/useAgentsData';
import { getRegionCoordinates } from '../utils/regionCoordinates';

// URL pour la carte TopoJSON de la France
// Utilisation d'une URL alternative qui fonctionne
// Fallback vers une carte du monde si la carte de France ne charge pas
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function RegionMap() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  // Zoom initial et centre optimisés pour voir toute la France y compris la Corse
  // Centre de la France: ~2.5°E, 46.5°N
  const [position, setPosition] = useState({ coordinates: [2.5, 46.5] as [number, number], zoom: 2 });
  const [mapError, setMapError] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number; region: string } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const capacitesRegions = useCapacitesRegions();
  const agents = useAgentsData();
  
  // Calculer les effectifs par région avec coordonnées géographiques
  // Utilise les données réelles calculées par mettreAJourCapacitesRegions
  const regions = useMemo(() => {
    const regionsWithCoords = capacitesRegions.map(cap => {
      // Utiliser effectifActuel qui est déjà calculé depuis les vraies données
      const effectif = cap.effectifActuel ?? agents.filter(a => a.region === cap.region && a.actif).length;
      const taux = cap.tauxRemplissage ?? (cap.capaciteMaximale > 0 ? (effectif / cap.capaciteMaximale) * 100 : 0);
      const coords = getRegionCoordinates(cap.region);
      
      const regionData = {
        id: cap.region.toLowerCase().replace(/\s+/g, '-'),
        name: cap.region,
        effectif,
        capacite: cap.capaciteMaximale,
        status: cap.status,
        tauxRemplissage: taux,
        coordinates: coords ? [coords.longitude, coords.latitude] as [number, number] : null
      };
      
      // Debug dans la console pour vérifier les données réelles
      if (!coords) {
        console.warn(`Coordonnées non trouvées pour la région: ${cap.region}`);
      }
      
      return regionData;
    });
    
    // Filtrer pour n'afficher que les régions avec coordonnées
    const validRegions = regionsWithCoords.filter(region => region.coordinates !== null);
    
    // Debug: afficher dans la console
    if (validRegions.length === 0 && regionsWithCoords.length > 0) {
      console.warn('Aucune région n\'a de coordonnées géographiques valides:', regionsWithCoords.map(r => ({ name: r.name, coords: r.coordinates })));
    } else {
      console.log(`✅ ${validRegions.length} régions avec coordonnées sur ${regionsWithCoords.length} totales:`, validRegions.map(r => r.name));
      if (regionsWithCoords.length > validRegions.length) {
        const sansCoords = regionsWithCoords.filter(r => r.coordinates === null).map(r => r.name);
        console.warn(`⚠️ ${regionsWithCoords.length - validRegions.length} régions sans coordonnées:`, sansCoords);
      }
    }
    
    return validRegions;
  }, [capacitesRegions, agents]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'bg-green-500';
      case 'normal': return 'bg-blue-500';
      case 'tension': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'optimal': return 'Optimal';
      case 'normal': return 'Normal';
      case 'tension': return 'Sous tension';
      default: return 'Inconnu';
    }
  };

  const getMarkerColor = (status: string) => {
    return status === 'tension' ? '#f59e0b' : '#3b82f6';
  };

  const handleMoveEnd = (position: { coordinates: [number, number]; zoom: number }) => {
    setPosition(position);
  };

  const handleZoomIn = () => {
    if (position.zoom >= 8) return;
    setPosition({ ...position, zoom: Math.min(8, position.zoom * 1.5) });
  };

  const handleZoomOut = () => {
    if (position.zoom <= 0.5) return;
    setPosition({ ...position, zoom: Math.max(0.5, position.zoom / 1.5) });
  };
  
  const handleResetZoom = () => {
    setPosition({ coordinates: [2.5, 46.5] as [number, number], zoom: 2 });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">Effectifs par région</h2>
        <p className="text-gray-600">
          Cartographie interactive des zones maritimes et répartition géographique des moyens
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Visual */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Carte interactive - Zone DIRM Méditerranée</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                title="Zoom avant"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                title="Zoom arrière"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-3 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors text-xs font-medium"
                title="Réinitialiser la vue"
              >
                Reset
              </button>
            </div>
          </div>
          
          <div 
            ref={mapContainerRef}
            className="relative bg-gradient-to-br from-blue-50 to-slate-50 rounded-lg border border-blue-200 overflow-hidden" 
            style={{ minHeight: "600px" }}
            onMouseMove={(e) => {
              // Mettre à jour la position du tooltip si une région est survolée
              if (hoveredRegion && mapContainerRef.current) {
                const rect = mapContainerRef.current.getBoundingClientRect();
                setTooltipPosition({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                  region: hoveredRegion
                });
              }
            }}
            onMouseLeave={() => {
              setTooltipPosition(null);
            }}
          >
            {/* Message de debug */}
            {regions.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-30 rounded-lg">
                <div className="text-center p-4">
                  <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-semibold">Aucune région avec coordonnées trouvée</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Régions disponibles: {capacitesRegions.map(r => r.region).join(', ')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Total capacitesRegions: {capacitesRegions.length}
                  </p>
                </div>
              </div>
            )}
            {/* Info debug en haut à droite */}
            <div className="absolute top-2 right-2 bg-blue-100 border border-blue-300 rounded-lg p-2 z-20 text-xs">
              <p className="font-semibold text-blue-900">Régions: {regions.length}</p>
              {regions.length > 0 && (
                <p className="text-blue-700 text-[10px] mt-1">
                  {regions.map(r => r.name).join(', ')}
                </p>
              )}
            </div>
            {mapError && (
              <div className="absolute top-2 left-2 bg-orange-100 border border-orange-300 rounded-lg p-2 z-20">
                <p className="text-xs text-orange-700">{mapError}</p>
              </div>
            )}
            <div className="w-full h-[600px] relative bg-blue-50">
              <ComposableMap
                projectionConfig={{
                  scale: 1800,
                  center: [2.5, 46.5]
                }}
                style={{ width: "100%", height: "100%" }}
              >
              <ZoomableGroup
                zoom={position.zoom}
                center={position.coordinates}
                onMoveEnd={handleMoveEnd}
                minZoom={0.5}
                maxZoom={8}
              >
                <Geographies geography={geoUrl}>
                  {({ geographies }) => {
                    if (!geographies || geographies.length === 0) {
                      setMapError("Impossible de charger la carte géographique");
                      return null;
                    }
                    
                    setMapError(null);
                    
                    // Filtrer pour n'afficher que la France si possible
                    const franceGeo = geographies.find((geo: any) => 
                      geo.properties?.NAME === 'France' || 
                      geo.properties?.NAME_FR === 'France' ||
                      geo.properties?.name === 'France' ||
                      geo.properties?.NAME_LONG === 'France'
                    );
                    
                    if (franceGeo) {
                      return (
                        <Geography
                          key={franceGeo.rsmKey}
                          geography={franceGeo}
                          fill="#E5E7EB"
                          stroke="#9CA3AF"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: "none" },
                            hover: { outline: "none", fill: "#D1D5DB" },
                            pressed: { outline: "none", fill: "#9CA3AF" }
                          }}
                        />
                      );
                    }
                    
                    // Sinon, afficher tous les pays avec un style discret, en mettant la France en évidence
                    return geographies.map((geo: any) => {
                      const isFrance = geo.properties?.NAME === 'France' || 
                                      geo.properties?.NAME_FR === 'France' ||
                                      geo.properties?.name === 'France' ||
                                      geo.properties?.NAME_LONG === 'France';
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={isFrance ? "#E5E7EB" : "#F3F4F6"}
                          stroke={isFrance ? "#9CA3AF" : "#E5E7EB"}
                          strokeWidth={isFrance ? 0.5 : 0.2}
                          style={{
                            default: { outline: "none" },
                            hover: { outline: "none", fill: "#D1D5DB" },
                            pressed: { outline: "none", fill: "#9CA3AF" }
                          }}
                        />
                      );
                    });
                  }}
                </Geographies>
                
                {regions.length > 0 && regions.map((region) => {
                  if (!region.coordinates) {
                    console.warn(`Région ${region.name} n'a pas de coordonnées`);
                    return null;
                  }
                  
                  const isAlert = region.status === 'tension';
                  const isHovered = hoveredRegion === region.id;
                  const isSelected = selectedRegion === region.id;
                  const radius = Math.max(8, Math.min(25, Math.sqrt(region.effectif) * 1.2));
                  const markerColor = getMarkerColor(region.status);
                  
                  return (
                    <Marker
                      key={region.id}
                      coordinates={region.coordinates}
                    >
                      <g
                        onMouseEnter={() => {
                          setHoveredRegion(region.id);
                        }}
                        onMouseLeave={() => {
                          setHoveredRegion(null);
                          setTooltipPosition(null);
                        }}
                        onClick={() => setSelectedRegion(region.id === selectedRegion ? null : region.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Pulse animation for alert regions */}
                        {isAlert && (
                          <circle
                            r={radius + 3}
                            fill="none"
                            stroke={markerColor}
                            strokeWidth={2}
                            opacity={0.5}
                          >
                            <animate
                              attributeName="r"
                              values={`${radius + 2};${radius + 5};${radius + 2}`}
                              dur="2s"
                              repeatCount="indefinite"
                            />
                            <animate
                              attributeName="opacity"
                              values="0.7;0.2;0.7"
                              dur="2s"
                              repeatCount="indefinite"
                            />
                          </circle>
                        )}
                        
                        {/* Main marker circle */}
                        <circle
                          r={radius}
                          fill={markerColor}
                          opacity={isHovered || isSelected ? 1 : 0.85}
                          stroke="white"
                          strokeWidth={2}
                          className="transition-all"
                        />
                        
                        {/* Center dot */}
                        <circle
                          r={2}
                          fill="white"
                          opacity={0.9}
                        />
                      </g>
                    </Marker>
                  );
                })}
              </ZoomableGroup>
              </ComposableMap>
              
              {/* Tooltip HTML positionné de manière absolue - au-dessus de tout avec z-index élevé */}
              {hoveredRegion && tooltipPosition && (() => {
                const region = regions.find(r => r.id === hoveredRegion);
                if (!region || tooltipPosition.region !== hoveredRegion) return null;
                const markerColor = getMarkerColor(region.status);
                
                return (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: `${tooltipPosition.x}px`,
                      top: `${tooltipPosition.y - 130}px`, // Positionner bien au-dessus du curseur
                      transform: 'translateX(-50%)',
                      zIndex: 9999 // Z-index très élevé pour être au-dessus de tout
                    }}
                  >
                    <div className="bg-white rounded-lg shadow-2xl border-2 p-3 min-w-[170px] relative" style={{ borderColor: markerColor }}>
                      {/* Status badge */}
                      <div className="flex items-center justify-between mb-2 gap-3">
                        <h4 className="font-bold text-gray-900 text-sm flex-1 pr-2">{region.name}</h4>
                        <div 
                          className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ml-2"
                          style={{ backgroundColor: region.status === 'tension' ? '#f59e0b' : '#10b981' }}
                        >
                          {region.status === 'tension' ? '⚠' : '✓'}
                        </div>
                      </div>
                      
                      {/* Separator */}
                      <div className="h-px bg-gray-200 mb-2"></div>
                      
                      {/* Effectif */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 text-xs">Effectif:</span>
                        <span className="text-gray-900 text-xs font-semibold">{region.effectif} / {region.capacite}</span>
                      </div>
                      
                      {/* Percentage */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 text-xs">Taux de remplissage:</span>
                        <span 
                          className="text-sm font-bold"
                          style={{ color: region.status === 'tension' ? '#f59e0b' : '#10b981' }}
                        >
                          {Math.round(region.tauxRemplissage ?? (region.effectif / region.capacite) * 100)}%
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, Math.max(0, region.tauxRemplissage ?? (region.effectif / region.capacite) * 100))}%`,
                            backgroundColor: region.status === 'tension' ? '#f59e0b' : '#10b981'
                          }}
                        />
                      </div>
                      
                      {/* Flèche pointant vers le marqueur */}
                      <div 
                        className="absolute left-1/2 -bottom-2 transform -translate-x-1/2 w-0 h-0"
                        style={{
                          borderLeft: '8px solid transparent',
                          borderRight: '8px solid transparent',
                          borderTop: `12px solid ${markerColor}`
                        }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Legend */}
            <div className="mt-4 p-4 flex items-center gap-6 justify-center text-sm bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
                <span className="text-gray-700">Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow"></div>
                  <div className="absolute -inset-1 rounded-full border-2 border-orange-500 opacity-50 animate-ping"></div>
                </div>
                <span className="text-gray-700">Sous tension</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-xs">Taille = effectif</span>
              </div>
            </div>

            {/* Info box */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-900 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm text-blue-900">
                    <strong>Interaction:</strong> Survolez ou cliquez sur les marqueurs pour voir les détails. Utilisez les boutons de zoom ou la molette de la souris pour naviguer.
                  </p>
                  <p className="text-xs text-blue-800">
                    <strong>Calcul du taux:</strong> Taux de remplissage = (Effectif actuel / Capacité maximale) × 100%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Region Details */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
            <h3 className="mb-4">Détails par région</h3>
            <div className="space-y-3">
              {regions.map((region, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg transition-all cursor-pointer ${
                    selectedRegion === region.id
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : hoveredRegion === region.id
                      ? 'bg-blue-50 border-2 border-blue-300'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                  onMouseEnter={() => setHoveredRegion(region.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => setSelectedRegion(region.id === selectedRegion ? null : region.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-900">{region.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(region.status)} text-white`}>
                      {getStatusLabel(region.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Effectif: {region.effectif} / {region.capacite}</p>
                    <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${region.status === 'tension' ? 'bg-orange-500' : 'bg-blue-500'}`}
                        style={{ width: `${region.tauxRemplissage ?? (region.effectif / region.capacite) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs">
                      {Math.round(region.tauxRemplissage ?? (region.effectif / region.capacite) * 100)}% de capacité
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {regions.filter(r => r.status === 'tension').length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-orange-900" />
                <h3 className="text-lg text-orange-900">Zones d'alerte</h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {regions.filter(r => r.status === 'tension').map((r, index) => (
                  <div key={index} className="text-sm text-orange-900 pb-2 border-b border-orange-200 last:border-b-0 last:pb-0">
                    <span className="font-semibold">{r.name}</span> nécessite{' '}
                    <span className="font-bold text-orange-700">{r.capacite - r.effectif}</span> agent{r.capacite - r.effectif > 1 ? 's' : ''} supplémentaire{r.capacite - r.effectif > 1 ? 's' : ''}.
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-900" />
              <h3 className="text-lg text-blue-900">Répartition totale</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-900">Total effectifs:</span>
                <span className="text-blue-900">{agents.filter(a => a.actif).length} agents</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-900">Capacité totale:</span>
                <span className="text-blue-900">{regions.reduce((sum, r) => sum + r.capacite, 0)} agents</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-900">Taux global:</span>
                <span className="text-blue-900">
                  {regions.length > 0 ? 
                    Math.round((agents.filter(a => a.actif).length / regions.reduce((sum, r) => sum + r.capacite, 0)) * 1000) / 10 : 
                    0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}