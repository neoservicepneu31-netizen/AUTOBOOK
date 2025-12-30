
import React, { useState, useEffect } from 'react';
import { Screen, User, Car, Invoice, TechnicalSpecs } from './types';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { GarageScreen } from './components/GarageScreen';
import { AddInvoiceScreen } from './components/AddInvoiceScreen';
import { AssistanceScreen } from './components/AssistanceScreen';
import { AdminDashboardScreen } from './components/AdminDashboardScreen';
import { InvoicesListScreen } from './components/InvoicesListScreen';
import { PaymentModal, PurchaseType } from './components/PaymentModal';
import { db } from './services/storageService'; 
import { cloud } from './services/cloudService';
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
  const [activeCarId, setActiveCarId] = useState<string | null>(null);

  const loadAllData = async () => {
    try {
      const localUsers = db.users.getAll();
      const localCars = db.cars.getAll();
      const localInvoices = db.invoices.getAll();
      setAllUsers(localUsers);
      setAllCars(localCars);
      setAllInvoices(localInvoices);
      if (cloud.isConnected()) {
        const remoteUsers = await cloud.fetchAllUsers();
        if (remoteUsers && remoteUsers.length > 0) setAllUsers(remoteUsers);
      }
    } catch (e) {
      console.warn("Sync Cloud off.");
    } finally {
      setIsDatabaseReady(true);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      await loadAllData();
      const sessionId = db.session.get();
      if (sessionId) {
        const currentUsers = db.users.getAll();
        const foundUser = currentUsers.find(u => u.id === sessionId);
        if (foundUser) {
          setUser(foundUser);
          if (foundUser.role === 'admin') setScreen(Screen.ADMIN_DASHBOARD);
          else setScreen(Screen.GARAGE);
        }
      }
    };
    initApp();
  }, []);

  const handleLogin = async (loggedInUser: User) => {
    setIsSyncing(true);
    try {
      await cloud.syncUser(loggedInUser);
      setUser(loggedInUser);
      db.session.set(loggedInUser.id);
      const currentUsers = db.users.getAll();
      if (!currentUsers.some(u => u.id === loggedInUser.id)) {
        const updatedUsers = [...currentUsers, loggedInUser];
        db.users.saveAll(updatedUsers);
        setAllUsers(updatedUsers);
      }
      setScreen(loggedInUser.role === 'admin' ? Screen.ADMIN_DASHBOARD : Screen.GARAGE);
    } catch (e) {
      console.error("Login failed:", e);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    const updatedUsers = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
    setAllUsers(updatedUsers);
    db.users.saveAll(updatedUsers);
    if (cloud.isConnected()) cloud.syncUser(updatedUser);
  };

  const handleDeleteUser = (userId: string) => {
    const updatedUsers = allUsers.filter(u => u.id !== userId);
    setAllUsers(updatedUsers);
    db.users.saveAll(updatedUsers);
    // Note: Pour une suppression Cloud réelle, il faudrait ajouter cloud.deleteUser(userId)
  };

  const handleSaveInvoice = (inv: Invoice, specs?: TechnicalSpecs) => {
    const updatedInvoices = [inv, ...allInvoices];
    setAllInvoices(updatedInvoices);
    db.invoices.saveAll(updatedInvoices);
    if (specs && activeCarId) {
      const updated = allCars.map(c => {
        if (c.id === activeCarId) return { ...c, specs: { ...(c.specs || {}), ...specs } };
        return c;
      });
      setAllCars(updated);
      db.cars.saveAll(updated);
    }
    setScreen(Screen.INVOICES_LIST);
  };

  return (
    <div className="max-w-md mx-auto bg-nsp-bg shadow-2xl h-[100dvh] relative overflow-y-auto">
      {isSyncing && (
        <div className="fixed top-6 right-6 z-[110] bg-black/80 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/10 shadow-2xl backdrop-blur-xl animate-fade-in">
           <Cloud size={14} className="text-green-500 animate-pulse" /> <span>Sync Cloud</span>
        </div>
      )}

      {!isDatabaseReady ? (
        <div className="h-full flex flex-col items-center justify-center space-y-6">
           <Loader2 className="animate-spin text-nsp-primary" size={48} />
           <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Chargement...</p>
        </div>
      ) : (
        <>
         {screen === Screen.AUTH && <AuthScreen onLogin={handleLogin} onForgotPasswordRequest={(e) => !!allUsers.find(x => x.email.toLowerCase() === e.toLowerCase())} existingUsers={allUsers} />}
         {screen === Screen.ADMIN_DASHBOARD && <AdminDashboardScreen currentUser={user!} allUsers={allUsers} allCars={allCars} allInvoices={allInvoices} onLogout={() => { setUser(null); db.session.clear(); setScreen(Screen.AUTH); }} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} onRefresh={loadAllData} />}
         {screen === Screen.GARAGE && <GarageScreen user={user!} cars={allCars.filter(c => c.ownerId === user?.id)} invoices={allInvoices} onSelectCar={(id) => { setActiveCarId(id); localStorage.setItem('AUTOBOOK_ACTIVE_CAR', id); setScreen(Screen.DASHBOARD); }} onViewInvoices={(id) => { setActiveCarId(id); setScreen(Screen.INVOICES_LIST); }} onAddCar={() => setScreen(Screen.ONBOARDING)} onLogout={() => { setUser(null); db.session.clear(); setScreen(Screen.AUTH); }} />}
         {screen === Screen.ONBOARDING && <OnboardingScreen onSave={(c) => { 
           const carWithId = { ...c, ownerId: user!.id };
           const updatedCars = [...allCars, carWithId];
           setAllCars(updatedCars);
           db.cars.saveAll(updatedCars);
           setActiveCarId(c.id);
           setScreen(Screen.DASHBOARD);
         }} onCancel={() => setScreen(Screen.GARAGE)} canUseSiv={!!(user?.isPremium || user?.hasSivAccess)} onRequireSiv={() => setShowPayment('siv')} />}
         {screen === Screen.DASHBOARD && activeCarId && <DashboardScreen user={user!} car={allCars.find(c => c.id === activeCarId)!} invoices={allInvoices.filter(i => i.carId === activeCarId)} aiStatus={{status:'neutral', message:''}} onBackToGarage={() => setScreen(Screen.GARAGE)} onAddInvoice={() => setScreen(Screen.ADD_INVOICE)} onSellCar={() => {}} onBuyCar={() => {}} onAssistance={() => setScreen(Screen.ASSISTANCE)} onDeleteCar={() => {}} onUpdateSpecs={() => {}} onUpdateCar={() => {}} onDeleteInvoice={(id) => setAllInvoices(prev => prev.filter(i => i.id !== id))} />}
         {screen === Screen.ADD_INVOICE && <AddInvoiceScreen carId={activeCarId!} onSave={handleSaveInvoice} onCancel={() => setScreen(Screen.DASHBOARD)} />}
         {screen === Screen.ASSISTANCE && <AssistanceScreen onBack={() => setScreen(Screen.DASHBOARD)} canUseAssistance={!!(user?.isPremium || user?.hasAssistanceAccess)} onRequireAccess={() => setShowPayment('assistance')} />}
         {screen === Screen.INVOICES_LIST && activeCarId && <InvoicesListScreen car={allCars.find(c => c.id === activeCarId)!} invoices={allInvoices.filter(i => i.carId === activeCarId)} onBack={() => setScreen(Screen.GARAGE)} onAdd={() => setScreen(Screen.ADD_INVOICE)} onDelete={(id) => { const updated = allInvoices.filter(i => i.id !== id); setAllInvoices(updated); db.invoices.saveAll(updated); }} />}
        </>
      )}

      {showPayment && <PaymentModal feature={showPayment} onClose={() => setShowPayment(null)} onSuccess={(t) => {
        if(!user) return;
        const u = {...user};
        if(t === 'premium') u.isPremium = true;
        else if(t === 'siv') u.hasSivAccess = true;
        else u.hasAssistanceAccess = true;
        handleUpdateUser(u);
        setShowPayment(null);
      }} />}
    </div>
  );
};

export default App;
