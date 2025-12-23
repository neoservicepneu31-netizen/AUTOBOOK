

import React, { useState, useEffect, useRef } from 'react';
import { Screen, User, Car, Invoice, AIStatus, TechnicalSpecs } from './types';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { GarageScreen } from './components/GarageScreen';
import { AddInvoiceScreen } from './components/AddInvoiceScreen';
import { SellCarScreen } from './components/SellCarScreen';
import { BuyCarScreen } from './components/BuyCarScreen';
import { AssistanceScreen } from './components/AssistanceScreen';
import { AdminDashboardScreen } from './components/AdminDashboardScreen';
import { PaymentModal, PurchaseType } from './components/PaymentModal';
import { calculateMaintenanceStatus } from './services/mechanicRules';
import { db } from './services/storageService'; // Nouveau Backend
import { Cloud, Crown, Wifi, Loader2, ServerCrash } from 'lucide-react';

const App: React.FC = () => {
  // --- ETAT GLOBAL ---
  const [screen, setScreen] = useState<Screen>(Screen.AUTH);
  const [user, setUser] = useState<User | null>(null);
  
  // Base de données locale (Miroir du "Serveur")
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);

  // Flags Système
  const [isDatabaseReady, setIsDatabaseReady] = useState(false); // VERROU DE SÉCURITÉ
  const [isSyncing, setIsSyncing] = useState(false);
  const [showPayment, setShowPayment] = useState<PurchaseType | null>(null);
  
  // Ref pour garantir que le chargement initial est terminé avant toute sauvegarde
  const initialLoadDone = useRef(false);

  // Données filtrées pour l'utilisateur courant
  const [activeCarId, setActiveCarId] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatus>({ status: 'neutral', message: 'Chargement...' });

  // --- 1. INITIALISATION (CHARGEMENT "SERVEUR") ---
  useEffect(() => {
    const initApp = async () => {
      console.log("[SYSTEM] Démarrage AutoBook - Connexion Base de Données...");
      
      try {
        // Chargement des données depuis le service de stockage (avec délai simulé pour stabilité)
        // On force la lecture synchrone immédiate pour éviter les états vides
        const users = db.users.getAll();
        const cars = db.cars.getAll();
        const invoices = db.invoices.getAll();

        console.log(`[SYSTEM] Données chargées : ${users.length} utilisateurs, ${cars.length} véhicules.`);

        // Mise à jour de l'état React
        setAllUsers(users);
        setAllCars(cars);
        setAllInvoices(invoices);

        // Marquage immédiat que le chargement est fait
        initialLoadDone.current = true;
        
        // Petite pause de sécurité avant d'autoriser les écritures
        setTimeout(() => {
            setIsDatabaseReady(true); 
            console.log("[SYSTEM] Verrouillage écriture levé. App prête.");
        }, 500);

        // Restauration Session Utilisateur
        const sessionId = db.session.get();
        if (sessionId) {
          const foundUser = users.find(u => u.id === sessionId);
          if (foundUser) {
            console.log(`[SYSTEM] Session restaurée : ${foundUser.email}`);
            setUser(foundUser);
            
            // Restauration Voiture Active
            const savedCarId = localStorage.getItem('AUTOBOOK_ACTIVE_CAR');
            if (savedCarId && cars.some(c => c.id === savedCarId)) {
                setActiveCarId(savedCarId);
                // Redirection intelligente
                if (foundUser.role === 'admin') setScreen(Screen.ADMIN_DASHBOARD);
                else setScreen(Screen.GARAGE); 
            } else {
                setScreen(foundUser.role === 'admin' ? Screen.ADMIN_DASHBOARD : Screen.GARAGE);
            }
          }
        }
      } catch (error) {
        console.error("[SYSTEM] Erreur critique au chargement", error);
        alert("Erreur critique de chargement des données. Veuillez contacter le support.");
      }
    };

    initApp();
  }, []);

  // --- 2. SYNCHRONISATION SÉCURISÉE (SAUVEGARDE AUTO) ---
  
  // Persistance Active Car ID
  useEffect(() => {
    if (activeCarId) {
        localStorage.setItem('AUTOBOOK_ACTIVE_CAR', activeCarId);
    } else {
        localStorage.removeItem('AUTOBOOK_ACTIVE_CAR');
    }
  }, [activeCarId]);

  // Watch Users - SÉCURISÉ
  useEffect(() => {
    // NE JAMAIS SAUVEGARDER SI LA BASE N'EST PAS PRÊTE OU SI VIDE (Sauf si intentionnel, mais rare ici)
    if (!isDatabaseReady || !initialLoadDone.current) return;
    
    if (allUsers.length > 0) {
        setIsSyncing(true);
        const success = db.users.saveAll(allUsers);
        if(!success) console.error("Echec sauvegarde Users");
        const timer = setTimeout(() => setIsSyncing(false), 800);
        return () => clearTimeout(timer);
    }
  }, [allUsers, isDatabaseReady]);

  // Watch Cars - SÉCURISÉ
  useEffect(() => {
    if (!isDatabaseReady || !initialLoadDone.current) return;
    
    setIsSyncing(true);
    db.cars.saveAll(allCars);
    const timer = setTimeout(() => setIsSyncing(false), 800);
    return () => clearTimeout(timer);
  }, [allCars, isDatabaseReady]);

  // Watch Invoices - SÉCURISÉ
  useEffect(() => {
    if (!isDatabaseReady || !initialLoadDone.current) return;

    setIsSyncing(true);
    db.invoices.saveAll(allInvoices);
    const timer = setTimeout(() => setIsSyncing(false), 800);
    return () => clearTimeout(timer);
  }, [allInvoices, isDatabaseReady]);


  // --- LOGIQUE METIER ---

  const userCars = allCars.filter(c => c.ownerId === user?.id);
  const activeCar = userCars.find(c => c.id === activeCarId) || null;
  const activeCarInvoices = allInvoices.filter(inv => inv.carId === activeCarId);

  // Calcul IA
  useEffect(() => {
    if (activeCar) {
      if (activeCarInvoices.length > 0) {
        const status = calculateMaintenanceStatus(activeCar, activeCarInvoices);
        setAiStatus(status);
      } else {
        setAiStatus({
          status: 'warning',
          message: 'Historique vide. Ajoutez une facture ou un relevé km pour activer l\'IA.',
          nextDeadline: 'Inconnue'
        });
      }
    }
  }, [activeCar, activeCarInvoices]);

  // --- HANDLERS ---

  const handleLogin = (loggedInUser: User) => {
    setAllUsers(prevUsers => {
      // Stratégie de fusion intelligente : On met à jour l'utilisateur s'il existe, sinon on l'ajoute
      const existingIndex = prevUsers.findIndex(u => u.id === loggedInUser.id);
      let newUsersList = [...prevUsers];
      
      if (existingIndex >= 0) {
        newUsersList[existingIndex] = loggedInUser;
      } else {
        newUsersList.push(loggedInUser);
      }
      
      // Force Save immédiat pour garantir l'inscription
      db.users.saveAll(newUsersList);
      return newUsersList;
    });

    setUser(loggedInUser);
    db.session.set(loggedInUser.id);
    
    if (loggedInUser.role === 'admin') {
      setScreen(Screen.ADMIN_DASHBOARD);
    } else {
      setScreen(Screen.GARAGE);
    }
  };

  const handleLogout = () => {
    setUser(null);
    db.session.clear();
    setScreen(Screen.AUTH);
  };

  const handleCarOnboarding = (newCar: Car) => {
    if (!user) return;
    const carWithOwner = { ...newCar, ownerId: user.id };
    
    setAllCars(prev => {
        const updated = [...prev, carWithOwner];
        db.cars.saveAll(updated); // Force save
        return updated;
    });
    
    setActiveCarId(newCar.id);
    setScreen(Screen.DASHBOARD);
  };

  const handleSaveInvoice = (invoice: Invoice, detectedSpecs?: TechnicalSpecs) => {
    setAllInvoices(prev => {
        const updated = [invoice, ...prev];
        db.invoices.saveAll(updated); // Force save
        return updated;
    });

    if (detectedSpecs && activeCarId) {
       handleUpdateSpecs(detectedSpecs);
    } else {
       setScreen(Screen.DASHBOARD);
    }
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce document définitivement ?")) {
        setAllInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    }
  };

  const handleUpdateSpecs = (specs: TechnicalSpecs) => {
    if (!activeCarId) return;
    setAllCars(prev => prev.map(c => {
      if (c.id === activeCarId) {
        const newSpecs = { ...c.specs, ...specs };
        (Object.keys(newSpecs) as (keyof TechnicalSpecs)[]).forEach(key => {
            if (!newSpecs[key]) delete newSpecs[key];
        });
        return { ...c, specs: newSpecs };
      }
      return c;
    }));
    setScreen(Screen.DASHBOARD);
  };

  const handleUpdateCar = (updatedCar: Car) => {
    setAllCars(prev => prev.map(c => c.id === updatedCar.id ? updatedCar : c));
  };

  const handleDeleteCar = () => {
    if (!activeCarId) return;
    if (window.confirm("CONFIRMATION : Supprimer définitivement ce véhicule et ses factures ?")) {
      setAllCars(prev => prev.filter(c => c.id !== activeCarId));
      setAllInvoices(prev => prev.filter(i => i.carId !== activeCarId));
      setActiveCarId(null);
      setScreen(Screen.GARAGE);
    }
  };

  const handleSellCar = (buyerEmail: string) => {
    if (!activeCarId) return;
    setAllCars(prev => prev.filter(c => c.id !== activeCarId));
    setActiveCarId(null);
    alert(`Véhicule transféré à ${buyerEmail}. En attente d'acceptation.`);
    setScreen(Screen.GARAGE);
  };

  const handleBuyCarImport = (newCar: Car, newInvoices: Invoice[]) => {
    if (!user) return;
    const carWithOwner = { ...newCar, ownerId: user.id };
    setAllCars(prev => [...prev, carWithOwner]);
    setAllInvoices(prev => [...prev, ...newInvoices]);
    setActiveCarId(newCar.id);
    setScreen(Screen.DASHBOARD);
  };

  const handlePaymentSuccess = (type: PurchaseType) => {
    if (!user) return;
    const updatedUser = { ...user };
    if (type === 'premium') {
      updatedUser.isPremium = true;
      updatedUser.hasSivAccess = true;
      updatedUser.hasAssistanceAccess = true;
    } else if (type === 'siv') {
      updatedUser.hasSivAccess = true;
    } else if (type === 'assistance') {
      updatedUser.hasAssistanceAccess = true;
    }
    handleLogin(updatedUser); 
    setShowPayment(null);
    alert("✅ Paiement validé ! Fonctionnalité débloquée.");
  };

  // --- RENDU ---

  if (!isDatabaseReady) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <Wifi className="animate-pulse text-red-500 mb-4" size={48} />
        <h1 className="text-2xl font-bold mb-2">AUTOBOOK</h1>
        <p className="text-gray-400 text-sm">Chargement Sécurisé du Garage...</p>
        <p className="text-[10px] text-gray-600 mt-2 font-mono">Verrouillage écriture actif</p>
      </div>
    );
  }

  // --- PROTECTION CONTRE LES ECRANS BLANCS (NULL) ---
  const handleMissingCar = () => {
    // Redirection automatique si on est perdu
    if (screen === Screen.ADD_INVOICE || screen === Screen.DASHBOARD) {
        setTimeout(() => setScreen(Screen.GARAGE), 0);
    }
    return (
      <div className="min-h-screen bg-nsp-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  };

  const renderCurrentScreen = () => {
    switch (screen) {
      case Screen.AUTH:
        return <AuthScreen 
          onLogin={handleLogin} 
          onForgotPasswordRequest={(email) => {
            const exists = allUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
            if(exists) {
              setAllUsers(prev => prev.map(u => u.email.toLowerCase() === email.toLowerCase() ? {...u, passwordResetRequested: true} : u));
              return true;
            }
            return false;
          }} 
          existingUsers={allUsers} 
        />;
        
      case Screen.ADMIN_DASHBOARD:
        if (user?.role !== 'admin') return <div className="text-white p-10">Accès Refusé</div>;
        return <AdminDashboardScreen 
          currentUser={user} 
          allUsers={allUsers} 
          allCars={allCars} 
          allInvoices={allInvoices} 
          onLogout={handleLogout} 
        />;

      case Screen.GARAGE:
        return <GarageScreen 
          user={user!} 
          cars={userCars} 
          onSelectCar={(id) => { setActiveCarId(id); setScreen(Screen.DASHBOARD); }} 
          onAddCar={() => setScreen(Screen.ONBOARDING)} 
          onLogout={handleLogout} 
        />;

      case Screen.ONBOARDING:
        return <OnboardingScreen 
          onSave={handleCarOnboarding} 
          onCancel={userCars.length > 0 ? () => setScreen(Screen.GARAGE) : undefined}
          canUseSiv={!!(user?.isPremium || user?.hasSivAccess)}
          onRequireSiv={() => setShowPayment('siv')}
        />;

      case Screen.DASHBOARD:
        if (!activeCar) return handleMissingCar();
        return <DashboardScreen 
          user={user!} 
          car={activeCar} 
          invoices={activeCarInvoices} 
          aiStatus={aiStatus} 
          onBackToGarage={() => setScreen(Screen.GARAGE)} 
          onAddInvoice={() => setScreen(Screen.ADD_INVOICE)} 
          onSellCar={() => setScreen(Screen.SELL_CAR)} 
          onBuyCar={() => setScreen(Screen.BUY_CAR)} 
          onAssistance={() => setScreen(Screen.ASSISTANCE)} 
          onDeleteCar={handleDeleteCar} 
          onUpdateSpecs={handleUpdateSpecs} 
          onUpdateCar={handleUpdateCar}
          onDeleteInvoice={handleDeleteInvoice}
        />;

      case Screen.ADD_INVOICE:
        if (!activeCar) return handleMissingCar();
        return <AddInvoiceScreen 
          carId={activeCar.id} 
          onSave={handleSaveInvoice} 
          onCancel={() => setScreen(Screen.DASHBOARD)} 
        />;

      case Screen.SELL_CAR:
        if (!activeCar) return handleMissingCar();
        return <SellCarScreen 
          car={activeCar} 
          invoices={activeCarInvoices} 
          onCancel={() => setScreen(Screen.DASHBOARD)} 
          onConfirmTransfer={handleSellCar} 
        />;
      
      case Screen.BUY_CAR:
        return <BuyCarScreen 
          onCancel={() => setScreen(Screen.GARAGE)} 
          onImportSuccess={handleBuyCarImport} 
        />;

      case Screen.ASSISTANCE:
        return <AssistanceScreen 
          onBack={() => setScreen(Screen.DASHBOARD)} 
          canUseAssistance={!!(user?.isPremium || user?.hasAssistanceAccess)}
          onRequireAccess={() => setShowPayment('assistance')}
        />;

      default:
        return <div className="text-white p-10">Erreur 404 : Écran Inconnu</div>;
    }
  };

  return (
    // CORRECTION GLOBALE : Activation du scroll vertical et hauteur dynamique
    <div className="max-w-md mx-auto bg-nsp-bg shadow-2xl h-[100dvh] relative overflow-y-auto overflow-x-hidden">
      {isSyncing && (
        <div className="fixed top-4 right-4 z-50 bg-black/80 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border border-white/10 shadow-xl backdrop-blur-md">
           <Cloud size={12} className="text-green-500 animate-pulse" /> 
           <span>Sync...</span>
        </div>
      )}

      {user?.isPremium && screen !== Screen.AUTH && (
        <div className="fixed top-4 left-4 z-50 bg-yellow-500 text-black px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
           <Crown size={10} fill="black" /> Premium
        </div>
      )}

      <div className={screen === Screen.ADMIN_DASHBOARD ? "fixed inset-0 z-40 bg-black overflow-auto" : "min-h-full"}>
         {renderCurrentScreen()}
      </div>

      {showPayment && (
        <PaymentModal 
          feature={showPayment} 
          onClose={() => setShowPayment(null)} 
          onSuccess={handlePaymentSuccess} 
        />
      )}
    </div>
  );
};

export default App;
