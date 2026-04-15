
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
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { User, Car, Invoice, AppNotification } from '../types';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

const config = (firebaseConfig as any).default || firebaseConfig;

const API_DISABLED_KEY = 'AUTOBOOK_CLOUD_API_DISABLED';
let db: any = null;
let auth: any = null;
let isRealFirebase = false;

console.log("🔍 Firebase Config Check:", {
  hasApiKey: !!config.apiKey,
  apiKey: config.apiKey ? (config.apiKey.substring(0, 5) + "...") : "MISSING",
  projectId: config.projectId
});

try {
    if (config.apiKey && config.apiKey !== "VOTRE_API_KEY") {
        const app = initializeApp(config);
        db = getFirestore(app, config.firestoreDatabaseId);
        auth = getAuth(app);
        isRealFirebase = true;
        console.log("✅ Firebase Initialisé avec succès");
        
        // Test connection
        const testConnection = async () => {
          try {
            await getDocFromServer(doc(db, 'test', 'connection'));
            console.log("📡 Connexion Firestore OK");
          } catch (error) {
            if(error instanceof Error && error.message.includes('the client is offline')) {
              console.error("⚠️ Please check your Firebase configuration. The client is offline.");
            } else {
              console.warn("ℹ️ Firestore connection test result:", error);
            }
          }
        };
        testConnection();
    } else {
        console.warn("⚠️ Firebase non configuré (Clé API manquante ou placeholder)");
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

const ADMIN_EMAILS = ["neoservicepneu31@gmail.com", "fernand1802@gmail.com"];

class CloudConnector {
  private static instance: CloudConnector;
  private constructor() {}

  public static getInstance(): CloudConnector {
    if (!CloudConnector.instance) {
      CloudConnector.instance = new CloudConnector();
    }
    return CloudConnector.instance;
  }

  private getRoleByEmail(email: string | null | undefined, currentRole: 'user' | 'admin' = 'user'): 'user' | 'admin' {
    if (email && ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === email.toLowerCase())) {
      return 'admin';
    }
    return currentRole;
  }

  public isConnected(): boolean {
    // We only check isRealFirebase. The API_DISABLED_KEY was too aggressive.
    return isRealFirebase;
  }

  public getAuth() {
    return auth;
  }

  public async login(email: string, password: string): Promise<User> {
    if (!this.isConnected()) throw new Error("Cloud non connecté");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Récupérer les infos additionnelles du profil dans Firestore
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        const role = this.getRoleByEmail(firebaseUser.email || email, userData.role);
        
        // Si le rôle a changé (ex: promu admin via email), on synchronise
        if (role !== userData.role) {
          const updatedUser = { ...userData, uid: firebaseUser.uid, role };
          await setDoc(doc(db, "users", firebaseUser.uid), updatedUser);
          return updatedUser;
        }
        
        return { ...userData, uid: firebaseUser.uid } as User;
      } else {
        // Créer un profil par défaut si inexistant (cas rare)
        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || email,
          name: firebaseUser.displayName || email.split('@')[0],
          role: this.getRoleByEmail(firebaseUser.email || email, 'user'),
          createdAt: new Date().toISOString()
        };
        await this.syncUser(newUser);
        return newUser;
      }
    } catch (e: any) {
      console.error("Login Error:", e);
      throw e;
    }
  }

  public async register(email: string, password: string, name: string, role: 'user' | 'admin' = 'user'): Promise<User> {
    if (!this.isConnected()) throw new Error("Cloud non connecté");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const newUser: User = {
        id: firebaseUser.uid,
        email,
        name,
        role: this.getRoleByEmail(email, role),
        createdAt: new Date().toISOString(),
        isValidated: true
      };
      
      await this.syncUser(newUser);
      return newUser;
    } catch (e: any) {
      console.error("Register Error:", e);
      throw e;
    }
  }

  public async loginWithGoogle(): Promise<User> {
    if (!this.isConnected()) throw new Error("Cloud non connecté");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;
      
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        const role = this.getRoleByEmail(firebaseUser.email, userData.role);
        
        if (role !== userData.role) {
          const updatedUser = { ...userData, id: firebaseUser.uid, role };
          await this.syncUser(updatedUser);
          return updatedUser;
        }
        
        return { ...userData, id: firebaseUser.uid } as User;
      } else {
        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Utilisateur',
          role: this.getRoleByEmail(firebaseUser.email, 'user'),
          createdAt: new Date().toISOString(),
          isValidated: true
        };
        await this.syncUser(newUser);
        return newUser;
      }
    } catch (e: any) {
      console.error("Google Login Error:", e);
      throw e;
    }
  }

  public async logout(): Promise<void> {
    if (!this.isConnected()) return;
    await signOut(auth);
  }

  public onAuthStateChanged(callback: (user: User | null) => void) {
    if (!this.isConnected()) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            const role = this.getRoleByEmail(firebaseUser.email, userData.role);
            callback({ ...userData, id: firebaseUser.uid, role } as User);
          } else {
            callback({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '',
              role: this.getRoleByEmail(firebaseUser.email, 'user')
            } as User);
          }
        } catch (e) {
          console.error("Auth State Change Error:", e);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  public async resetPassword(email: string): Promise<void> {
    if (!this.isConnected()) return;
    await sendPasswordResetEmail(auth, email);
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
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Car));
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
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Invoice));
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
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Car));
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
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Invoice));
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

  async sendNotification(notification: AppNotification): Promise<void> {
    if (!this.isConnected()) return;
    const path = `notifications/${notification.id}`;
    try {
      const cleaned = cleanData(notification);
      await setDoc(doc(db, "notifications", notification.id), { ...cleaned, lastSync: Timestamp.now() }, { merge: true });
    } catch (e) { 
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    if (!this.isConnected()) return;
    const path = `notifications/${notificationId}`;
    try {
      await deleteDoc(doc(db, "notifications", notificationId));
    } catch (e) { 
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  }

  listenToUserNotifications(userId: string, callback: (notifications: AppNotification[]) => void) {
    if (!this.isConnected()) return null;
    const path = "notifications";
    const q = query(collection(db, "notifications"), where("userId", "==", userId), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AppNotification)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    if (!this.isConnected()) return;
    const path = `notifications/${notificationId}`;
    try {
      await setDoc(doc(db, "notifications", notificationId), { read: true }, { merge: true });
    } catch (e) { 
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  async markNotificationAsDone(notificationId: string): Promise<void> {
    if (!this.isConnected()) return;
    const path = `notifications/${notificationId}`;
    try {
      await setDoc(doc(db, "notifications", notificationId), { actionDone: true, read: true }, { merge: true });
    } catch (e) { 
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }
}

export const cloud = CloudConnector.getInstance();
