
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
  orderBy,
  getDoc
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

const cleanData = (obj: any): any => {
  if (obj === null || typeof obj !== 'object' || obj instanceof Timestamp) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanData(item)).filter(item => item !== undefined);
  }
  
  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      if (val !== undefined) {
        newObj[key] = cleanData(val);
      }
    }
  }
  return newObj;
};

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

  /**
   * TEST DE CONNEXION : Tente de lire un document pour voir l'erreur exacte
   */
  async testConnectionDiagnostic(): Promise<{success: boolean, message: string, code?: string}> {
    if (!isRealFirebase) return { success: false, message: "Firebase n'est pas configuré (Clé API manquante)." };
    try {
      const q = query(collection(db, "users"), limit(1));
      await getDocs(q);
      return { success: true, message: "Connexion établie avec succès. Le Cloud est accessible." };
    } catch (e: any) {
      console.error("Diagnostic Error:", e);
      return { 
        success: false, 
        message: e.message || "Erreur inconnue", 
        code: e.code || "unknown" 
      };
    }
  }

  async syncUser(user: User): Promise<void> {
    if (!this.isConnected()) return;
    try {
        const cleaned = cleanData(user);
        await setDoc(doc(db, "users", user.id), { 
          ...cleaned, 
          lastSync: Timestamp.now(),
          platform: 'web-mobile'
        }, { merge: true });
    } catch (e: any) { 
        if(e.code === 'permission-denied') {
          localStorage.setItem(API_DISABLED_KEY, 'true');
        }
    }
  }

  async fetchUserByEmail(email: string): Promise<User | null> {
    if (!this.isConnected()) return null;
    try {
      const q = query(collection(db, "users"), where("email", "==", email.toLowerCase()), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { ...snap.docs[0].data(), id: snap.docs[0].id } as User;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async fetchAllUsersRaw(): Promise<User[]> {
    if (!this.isConnected()) return [];
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
    } catch (e: any) { 
      throw e;
    }
  }

  async fetchAllUsers(): Promise<User[]> {
    if (!this.isConnected()) return [];
    try {
        const q = query(collection(db, "users"), limit(1000)); 
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
    } catch (e: any) { 
      return []; 
    }
  }

  async syncCar(car: Car): Promise<void> {
    if (!this.isConnected()) return;
    try {
      const cleaned = cleanData(car);
      await setDoc(doc(db, "cars", car.id), { ...cleaned, lastSync: Timestamp.now() }, { merge: true });
    } catch (e) { console.error(e); }
  }

  async deleteCar(carId: string): Promise<void> {
    if (!this.isConnected()) return;
    try {
      await deleteDoc(doc(db, "cars", carId));
    } catch (e) { console.error(e); }
  }

  async fetchAllCars(): Promise<Car[]> {
    if (!this.isConnected()) return [];
    try {
      const snap = await getDocs(collection(db, "cars"));
      return snap.docs.map(d => d.data() as Car);
    } catch (e) { return []; }
  }

  async syncInvoice(invoice: Invoice): Promise<void> {
    if (!this.isConnected()) return;
    try {
      const cleaned = cleanData(invoice);
      await setDoc(doc(db, "invoices", invoice.id), { ...cleaned, lastSync: Timestamp.now() }, { merge: true });
    } catch (e) { console.error(e); }
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    if (!this.isConnected()) return;
    try {
      await deleteDoc(doc(db, "invoices", invoiceId));
    } catch (e) { console.error(e); }
  }

  async fetchAllInvoices(): Promise<Invoice[]> {
    if (!this.isConnected()) return [];
    try {
      const snap = await getDocs(collection(db, "invoices"));
      return snap.docs.map(d => d.data() as Invoice);
    } catch (e) { return []; }
  }

  async fetchUserCars(userId: string): Promise<Car[]> {
    if (!this.isConnected()) return [];
    try {
      const q = query(collection(db, "cars"), where("ownerId", "==", userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Car);
    } catch (e) { return []; }
  }

  async fetchUserInvoices(carId: string): Promise<Invoice[]> {
    if (!this.isConnected()) return [];
    try {
      const q = query(collection(db, "invoices"), where("carId", "==", carId));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Invoice);
    } catch (e) { return []; }
  }

  async deleteUser(userId: string): Promise<void> {
    if (!this.isConnected()) return;
    try {
      await deleteDoc(doc(db, "users", userId));
    } catch (e) { console.error(e); }
  }

  listenToAllUsers(callback: (users: User[]) => void) {
    if (!this.isConnected()) return null;
    return onSnapshot(collection(db, "users"), (snapshot) => {
      callback(snapshot.docs.map(doc => doc.data() as User));
    });
  }
}

export const cloud = CloudConnector.getInstance();
