
import { User, Car, Invoice } from '../types';

/**
 * AUTOBOOK STORAGE ENGINE V3.0
 * Système de persistance renforcé avec focus sur la confidentialité.
 */

const KEYS = {
  USERS: 'AUTOBOOK_USERS_STABLE', 
  CARS: 'AUTOBOOK_CARS_STABLE',
  INVOICES: 'AUTOBOOK_INVOICES_STABLE',
  SESSION: 'AUTOBOOK_SESSION_STABLE',
  LAST_EMAIL: 'AUTOBOOK_LAST_KNOWN_EMAIL' // Utilisé pour la restauration de session uniquement si l'utilisateur l'a accepté
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
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 0 && key === KEYS.USERS) return fallback;
    return parsed || fallback;
  } catch (e) {
    console.error(`[Storage] Erreur lecture ${key}`);
    return fallback;
  }
};

const saveData = <T>(key: string, data: T): boolean => {
  try {
    if (!data) return false;
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error(`[Storage] Quota plein ou erreur écriture ${key}`);
    return false;
  }
};

export const db = {
  users: {
    getAll: () => loadData<User[]>(KEYS.USERS, DEFAULT_USERS),
    saveAll: (users: User[]) => saveData(KEYS.USERS, users),
    addOne: (user: User) => {
      const users = loadData<User[]>(KEYS.USERS, DEFAULT_USERS);
      const existingIndex = users.findIndex(u => u.id === user.id || u.email === user.email);
      
      let updatedUser = { ...user };
      if (existingIndex !== -1) {
        const existing = users[existingIndex];
        // Fusion intelligente : on garde le mot de passe local si le nouveau est absent
        updatedUser = { 
          ...existing, 
          ...user,
          password: user.password || existing.password 
        };
        users[existingIndex] = updatedUser;
      } else {
        users.push(updatedUser);
      }
      
      saveData(KEYS.USERS, users);
    }
  },
  cars: {
    getAll: () => loadData<Car[]>(KEYS.CARS, []),
    saveAll: (cars: Car[]) => saveData(KEYS.CARS, cars)
  },
  invoices: {
    getAll: () => loadData<Invoice[]>(KEYS.INVOICES, []),
    saveAll: (invoices: Invoice[]) => saveData(KEYS.INVOICES, invoices)
  },
  session: {
    get: () => localStorage.getItem(KEYS.SESSION),
    set: (userId: string) => localStorage.setItem(KEYS.SESSION, userId),
    clear: () => {
      localStorage.removeItem(KEYS.SESSION);
      // Nous ne supprimons pas forcément LAST_EMAIL pour permettre la reconnexion auto dans App.tsx
      // Mais AuthScreen ne l'affichera pas visuellement pour la confidentialité.
    },
    getLastEmail: () => localStorage.getItem(KEYS.LAST_EMAIL),
    setLastEmail: (email: string) => localStorage.setItem(KEYS.LAST_EMAIL, email)
  }
};
