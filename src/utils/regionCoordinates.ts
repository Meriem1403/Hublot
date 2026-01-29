/**
 * Coordonnées géographiques des régions françaises
 * Latitude et longitude pour positionner précisément les marqueurs sur la carte
 */

export interface RegionCoordinates {
  latitude: number;
  longitude: number;
  nom: string;
}

// Coordonnées des principales villes/régions françaises
export const REGION_COORDINATES: Record<string, RegionCoordinates> = {
  // Métropole
  'PAYS-DE-LA-LOIRE': { latitude: 47.2186, longitude: -1.5541, nom: 'Pays de la Loire' }, // Nantes
  'NORMANDIE': { latitude: 49.1829, longitude: -0.3707, nom: 'Normandie' }, // Caen
  'NOUVELLE AQUITAINE': { latitude: 44.8378, longitude: -0.5792, nom: 'Nouvelle-Aquitaine' }, // Bordeaux
  'BRETAGNE': { latitude: 48.1173, longitude: -1.6778, nom: 'Bretagne' }, // Rennes
  'HAUTS-DE-FRANCE': { latitude: 50.6292, longitude: 3.0573, nom: 'Hauts-de-France' }, // Lille
  'OCCITANIE': { latitude: 43.6047, longitude: 1.4442, nom: 'Occitanie' }, // Toulouse
  'Nice': { latitude: 43.7102, longitude: 7.2620, nom: 'Nice' },
  'Marseille': { latitude: 43.2965, longitude: 5.3698, nom: 'Marseille' },
  'Toulon': { latitude: 43.1242, longitude: 5.9280, nom: 'Toulon' },
  'CORSE': { latitude: 42.1526, longitude: 9.1406, nom: 'Corse' }, // Ajaccio
  'Sète': { latitude: 43.4028, longitude: 3.6967, nom: 'Sète' },
  
  // Outre-mer
  'MARTINIQUE': { latitude: 14.6415, longitude: -61.0242, nom: 'Martinique' }, // Fort-de-France
  'GUADELOUPE': { latitude: 16.2650, longitude: -61.5510, nom: 'Guadeloupe' }, // Pointe-à-Pitre
  'GUYANE': { latitude: 4.9224, longitude: -52.3135, nom: 'Guyane' }, // Cayenne
  'MAYOTTE': { latitude: -12.8275, longitude: 45.1662, nom: 'Mayotte' }, // Mamoudzou
  'REUNION': { latitude: -21.1151, longitude: 55.5364, nom: 'La Réunion' }, // Saint-Denis
  'LA REUNION': { latitude: -21.1151, longitude: 55.5364, nom: 'La Réunion' },
  'POLYNESIE FRANCAISE': { latitude: -17.5516, longitude: -149.5585, nom: 'Polynésie française' }, // Papeete
  'NOUVELLE CALEDONIE': { latitude: -22.2558, longitude: 166.4505, nom: 'Nouvelle-Calédonie' }, // Nouméa
  'SAINT-PIERRE ET MIQUELON': { latitude: 46.7756, longitude: -56.1939, nom: 'Saint-Pierre-et-Miquelon' },
  'SAINT PIERRE ET MIQUELON': { latitude: 46.7756, longitude: -56.1939, nom: 'Saint-Pierre-et-Miquelon' },
  
  // Autres
  'COM-STC': { latitude: 48.8566, longitude: 2.3522, nom: 'COM-STC' }, // Paris (approximation)
  'EP-AAI-OPERATEURS': { latitude: 48.8566, longitude: 2.3522, nom: 'EP-AAI-OPÉRATEURS' }, // Paris (approximation)
  'HORS ZG': { latitude: 48.8566, longitude: 2.3522, nom: 'Hors zone géographique' }, // Paris (approximation)
};

/**
 * Obtient les coordonnées d'une région
 */
export function getRegionCoordinates(regionName: string): RegionCoordinates | null {
  if (!regionName) return null;
  
  // Normaliser le nom de la région (enlever accents et mettre en majuscules)
  const normalized = regionName.trim();
  const normalizedUpper = normalized.toUpperCase();
  
  // Chercher une correspondance exacte (sensible à la casse)
  if (REGION_COORDINATES[normalized]) {
    return REGION_COORDINATES[normalized];
  }
  
  // Chercher une correspondance exacte en majuscules
  if (REGION_COORDINATES[normalizedUpper]) {
    return REGION_COORDINATES[normalizedUpper];
  }
  
  // Chercher une correspondance partielle (insensible à la casse)
  for (const [key, coords] of Object.entries(REGION_COORDINATES)) {
    const keyUpper = key.toUpperCase();
    if (normalizedUpper === keyUpper || 
        normalizedUpper.includes(keyUpper) || 
        keyUpper.includes(normalizedUpper)) {
      return coords;
    }
  }
  
  // Dernière tentative : recherche par nom (champ 'nom')
  for (const [key, coords] of Object.entries(REGION_COORDINATES)) {
    if (coords.nom.toUpperCase() === normalizedUpper || 
        coords.nom.toUpperCase().includes(normalizedUpper) ||
        normalizedUpper.includes(coords.nom.toUpperCase())) {
      return coords;
    }
  }
  
  return null;
}
