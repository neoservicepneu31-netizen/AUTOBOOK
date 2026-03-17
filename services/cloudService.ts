
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
  getDoc,
  getDocFromServer
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { User, Car, Invoice } from '../types';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

const API_DISABLED_KEY = 'AUTOBOOK_CLOUD_API_DISABLED';
let db: any = null;
let auth: any = null;
let isRealFirebase = false;

try {
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "VOTRE_API_KEY") {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
        auth = getAuth(app);
        isRealFirebase = true;
        
        // Test connection
        const testConnection = async () => {
          try {
            await getDocFromServer(doc(db, 'test', 'connection'));
          } catch (error) {
            if(error instanceof Error && error.message.includes('the client is offline')) {
              console.error("Please check your Firebase configuration. The client is offline.");
            }
          }
        };
        testConnection();
    }
} catch (e) {
    console.error("❌ Erreur d'initialisation Firebase:", e);
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData.map((provider: any) => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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
    const path = `users/${user.id}`;
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
          handleFirestoreError(e, OperationType.WRITE, path);
        }
    }
  }

  async fetchUserByEmail(email: string): Promise<User | null> {
    if (!this.isConnected()) return null;
    const path = "users";
    try {
      const q = query(collection(db, "users"), where("email", "==", email.toLowerCase()), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { ...snap.docs[0].data(), id: snap.docs[0].id } as User;
      }
      return null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
      return null;
    }
  }

  async fetchAllUsersRaw(): Promise<User[]> {
    if (!this.isConnected()) return [];
    const path = "users";
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
    } catch (e: any) { 
      handleFirestoreError(e, OperationType.LIST, path);
      throw e;
    }
  }

  async fetchAllUsers(): Promise<User[]> {
    if (!this.isConnected()) return [];
    const path = "users";
    try {
        const q = query(collection(db, "users"), limit(1000)); 
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
    } catch (e: any) { 
      handleFirestoreError(e, OperationType.LIST, path);
      return []; 
    }
  }

  async syncCar(car: Car): Promise<void> {
    if (!this.isConnected()) return;
    const path = `cars/${car.id}`;
    try {
      const cleaned = cleanData(car);
      await setDoc(doc(db, "cars", car.id), { ...cleaned, lastSync: Timestamp.now() }, { merge: true });
    } catch (e) { 
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  async deleteCar(carId: string): Promise<void> {
    if (!this.isConnected()) return;
    const path = `cars/${carId}`;
    try {
      await deleteDoc(doc(db, "cars", carId));
    } catch (e) { 
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  }

  async fetchAllCars(): Promise<Car[]> {
    if (!this.isConnected()) return [];
    const path = "cars";
    try {
      const snap = await getDocs(collection(db, "cars"));
      return snap.docs.map(d => d.data() as Car);
    } catch (e) { 
      handleFirestoreError(e, OperationType.LIST, path);
      return []; 
    }
  }

  async syncInvoice(invoice: Invoice): Promise<void> {
    if (!this.isConnected()) return;
    const path = `invoices/${invoice.id}`;
    try {
      const cleaned = cleanData(invoice);
      await setDoc(doc(db, "invoices", invoice.id), { ...cleaned, lastSync: Timestamp.now() }, { merge: true });
    } catch (e) { 
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    if (!this.isConnected()) return;
    const path = `invoices/${invoiceId}`;
    try {
      await deleteDoc(doc(db, "invoices", invoiceId));
    } catch (e) { 
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  }

  async fetchAllInvoices(): Promise<Invoice[]> {
    if (!this.isConnected()) return [];
    const path = "invoices";
    try {
      const snap = await getDocs(collection(db, "invoices"));
      return snap.docs.map(d => d.data() as Invoice);
    } catch (e) { 
      handleFirestoreError(e, OperationType.LIST, path);
      return []; 
    }
  }

  async fetchUserCars(userId: string): Promise<Car[]> {
    if (!this.isConnected()) return [];
    const path = "cars";
    try {
      const q = query(collection(db, "cars"), where("ownerId", "==", userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Car);
    } catch (e) { 
      handleFirestoreError(e, OperationType.LIST, path);
      return []; 
    }
  }

  async fetchUserInvoices(carId: string): Promise<Invoice[]> {
    if (!this.isConnected()) return [];
    const path = "invoices";
    try {
      const q = query(collection(db, "invoices"), where("carId", "==", carId));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Invoice);
    } catch (e) { 
      handleFirestoreError(e, OperationType.LIST, path);
      return []; 
    }
  }

  async deleteUser(userId: string): Promise<void> {
    if (!this.isConnected()) return;
    const path = `users/${userId}`;
    try {
      await deleteDoc(doc(db, "users", userId));
    } catch (e) { 
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  }

  listenToAllUsers(callback: (users: User[]) => void) {
    if (!this.isConnected()) return null;
    const path = "users";
    return onSnapshot(collection(db, "users"), (snapshot) => {
      callback(snapshot.docs.map(doc => doc.data() as User));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }
}

export const cloud = CloudConnector.getInstance();
