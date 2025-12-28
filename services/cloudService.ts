
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  onSnapshot, 
  doc, 
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { User } from '../types';

/**
 * ---------------------------------------------------------
 * CONFIGURATION FIREBASE - PROJET AUTOBOOK-NSP
 * ---------------------------------------------------------
 */
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
let apiNeedsActivation = localStorage.getItem(API_DISABLED_KEY) === 'true';

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
    return isRealFirebase && !apiNeedsActivation;
  }

  public isApiDisabled(): boolean {
    return apiNeedsActivation;
  }

  public resetActivationFlag(): void {
    apiNeedsActivation = false;
    localStorage.removeItem(API_DISABLED_KEY);
    console.log("🔄 Réinitialisation du flag Cloud...");
  }

  private markApiDisabled(): void {
    apiNeedsActivation = true;
    localStorage.setItem(API_DISABLED_KEY, 'true');
  }

  // SYNC : Envoie l'utilisateur vers le serveur central
  async syncUser(user: User): Promise<void> {
    if (!isRealFirebase || apiNeedsActivation) return;

    try {
        const userRef = doc(db, "users", user.id);
        await setDoc(userRef, {
            id: user.id,
            name: user.name,
            email: user.email,
            clientType: user.clientType || 'new',
            role: user.role,
            lastSync: Timestamp.now(),
            isPremium: !!user.isPremium,
            source: window.location.hostname
        }, { merge: true });
    } catch (e: any) {
        // Erreur critique : base absente ou permissions
        if (e.code === 'not-found' || e.code === 'permission-denied' || e.message?.includes('not-found')) {
            this.markApiDisabled();
        }
        console.error("Erreur Sync Cloud:", e);
    }
  }

  // FETCH : L'ADMIN récupère la liste globale
  async fetchAllUsers(): Promise<User[]> {
    if (!isRealFirebase || apiNeedsActivation) {
        return JSON.parse(localStorage.getItem('AUTOBOOK_DB_USERS_V2') || '[]');
    }

    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const users: User[] = [];
        querySnapshot.forEach((doc) => {
            users.push(doc.data() as User);
        });
        
        if (users.length > 0) {
            localStorage.setItem('AUTOBOOK_DB_USERS_V2', JSON.stringify(users));
        }
        
        return users;
    } catch (e: any) {
        if (e.code === 'not-found' || e.code === 'permission-denied' || e.message?.includes('not-found')) {
            this.markApiDisabled();
        }
        return JSON.parse(localStorage.getItem('AUTOBOOK_DB_USERS_V2') || '[]');
    }
  }

  // LISTEN : Ecouteur en temps réel
  listenToAllUsers(callback: (users: User[]) => void) {
    if (!isRealFirebase || apiNeedsActivation) return null;

    try {
        return onSnapshot(collection(db, "users"), (snapshot) => {
            const users: User[] = [];
            snapshot.forEach((doc) => {
                users.push(doc.data() as User);
            });
            callback(users);
        }, (error) => {
            if (error.code === 'not-found' || error.code === 'permission-denied' || error.message?.includes('not-found')) {
                this.markApiDisabled();
            }
        });
    } catch (e) {
        return null;
    }
  }
}

export const cloud = CloudConnector.getInstance();
