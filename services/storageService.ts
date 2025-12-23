
import { User, Car, Invoice } from '../types';

const KEYS = {
  USERS: 'AUTOBOOK_DB_USERS_V2', 
  CARS: 'AUTOBOOK_DB_CARS_V2',
  INVOICES: 'AUTOBOOK_DB_INVOICES_V2',
  SESSION: 'AUTOBOOK_SESSION_V2'
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

const MOCK_GLOBAL_USERS: User[] = [
  { id: 'm1', name: 'Thomas Bernard', email: 't.bernard@gmail.com', role: 'user', isValidated: true, clientType: 'new', isPremium: true },
  { id: 'm2', name: 'Sandrine Petit', email: 's.petit@orange.fr', role: 'user', isValidated: true, clientType: 'new' },
  { id: 'm3', name: 'Marc Lefebvre', email: 'marc.l@outlook.com', role: 'user', isValidated: true, clientType: 'existing' },
  { id: 'm4', name: 'Lucie Girard', email: 'lucie.girard@yahoo.fr', role: 'user', isValidated: true, clientType: 'new' },
  { id: 'm5', name: 'Antoine Morel', email: 'a.morel@gmail.com', role: 'user', isValidated: true, clientType: 'existing', isPremium: true },
  { id: 'm6', name: 'Sophie Dubos', email: 'sophie.d@gmail.com', role: 'user', isValidated: true, clientType: 'new' },
  { id: 'm7', name: 'Julien Roux', email: 'j.roux@free.fr', role: 'user', isValidated: true, clientType: 'existing' },
  { id: 'm8', name: 'Emma Simon', email: 'e.simon@gmail.com', role: 'user', isValidated: true, clientType: 'new' },
  { id: 'm9', name: 'Nicolas Faure', email: 'n.faure@gmail.com', role: 'user', isValidated: true, clientType: 'new', isPremium: true },
  { id: 'm10', name: 'Chloé Fontaine', email: 'chloe.f@gmail.com', role: 'user', isValidated: true, clientType: 'existing' }
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
      // On s'assure d'avoir au moins la base de démo si c'est vide
      if (existing.length < 5) {
        const merged = [...existing, ...MOCK_GLOBAL_USERS];
        saveData(KEYS.USERS, merged);
        
        // Simuler des voitures pour les stats globales
        const cars = loadData<Car[]>(KEYS.CARS, []);
        if (cars.length < 5) {
          const mockCars: Car[] = MOCK_GLOBAL_USERS.map((u, i) => ({
            id: `c${i}`,
            ownerId: u.id,
            name: i % 2 === 0 ? 'Peugeot 3008' : 'Tesla Model 3',
            plate: `FR-${100+i}-AB`,
            type: 'car',
            firstRegistrationDate: '2020-01-01',
            fuelType: i % 3 === 0 ? 'electrique' : 'diesel',
            initialKm: 30000 + (i * 15000),
            photos: { front: null, back: null, left: null, right: null, engine: null, damages: [] },
            initialState: { tires: i % 4 === 0 ? 'bad' : 'good', brakes: 'good', body: 'good', interior: 'good', engine: 'good' },
            grayCardUrl: null
          }));
          saveData(KEYS.CARS, [...cars, ...mockCars]);

          // Simuler des factures pour le CA global
          const invoices: Invoice[] = mockCars.map((c, i) => ({
            id: `inv${i}`,
            carId: c.id,
            type: 'maintenance',
            title: i % 2 === 0 ? 'Révision Annuelle' : 'Pneumatiques',
            date: '2024-11-01',
            km: c.initialKm + 500,
            price: 250 + (i * 80)
          }));
          saveData(KEYS.INVOICES, invoices);
        }
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
