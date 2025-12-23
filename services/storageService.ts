
import { User, Car, Invoice } from '../types';

/**
 * SERVICE DE STOCKAGE SÉCURISÉ (Pseudo-Backend)
 * 
 * RÔLE CRITIQUE : Ce fichier est le gardien de la base de données.
 * Il doit empêcher toute perte de données due à des écrasements accidentels.
 */

const KEYS = {
  USERS: 'AUTOBOOK_DB_USERS_V2', 
  CARS: 'AUTOBOOK_DB_CARS_V2',
  INVOICES: 'AUTOBOOK_DB_INVOICES_V2',
  SESSION: 'AUTOBOOK_SESSION_V2'
};

// Données par défaut (Admin)
const DEFAULT_USERS: User[] = [
  { 
    id: 'admin-001', 
    name: 'Administrateur NSP', 
    email: 'neoservicepneu31@gmail.com', 
    password: 'PAM180279', 
    role: 'admin',
    isValidated: true,
    clientType: 'existing'
  }
];

// --- COUCHE BASSE : ACCÈS DISQUE SÉCURISÉ ---

const loadData = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    
    // Vérification d'intégrité : Si on attend un tableau, on doit recevoir un tableau
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
        console.warn(`[DB WARNING] Données corrompues pour ${key}, retour fallback.`);
        return fallback;
    }
    return parsed;
  } catch (e) {
    console.error(`[DB LOAD ERROR] Impossible de lire ${key}`, e);
    return fallback;
  }
};

const saveData = <T>(key: string, data: T): boolean => {
  try {
    // SÉCURITÉ ANTI-VIDE : On n'écrase jamais une base Users existante avec un tableau vide
    // Sauf si c'est explicitement voulu (reset), mais ici on protège le démarrage
    if (key === KEYS.USERS && Array.isArray(data) && data.length === 0) {
        // On vérifie s'il y avait des données avant
        const existing = localStorage.getItem(key);
        if (existing && existing.length > 50) { // > 50 chars = contient probablement des données
            console.error(`[DB SAFETY] Tentative d'écrasement de ${key} avec tableau vide bloquée !`);
            return false;
        }
    }

    const payload = JSON.stringify(data);
    localStorage.setItem(key, payload);
    return true;
  } catch (e) {
    // Gestion spécifique quota dépassé (iOS/Android)
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      alert("⚠️ MÉMOIRE TÉLÉPHONE PLEINE : Impossible de sauvegarder. L'application ne peut plus stocker de photos. Veuillez supprimer d'anciens véhicules ou vider votre cache.");
      return false;
    }
    console.error(`[DB SAVE ERROR] Impossible d'écrire ${key}`, e);
    return false;
  }
};

// --- API BACKEND SIMULÉE ---

export const db = {
  // Utilisateurs
  users: {
    getAll: () => loadData<User[]>(KEYS.USERS, DEFAULT_USERS),
    saveAll: (users: User[]) => saveData(KEYS.USERS, users),
    add: (user: User) => {
      const users = loadData<User[]>(KEYS.USERS, DEFAULT_USERS);
      // Éviter doublons stricts
      const existsIndex = users.findIndex(u => u.id === user.id || u.email === user.email);
      if (existsIndex >= 0) {
        users[existsIndex] = user; // Update
      } else {
        users.push(user); // Insert
      }
      return saveData(KEYS.USERS, users);
    }
  },

  // Véhicules
  cars: {
    getAll: () => loadData<Car[]>(KEYS.CARS, []),
    saveAll: (cars: Car[]) => saveData(KEYS.CARS, cars)
  },

  // Factures
  invoices: {
    getAll: () => loadData<Invoice[]>(KEYS.INVOICES, []),
    saveAll: (invoices: Invoice[]) => saveData(KEYS.INVOICES, invoices)
  },

  // Session
  session: {
    get: () => localStorage.getItem(KEYS.SESSION),
    set: (userId: string) => localStorage.setItem(KEYS.SESSION, userId),
    clear: () => localStorage.removeItem(KEYS.SESSION)
  },

  // Admin Tools
  nuke: () => {
    localStorage.clear();
    window.location.reload();
  },
  
  getStorageUsage: () => {
    let total = 0;
    try {
        for (const key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            const val = localStorage.getItem(key);
            if(val) total += ((val.length + key.length) * 2);
          }
        }
    } catch(e) {
        return "0.00";
    }
    return (total / 1024 / 1024).toFixed(2); // MB
  }
};

// --- SIMULATION UPLOAD FICHIER SECURISE ---
export const uploadToSecureVault = async (fileBase64: string, mimeType: string) => {
  // Simule un délai réseau vers le Cloud
  await new Promise(resolve => setTimeout(resolve, 800));
  return {
    id: `sec-${Date.now()}`,
    url: fileBase64, 
    uploadDate: new Date().toISOString(),
    mimeType,
    encrypted: true
  };
};
