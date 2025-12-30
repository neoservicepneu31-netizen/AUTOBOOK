import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where,
  onSnapshot, 
  doc, 
  setDoc,
  deleteDoc,
  Timestamp,
  limit,
  orderBy
} from 'firebase/firestore';
import { User, Car, Invoice } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyC0aoU59SqREEixo7VZbQ5_YmYcG-z3CSw",
  authDomain: "autobook-nsp.firebaseapp.com",
  projectId: "autobook-nsp",
  storageBucket: "autobook-nsp.firebasestorage.app",
  messagingSenderId: "268251454",
  appId: "1:268251454:web:912f49b4647e87013efc6f",
  measurementId: "G-Y7GNT1WCH5"
};

const API_DISABLED_KEY = 'AUTOBOOK_CLOUD_API_DISABLED';
let db: any = null;
let isRealFirebase = false;

try {
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "VOTRE_API_KEY") {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        isRealFirebase = true;
    }
} catch (e) {
    console.error("❌ Erreur d'initialisation Firebase:", e);
}

class CloudConnector {
  private static instance: CloudConnector;
  private constructor() {}

  public static getInstance(): CloudConnector {
    if (!CloudConnector.instance) {
      CloudConnector.instance = new CloudConnector();
    }
    return CloudConnector.instance;
  }

  public isConnected(): boolean {
    return isRealFirebase && localStorage.getItem(API_DISABLED_KEY) !== 'true';
  }

  public isApiDisabled(): boolean {
    return localStorage.getItem(API_DISABLED_KEY) === 'true';
  }

  public resetActivationFlag(): void {
    localStorage.removeItem(API_DISABLED_KEY);
  }

  // --- SYNC ROBUSTE ---
  // Utilisation de merge: true pour éviter d'écraser des données concurrentes
  async syncUser(user: User): Promise<void> {
    if (!this.isConnected()) return;
    try {
        await setDoc(doc(db, "users", user.id), { 
          ...user, 
          lastSync: Timestamp.now(),
          platform: 'web-mobile'
        }, { merge: true });
    } catch (e: any) { 
        if(e.code === 'permission-denied') localStorage.setItem(API_DISABLED_KEY, 'true');
    }
  }

  // Fetch avec limite pour éviter de saturer la mémoire si 10k users
  async fetchAllUsers(): Promise<User[]> {
    if (!this.isConnected()) return [];
    try {
        const q = query(collection(db, "users"), limit(500)); 
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
    } catch (e: any) { return []; }
  }

  async syncCar(car: Car): Promise<void> {
    if (!this.isConnected()) return;
    try {
      // Nettoyage des données lourdes avant sync si nécessaire (préparation Storage)
      await setDoc(doc(db, "cars", car.id), { 
        ...car, 
        lastSync: Timestamp.now(),
        searchPlate: car.plate.replace(/-/g, '').toUpperCase()
      }, { merge: true });
    } catch (e) { console.error("Sync Car Error", e); }
  }

  async fetchUserCars(userId: string): Promise<Car[]> {
    if (!this.isConnected()) return [];
    try {
      const q = query(collection(db, "cars"), where("ownerId", "==", userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Car);
    } catch (e) { return []; }
  }

  async syncInvoice(invoice: Invoice): Promise<void> {
    if (!this.isConnected()) return;
    try {
      await setDoc(doc(db, "invoices", invoice.id), { 
        ...invoice, 
        lastSync: Timestamp.now() 
      }, { merge: true });
    } catch (e) { console.error("Sync Invoice Error", e); }
  }

  // Added deleteInvoice method to fix error in App.tsx
  async deleteInvoice(invoiceId: string): Promise<void> {
    if (!this.isConnected()) return;
    try {
      await deleteDoc(doc(db, "invoices", invoiceId));
    } catch (e) {
      console.error("Delete Invoice Error", e);
    }
  }

  async fetchUserInvoices(carId: string): Promise<Invoice[]> {
    if (!this.isConnected()) return [];
    try {
      const q = query(collection(db, "invoices"), where("carId", "==", carId), orderBy("date", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Invoice);
    } catch (e) { 
      // Si l'index orderBy n'est pas encore créé sur Firebase
      const snap = await getDocs(query(collection(db, "invoices"), where("carId", "==", carId)));
      return snap.docs.map(d => d.data() as Invoice);
    }
  }

  listenToAllUsers(callback: (users: User[]) => void) {
    if (!this.isConnected()) return null;
    return onSnapshot(collection(db, "users"), (snapshot) => {
      callback(snapshot.docs.map(doc => doc.data() as User));
    });
  }
}

export const cloud = CloudConnector.getInstance();