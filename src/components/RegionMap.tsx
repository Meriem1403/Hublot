import { useState, useMemo, useRef } from 'react';
import { AlertTriangle, Info, BarChart3, ZoomIn, ZoomOut } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { useAgentsData } from '../hooks/useAgentsData';
import { getRegionCoordinates } from '../utils/regionCoordinates';
import { MethodologyDialog } from './MethodologyDialog';

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
  const agents = useAgentsData();

  // Diagnostic : comparer ce que l'Excel (agents) contient vs ce que la carte affiche.
  // Utile pour valider qu'on n'ajoute/supprime rien et que la correspondance coordonnées fonctionne.
  const excelDistinctRegions = useMemo(() => {
    const set = new Set<string>();
    agents.forEach((a) => {
      const r = (a.region || '').trim();
      if (r) set.add(r);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [agents]);

  const missingCoordsRegions = useMemo(() => {
    return excelDistinctRegions.filter((r) => getRegionCoordinates(r) === null);
  }, [excelDistinctRegions]);
  
  // Calculer uniquement les effectifs (données Excel) par région, + coordonnées pour la visualisation.
  const regions = useMemo(() => {
    const effectifsParRegion = new Map<string, number>();

    // Données strictes : on compte uniquement les agents actifs et on agrège par la colonne "Région" Excel.
    agents
      .filter((a) => a.actif)
      .forEach((agent) => {
        const name = (agent.region || '').trim();
        if (!name) return;
        effectifsParRegion.set(name, (effectifsParRegion.get(name) || 0) + 1);
      });

    const regionsWithCoords = Array.from(effectifsParRegion.entries()).map(([name, effectif]) => {
      const coordsExact = getRegionCoordinates(name);
      return {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        effectif,
        coordinates: coordsExact
          ? ([coordsExact.longitude, coordsExact.latitude] as [number, number])
          : null,
        displayOffsetPx: { x: 0, y: 0 } as { x: number; y: number }
      };
    });

    const validRegions = regionsWithCoords.filter((region) => region.coordinates !== null);

    // Superposition : si plusieurs régions ont exactement les mêmes coordonnées,
    // on décale uniquement l'affichage en pixels (sans modifier les coordonnées géographiques).
    const coordUsage = new Map<string, number>();
    return validRegions.map((region) => {
      const [lon, lat] = region.coordinates as [number, number];
      const key = `${lon.toFixed(4)}|${lat.toFixed(4)}`;
      const indexAtCoord = coordUsage.get(key) || 0;
      coordUsage.set(key, indexAtCoord + 1);

      if (indexAtCoord === 0) return region;

      const angle = (indexAtCoord * (Math.PI * 2)) / 8;
      const ring = Math.floor(indexAtCoord / 8);
      const radiusPx = 26 + ring * 12;
      const dx = Math.cos(angle) * radiusPx;
      const dy = Math.sin(angle) * radiusPx;

      return {
        ...region,
        displayOffsetPx: { x: dx, y: dy }
      };
    });
  }, [agents]);

  const regionsDetails = useMemo(() => {
    // Outre-mer : retirer du "Détails par région" (liste + alertes + totaux)
    const outremers = new Set([
      'MARTINIQUE',
      'GUADELOUPE',
      'GUYANE',
      'MAYOTTE',
      'REUNION',
      'LA REUNION',
      'POLYNESIE FRANCAISE',
      'NOUVELLE CALEDONIE',
      'SAINT-PIERRE ET MIQUELON',
      'SAINT PIERRE ET MIQUELON'
    ]);

    return regions.filter((r) => {
      const nameUpper = (r.name || '').trim().toUpperCase();
      return !outremers.has(nameUpper);
    });
  }, [regions]);

  // NOTE: pas de fit automatique de vue ici.
  // Pour éviter que la carte parte hors écran, la vue est pilotée par les boutons zoom/reset.

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl mb-2">Effectifs par région</h2>
          <p className="text-gray-600">
            Cartographie interactive des zones maritimes et répartition géographique des moyens
          </p>
        </div>
        <MethodologyDialog
          title="Méthodologie — Effectifs par région"
          intro="Répartition géographique issue des données agents filtrées."
          sections={[
            {
              title: 'Sources',
              bullets: [
                'Région administrative de l’agent (Excel).',
                'Statut actif pour le comptage principal.',
                'Coordonnées régionales provenant de la table de correspondance interne.'
              ]
            },
            {
              title: 'Calculs affichés',
              bullets: [
                'Effectif région = nombre d’agents actifs de la région.',
                'Aucun taux/capacité n’est calculé : uniquement l’effectif réel issu de la colonne Excel "Région".'
              ]
            }
          ]}
        />
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
                    Régions Excel (distinctes) : {excelDistinctRegions.join(', ')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Total : {excelDistinctRegions.length}
                  </p>
                </div>
              </div>
            )}
            {/* Info debug en haut à droite */}
            <div className="absolute top-4 right-4 bg-white/95 border-2 border-blue-500 rounded-lg p-3 z-[9999] shadow-lg text-xs pointer-events-none max-w-[340px]">
              <p className="font-semibold text-blue-900">
                Excel régions (distinctes) : {excelDistinctRegions.length}
              </p>
              <p className="font-semibold text-blue-900 mt-1">Affichées carte : {regions.length}</p>
              <p className="text-blue-700 text-[11px] mt-1">
                Manquantes coords : {missingCoordsRegions.length}
              </p>
              {missingCoordsRegions.length > 0 && (
                <p className="text-blue-700 text-[11px] mt-1 break-words">
                  {missingCoordsRegions.slice(0, 8).join(', ')}
                  {missingCoordsRegions.length > 8 ? '…' : ''}
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
                  
                  const isHovered = hoveredRegion === region.id;
                  const isSelected = selectedRegion === region.id;
                  // Cercles un peu plus petits pour réduire l'occultation quand plusieurs régions partagent la même zone.
                  const radius = Math.max(6, Math.min(18, Math.sqrt(region.effectif) * 0.9));
                  const markerColor = '#3b82f6';
                  
                  return (
                    <Marker
                      key={region.id}
                      coordinates={region.coordinates}
                    >
                      <g
                        transform={
                          region.displayOffsetPx
                            ? `translate(${region.displayOffsetPx.x}, ${region.displayOffsetPx.y})`
                            : undefined
                        }
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
                const markerColor = '#3b82f6';
                
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
                      <div className="flex items-center justify-between mb-2 gap-3">
                        <h4 className="font-bold text-gray-900 text-sm flex-1 pr-2">{region.name}</h4>
                      </div>
                      
                      {/* Separator */}
                      <div className="h-px bg-gray-200 mb-2"></div>
                      
                      {/* Effectif (réel depuis Excel) */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 text-xs">Effectif:</span>
                        <span className="text-gray-900 text-xs font-semibold">
                          {region.effectif.toLocaleString('fr-FR')} agents
                        </span>
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
                <span className="text-gray-700">Effectifs</span>
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
                    <strong>Calcul :</strong> Effectif par région = nombre d’agents actifs dont la région (Excel) correspond.
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
              {regionsDetails.map((region, index) => (
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
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>
                      Effectif: <span className="font-semibold">{region.effectif.toLocaleString('fr-FR')} agents</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
                <span className="text-blue-900">Nombre de régions affichées:</span>
                <span className="text-blue-900">{regionsDetails.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}