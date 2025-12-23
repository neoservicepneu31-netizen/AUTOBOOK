
import { User, Car, Invoice } from '../types';

const KEYS = {
  USERS: 'AUTOBOOK_DB_USERS_V2', 
  CARS: 'AUTOBOOK_DB_CARS_V2',
  INVOICES: 'AUTOBOOK_DB_INVOICES_V2',
  SESSION: 'AUTOBOOK_SESSION_V2'
};

// Seul le compte administrateur est conservé par défaut
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
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
};

const saveData = <T>(key: string, data: T): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
};

export const db = {
  users: {
    getAll: () => loadData<User[]>(KEYS.USERS, DEFAULT_USERS),
    saveAll: (users: User[]) => saveData(KEYS.USERS, users),
    seedGlobal: () => {
      const existing = loadData<User[]>(KEYS.USERS, DEFAULT_USERS);
      // On vérifie simplement que l'admin est présent, on n'ajoute plus de faux comptes
      const hasAdmin = existing.some(u => u.role === 'admin');
      if (!hasAdmin) {
        saveData(KEYS.USERS, [...DEFAULT_USERS, ...existing]);
      }
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
    clear: () => localStorage.removeItem(KEYS.SESSION)
  }
};
