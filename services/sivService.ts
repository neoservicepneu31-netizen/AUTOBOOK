
import { Car } from '../types';

interface SIVResult {
  make: string;
  model: string;
  version: string;
  firstRegistrationDate: string;
  fuelType: Car['fuelType'];
  type: 'car' | 'motorcycle';
}

// --- CONFIGURATION POUR PASSAGE EN PRODUCTION (API RÉELLE) ---
// Le jour où vous souscrivez à une API SIV (ex: AAA Data, Autorigin, Inaric),
// Décommentez ces lignes et remplissez votre clé.
// const SIV_API_KEY = 'VOTRE_CLE_API_ICI'; 
// const SIV_API_URL = 'https://api.fournisseur-siv.com/v1/vehicle';

// --- BASE DE DONNÉES DE DÉMONSTRATION (MOCK) ---
// Ces plaques renvoient des données fixes pour vos présentations investisseurs/clients
const MOCK_DB: Record<string, SIVResult> = {
  'AA-007-JB': {
    make: 'Aston Martin',
    model: 'DB11',
    version: 'V12 AMR',
    firstRegistrationDate: '2019-03-15',
    fuelType: 'essence',
    type: 'car'
  },
  'AB-123-CD': {
    make: 'Renault',
    model: 'Clio V',
    version: '1.0 TCe 100',
    firstRegistrationDate: '2021-06-20',
    fuelType: 'essence',
    type: 'car'
  },
  'TES-555-LA': {
    make: 'Tesla',
    model: 'Model 3',
    version: 'Performance',
    firstRegistrationDate: '2022-01-10',
    fuelType: 'electrique',
    type: 'car'
  },
  'MT-090-YZ': {
    make: 'Yamaha',
    model: 'MT-09',
    version: 'SP',
    firstRegistrationDate: '2023-04-12',
    fuelType: 'essence',
    type: 'motorcycle'
  }
};

/**
 * Générateur déterministe de "Faux Véhicule" pour la démo.
 * Permet que la plaque "CC-888-DD" renvoie toujours une "Peugeot 3008" 
 * au lieu d'un résultat aléatoire à chaque clic.
 */
const generateConsistentFakeCar = (plate: string): SIVResult => {
  // Utilise les codes ASCII des lettres pour choisir une marque fixe par plaque
  const seed = plate.charCodeAt(0) + plate.charCodeAt(1) + (plate.charCodeAt(plate.length - 1) || 0);
  
  const brands = [
    { make: 'Peugeot', model: '3008', version: 'GT Line', fuel: 'diesel' },
    { make: 'Volkswagen', model: 'Golf 8', version: 'TDI 150', fuel: 'diesel' },
    { make: 'Toyota', model: 'Yaris', version: 'Hybride', fuel: 'hybride' },
    { make: 'Citroën', model: 'C3', version: 'PureTech', fuel: 'essence' },
    { make: 'BMW', model: 'Série 1', version: '118i', fuel: 'essence' },
    { make: 'Audi', model: 'A3', version: 'S-Line', fuel: 'diesel' },
  ];

  const selected = brands[seed % brands.length];
  const year = 2015 + (seed % 9); // Année entre 2015 et 2024
  const month = 1 + (seed % 11);
  
  return {
    make: selected.make,
    model: selected.model,
    version: selected.version,
    firstRegistrationDate: `${year}-${month.toString().padStart(2, '0')}-15`,
    fuelType: selected.fuel as Car['fuelType'],
    type: 'car'
  };
};

export const searchVehicleByPlate = async (plate: string): Promise<SIVResult> => {
  // Simulation Latence Réseau (Loading spinner)
  await new Promise(resolve => setTimeout(resolve, 1200));

  const cleanPlate = plate.replace(/-/g, '').toUpperCase();
  
  // 1. MODE API RÉELLE (Squelette de code prêt à l'emploi)
  /*
  if (typeof SIV_API_KEY !== 'undefined' && SIV_API_KEY) {
    try {
      const response = await fetch(`${SIV_API_URL}?plate=${cleanPlate}&apikey=${SIV_API_KEY}`);
      if (response.ok) {
        const data = await response.json();
        // Mapper ici les données de l'API vers notre format SIVResult
        return {
           make: data.brand,
           model: data.model,
           version: data.trim,
           firstRegistrationDate: data.release_date,
           fuelType: data.energy.toLowerCase(),
           type: data.category === 'MOTO' ? 'motorcycle' : 'car'
        };
      }
    } catch (error) {
      console.error("Erreur API SIV", error);
    }
  }
  */

  // 2. MODE DÉMO : Vérification Base Mockée
  // On cherche si la plaque entrée correspond (même partiellement ou sans tiret)
  const mockKey = Object.keys(MOCK_DB).find(k => k.replace(/-/g, '') === cleanPlate);
  if (mockKey) {
    return MOCK_DB[mockKey];
  }

  // 3. MODE DÉMO AVANCÉ : Génération cohérente pour plaques inconnues
  // Si l'utilisateur tape n'importe quoi d'autre, on génère un véhicule plausible
  // qui restera le même pour cette plaque spécifique.
  return generateConsistentFakeCar(cleanPlate);
};
