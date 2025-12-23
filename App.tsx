
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
import { db } from './services/storageService'; 
import { Cloud, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>(Screen.AUTH);
  const [user, setUser] = useState<User | null>(null);
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);

  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showPayment, setShowPayment] = useState<PurchaseType | null>(null);
  
  const initialLoadDone = useRef(false);
  const [activeCarId, setActiveCarId] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatus>({ status: 'neutral', message: 'Chargement...' });

  const loadAllData = () => {
    const users = db.users.getAll();
    const cars = db.cars.getAll();
    const invoices = db.invoices.getAll();
    setAllUsers(users);
    setAllCars(cars);
    setAllInvoices(invoices);
  };

  useEffect(() => {
    const initApp = async () => {
      loadAllData();
      initialLoadDone.current = true;
      setTimeout(() => setIsDatabaseReady(true), 500);

      const sessionId = db.session.get();
      if (sessionId) {
        const users = db.users.getAll();
        const foundUser = users.find(u => u.id === sessionId);
        if (foundUser) {
          setUser(foundUser);
          if (foundUser.role === 'admin') {
            db.users.seedGlobal(); // Activer la simulation pour Admin
            loadAllData();
            setScreen(Screen.ADMIN_DASHBOARD);
          } else {
            const savedCarId = localStorage.getItem('AUTOBOOK_ACTIVE_CAR');
            const cars = db.cars.getAll();
            if (savedCarId && cars.some(c => c.id === savedCarId)) {
                setActiveCarId(savedCarId);
                setScreen(Screen.DASHBOARD);
            } else {
                setScreen(Screen.GARAGE);
            }
          }
        }
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (!isDatabaseReady || !initialLoadDone.current) return;
    setIsSyncing(true);
    db.users.saveAll(allUsers);
    const timer = setTimeout(() => setIsSyncing(false), 800);
    return () => clearTimeout(timer);
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

  const userCars = allCars.filter(c => c.ownerId === user?.id);
  const activeCar = userCars.find(c => c.id === activeCarId) || null;
  const activeCarInvoices = allInvoices.filter(inv => inv.carId === activeCarId);

  useEffect(() => {
    if (activeCar) {
      setAiStatus(calculateMaintenanceStatus(activeCar, activeCarInvoices));
    }
  }, [activeCar, activeCarInvoices]);

  const handleLogin = (loggedInUser: User) => {
    if (loggedInUser.role === 'admin') {
      db.users.seedGlobal(); // Simulation pour le gérant
    }
    setAllUsers(prev => {
      const idx = prev.findIndex(u => u.id === loggedInUser.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = loggedInUser;
        return copy;
      }
      return [...prev, loggedInUser];
    });
    setUser(loggedInUser);
    db.session.set(loggedInUser.id);
    loadAllData();
    setScreen(loggedInUser.role === 'admin' ? Screen.ADMIN_DASHBOARD : Screen.GARAGE);
  };

  const handleUpdateUser = (u: User) => setAllUsers(prev => prev.map(x => x.id === u.id ? u : x));
  const handleDeleteUser = (id: string) => {
    setAllUsers(prev => prev.filter(u => u.id !== id));
    setAllCars(prev => prev.filter(c => c.ownerId !== id));
  };

  const handleLogout = () => { setUser(null); db.session.clear(); setScreen(Screen.AUTH); };

  const handleCarOnboarding = (newCar: Car) => {
    if (!user) return;
    const car = { ...newCar, ownerId: user.id };
    setAllCars(prev => [...prev, car]);
    setActiveCarId(newCar.id);
    localStorage.setItem('AUTOBOOK_ACTIVE_CAR', newCar.id);
    setScreen(Screen.DASHBOARD);
  };

  const handleSaveInvoice = (inv: Invoice, specs?: TechnicalSpecs) => {
    setAllInvoices(prev => [inv, ...prev]);
    if (specs && activeCarId) {
      setAllCars(prev => prev.map(c => c.id === activeCarId ? { ...c, specs: { ...c.specs, ...specs } } : c));
    }
    setScreen(Screen.DASHBOARD);
  };

  return (
    <div className="max-w-md mx-auto bg-nsp-bg shadow-2xl h-[100dvh] relative overflow-y-auto overflow-x-hidden">
      {isSyncing && (
        <div className="fixed top-4 right-4 z-50 bg-black/80 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border border-white/10 shadow-xl backdrop-blur-md">
           <Cloud size={12} className="text-green-500 animate-pulse" /> <span>Sync Cloud...</span>
        </div>
      )}
      <div className={screen === Screen.ADMIN_DASHBOARD ? "fixed inset-0 z-40 bg-black overflow-auto" : "min-h-full"}>
         {screen === Screen.AUTH && <AuthScreen onLogin={handleLogin} onForgotPasswordRequest={(e) => {
           const u = allUsers.find(x => x.email.toLowerCase() === e.toLowerCase());
           if(u) { handleUpdateUser({...u, passwordResetRequested: true}); return true; }
           return false;
         }} existingUsers={allUsers} />}
         {screen === Screen.ADMIN_DASHBOARD && <AdminDashboardScreen currentUser={user!} allUsers={allUsers} allCars={allCars} allInvoices={allInvoices} onLogout={handleLogout} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} onRefresh={loadAllData} />}
         {screen === Screen.GARAGE && <GarageScreen user={user!} cars={userCars} onSelectCar={(id) => { setActiveCarId(id); localStorage.setItem('AUTOBOOK_ACTIVE_CAR', id); setScreen(Screen.DASHBOARD); }} onAddCar={() => setScreen(Screen.ONBOARDING)} onLogout={handleLogout} />}
         {screen === Screen.ONBOARDING && <OnboardingScreen onSave={handleCarOnboarding} onCancel={() => setScreen(Screen.GARAGE)} canUseSiv={!!(user?.isPremium || user?.hasSivAccess)} onRequireSiv={() => setShowPayment('siv')} />}
         {screen === Screen.DASHBOARD && activeCar && <DashboardScreen user={user!} car={activeCar} invoices={activeCarInvoices} aiStatus={aiStatus} onBackToGarage={() => setScreen(Screen.GARAGE)} onAddInvoice={() => setScreen(Screen.ADD_INVOICE)} onSellCar={() => setScreen(Screen.SELL_CAR)} onBuyCar={() => setScreen(Screen.BUY_CAR)} onAssistance={() => setScreen(Screen.ASSISTANCE)} onDeleteCar={() => { setAllCars(prev => prev.filter(c => c.id !== activeCarId)); setActiveCarId(null); setScreen(Screen.GARAGE); }} onUpdateSpecs={(s) => setAllCars(prev => prev.map(c => c.id === activeCarId ? {...c, specs: s} : c))} onUpdateCar={(c) => setAllCars(prev => prev.map(x => x.id === c.id ? c : x))} onDeleteInvoice={(id) => setAllInvoices(prev => prev.filter(i => i.id !== id))} />}
         {screen === Screen.ADD_INVOICE && <AddInvoiceScreen carId={activeCarId!} onSave={handleSaveInvoice} onCancel={() => setScreen(Screen.DASHBOARD)} />}
         {screen === Screen.ASSISTANCE && <AssistanceScreen onBack={() => setScreen(Screen.DASHBOARD)} canUseAssistance={!!(user?.isPremium || user?.hasAssistanceAccess)} onRequireAccess={() => setShowPayment('assistance')} />}
      </div>
      {showPayment && <PaymentModal feature={showPayment} onClose={() => setShowPayment(null)} onSuccess={(t) => {
        if(!user) return;
        const u = {...user};
        if(t === 'premium') u.isPremium = true;
        else if(t === 'siv') u.hasSivAccess = true;
        else u.hasAssistanceAccess = true;
        handleLogin(u);
        setShowPayment(null);
      }} />}
    </div>
  );
};

export default App;
