
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
import { Cloud, Loader2 } from 'lucide-react';

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
        const users = db.users.getAll();
        const cars = db.cars.getAll();
        const invoices = db.invoices.getAll();

        setAllUsers(users);
        setAllCars(cars);
        setAllInvoices(invoices);

        initialLoadDone.current = true;
        
        setTimeout(() => {
            setIsDatabaseReady(true); 
            console.log("[SYSTEM] Verrouillage écriture levé. App prête.");
        }, 500);

        const sessionId = db.session.get();
        if (sessionId) {
          const foundUser = users.find(u => u.id === sessionId);
          if (foundUser) {
            setUser(foundUser);
            const savedCarId = localStorage.getItem('AUTOBOOK_ACTIVE_CAR');
            if (savedCarId && cars.some(c => c.id === savedCarId)) {
                setActiveCarId(savedCarId);
                if (foundUser.role === 'admin') setScreen(Screen.ADMIN_DASHBOARD);
                else setScreen(Screen.GARAGE); 
            } else {
                setScreen(foundUser.role === 'admin' ? Screen.ADMIN_DASHBOARD : Screen.GARAGE);
            }
          }
        }
      } catch (error) {
        console.error("[SYSTEM] Erreur critique au chargement", error);
      }
    };

    initApp();
  }, []);

  // --- 2. SYNCHRONISATION SÉCURISÉE ---
  useEffect(() => {
    if (!isDatabaseReady || !initialLoadDone.current) return;
    if (allUsers.length >= 0) { // Autoriser vide si admin supprime tout
        setIsSyncing(true);
        db.users.saveAll(allUsers);
        const timer = setTimeout(() => setIsSyncing(false), 800);
        return () => clearTimeout(timer);
    }
  }, [allUsers, isDatabaseReady]);

  useEffect(() => {
    if (!isDatabaseReady || !initialLoadDone.current) return;
    setIsSyncing(true);
    db.cars.saveAll(allCars);
    const timer = setTimeout(() => setIsSyncing(false), 800);
    return () => clearTimeout(timer);
  }, [allCars, isDatabaseReady]);

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

  useEffect(() => {
    if (activeCar) {
      const status = calculateMaintenanceStatus(activeCar, activeCarInvoices);
      setAiStatus(status);
    }
  }, [activeCar, activeCarInvoices]);

  // --- HANDLERS ---
  const handleLogin = (loggedInUser: User) => {
    setAllUsers(prevUsers => {
      const existingIndex = prevUsers.findIndex(u => u.id === loggedInUser.id);
      let newUsersList = [...prevUsers];
      if (existingIndex >= 0) newUsersList[existingIndex] = loggedInUser;
      else newUsersList.push(loggedInUser);
      db.users.saveAll(newUsersList);
      return newUsersList;
    });
    setUser(loggedInUser);
    db.session.set(loggedInUser.id);
    if (loggedInUser.role === 'admin') setScreen(Screen.ADMIN_DASHBOARD);
    else setScreen(Screen.GARAGE);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleDeleteUser = (userId: string) => {
    setAllUsers(prev => prev.filter(u => u.id !== userId));
    setAllCars(prev => prev.filter(c => c.ownerId !== userId));
    // Les factures sont liées aux cars qui sont supprimés, on pourrait filtrer invoices aussi
  };

  const handleLogout = () => {
    setUser(null);
    db.session.clear();
    setScreen(Screen.AUTH);
  };

  const handleCarOnboarding = (newCar: Car) => {
    if (!user) return;
    const carWithOwner = { ...newCar, ownerId: user.id };
    setAllCars(prev => [...prev, carWithOwner]);
    setActiveCarId(newCar.id);
    setScreen(Screen.DASHBOARD);
  };

  const handleSaveInvoice = (invoice: Invoice, detectedSpecs?: TechnicalSpecs) => {
    setAllInvoices(prev => [invoice, ...prev]);
    if (detectedSpecs && activeCarId) handleUpdateSpecs(detectedSpecs);
    else setScreen(Screen.DASHBOARD);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (window.confirm("Supprimer ce document ?")) {
        setAllInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    }
  };

  const handleUpdateSpecs = (specs: TechnicalSpecs) => {
    if (!activeCarId) return;
    setAllCars(prev => prev.map(c => c.id === activeCarId ? { ...c, specs: { ...c.specs, ...specs } } : c));
    setScreen(Screen.DASHBOARD);
  };

  const handleDeleteCar = () => {
    if (!activeCarId) return;
    if (window.confirm("Supprimer définitivement ?")) {
      setAllCars(prev => prev.filter(c => c.id !== activeCarId));
      setAllInvoices(prev => prev.filter(i => i.carId !== activeCarId));
      setActiveCarId(null);
      setScreen(Screen.GARAGE);
    }
  };

  const handlePaymentSuccess = (type: PurchaseType) => {
    if (!user) return;
    const updatedUser = { ...user };
    if (type === 'premium') { updatedUser.isPremium = true; updatedUser.hasSivAccess = true; updatedUser.hasAssistanceAccess = true; }
    else if (type === 'siv') updatedUser.hasSivAccess = true;
    else if (type === 'assistance') updatedUser.hasAssistanceAccess = true;
    handleLogin(updatedUser); 
    setShowPayment(null);
  };

  const renderCurrentScreen = () => {
    switch (screen) {
      case Screen.AUTH:
        return <AuthScreen onLogin={handleLogin} onForgotPasswordRequest={(email) => {
            const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
            if(user) {
              handleUpdateUser({...user, passwordResetRequested: true});
              return true;
            }
            return false;
          }} existingUsers={allUsers} />;
      case Screen.ADMIN_DASHBOARD:
        return <AdminDashboardScreen currentUser={user!} allUsers={allUsers} allCars={allCars} allInvoices={allInvoices} onLogout={handleLogout} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} />;
      case Screen.GARAGE:
        return <GarageScreen user={user!} cars={userCars} onSelectCar={(id) => { setActiveCarId(id); setScreen(Screen.DASHBOARD); }} onAddCar={() => setScreen(Screen.ONBOARDING)} onLogout={handleLogout} />;
      case Screen.ONBOARDING:
        return <OnboardingScreen onSave={handleCarOnboarding} onCancel={userCars.length > 0 ? () => setScreen(Screen.GARAGE) : undefined} canUseSiv={!!(user?.isPremium || user?.hasSivAccess)} onRequireSiv={() => setShowPayment('siv')} />;
      case Screen.DASHBOARD:
        if (!activeCar) return <div className="h-screen bg-black" />;
        return <DashboardScreen user={user!} car={activeCar} invoices={activeCarInvoices} aiStatus={aiStatus} onBackToGarage={() => setScreen(Screen.GARAGE)} onAddInvoice={() => setScreen(Screen.ADD_INVOICE)} onSellCar={() => setScreen(Screen.SELL_CAR)} onBuyCar={() => setScreen(Screen.BUY_CAR)} onAssistance={() => setScreen(Screen.ASSISTANCE)} onDeleteCar={handleDeleteCar} onUpdateSpecs={handleUpdateSpecs} onUpdateCar={(c) => setAllCars(prev => prev.map(x => x.id === c.id ? c : x))} onDeleteInvoice={handleDeleteInvoice} />;
      case Screen.ADD_INVOICE:
        return <AddInvoiceScreen carId={activeCarId!} onSave={handleSaveInvoice} onCancel={() => setScreen(Screen.DASHBOARD)} />;
      case Screen.ASSISTANCE:
        return <AssistanceScreen onBack={() => setScreen(Screen.DASHBOARD)} canUseAssistance={!!(user?.isPremium || user?.hasAssistanceAccess)} onRequireAccess={() => setShowPayment('assistance')} />;
      default:
        return <AuthScreen onLogin={handleLogin} onForgotPasswordRequest={() => false} existingUsers={allUsers} />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-nsp-bg shadow-2xl h-[100dvh] relative overflow-y-auto overflow-x-hidden">
      {isSyncing && (
        <div className="fixed top-4 right-4 z-50 bg-black/80 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border border-white/10 shadow-xl backdrop-blur-md">
           <Cloud size={12} className="text-green-500 animate-pulse" /> <span>Cloud Sync...</span>
        </div>
      )}
      <div className={screen === Screen.ADMIN_DASHBOARD ? "fixed inset-0 z-40 bg-black overflow-auto" : "min-h-full"}>
         {renderCurrentScreen()}
      </div>
      {showPayment && <PaymentModal feature={showPayment} onClose={() => setShowPayment(null)} onSuccess={handlePaymentSuccess} />}
    </div>
  );
};

export default App;
