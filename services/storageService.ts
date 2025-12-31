
import { User, Car, Invoice } from '../types';

/**
 * AUTOBOOK STORAGE ENGINE V2.5
 * Système de persistance hybride avec protection contre la corruption de données.
 */

const KEYS = {
  USERS: 'AUTOBOOK_DB_USERS_V2', 
  CARS: 'AUTOBOOK_DB_CARS_V2',
  INVOICES: 'AUTOBOOK_DB_INVOICES_V2',
  SESSION: 'AUTOBOOK_SESSION_V2',
  LAST_SYNC: 'AUTOBOOK_LAST_SYNC_TS'
};

const DEFAULT_USERS: User[] = [
  { 
    id: 'admin-001', 
    name: 'Administrateur National', 
    email: 'neoservicepneu31@gmail.com', 
    password: 'PAM180279', 
    role: 'admin',
    isValidated: true,
    clientType: 'existing'
  }
];

const loadData = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    // Vérification d'intégrité JSON
    const parsed = JSON.parse(raw);
    return parsed || fallback;
  } catch (e) {
    console.error(`[Storage] Corruption détectée pour la clé ${key}, chargement du fallback.`);
    return fallback;
  }
};

const saveData = <T>(key: string, data: T): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(KEYS.LAST_SYNC, Date.now().toString());
    return true;
  } catch (e) {
    console.error(`[Storage] Erreur d'écriture : quota dépassé ou stockage désactivé.`);
    return false;
  }
};

export const db = {
  users: {
    getAll: () => loadData<User[]>(KEYS.USERS, DEFAULT_USERS),
    saveAll: (users: User[]) => saveData(KEYS.USERS, users),
    getById: (id: string) => loadData<User[]>(KEYS.USERS, DEFAULT_USERS).find(u => u.id === id)
  },
  cars: {
    getAll: () => loadData<Car[]>(KEYS.CARS, []),
    saveAll: (cars: Car[]) => saveData(KEYS.CARS, cars)
  },
  invoices: {
    getAll: () => loadData<Invoice[]>(KEYS.INVOICES, []),
    saveAll: (invoices: Invoice[]) => saveData(KEYS.INVOICES, invoices),
    // Ajout pour éviter les doublons lors des syncs multiples
    upsertMany: (newInvoices: Invoice[]) => {
      const existing = loadData<Invoice[]>(KEYS.INVOICES, []);
      const merged = [...existing];
      newInvoices.forEach(inv => {
        const idx = merged.findIndex(i => i.id === inv.id);
        if (idx >= 0) merged[idx] = inv;
        else merged.push(inv);
      });
      saveData(KEYS.INVOICES, merged);
    }
  },
  session: {
    get: () => localStorage.getItem(KEYS.SESSION),
    set: (userId: string) => localStorage.setItem(KEYS.SESSION, userId),
    clear: () => {
      localStorage.removeItem(KEYS.SESSION);
      // On ne vide pas les données locales lors d'un logout pour permettre l'accès offline
      // au prochain login du même utilisateur.
    }
  }
};
