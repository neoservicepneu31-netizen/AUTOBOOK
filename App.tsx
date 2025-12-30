
import React, { useState, useEffect, useCallback } from 'react';
import { Screen, User, Car, Invoice, TechnicalSpecs } from './types';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { GarageScreen } from './components/GarageScreen';
import { AddInvoiceScreen } from './components/AddInvoiceScreen';
import { AssistanceScreen } from './components/AssistanceScreen';
import { AdminDashboardScreen } from './components/AdminDashboardScreen';
import { InvoicesListScreen } from './components/InvoicesListScreen';
import { SellCarScreen } from './components/SellCarScreen';
import { BuyCarScreen } from './components/BuyCarScreen';
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

  const loadAllData = useCallback(async (targetUser: User) => {
    setIsSyncing(true);
    try {
      // 1. Restaurer depuis le Cloud pour cet utilisateur précis
      if (cloud.isConnected()) {
        const remoteCars = await cloud.fetchUserCars(targetUser.id);
        const remoteInvoices = await cloud.fetchUserInvoices(targetUser.id);

        setAllCars(remoteCars);
        setAllInvoices(remoteInvoices);
        
        // Cache local
        db.cars.saveAll(remoteCars);
        db.invoices.saveAll(remoteInvoices);
      } else {
        // Fallback local si pas de cloud
        setAllCars(db.cars.getAll());
        setAllInvoices(db.invoices.getAll());
      }
    } catch (e) {
      console.warn("Sync error", e);
    } finally {
      setIsSyncing(false);
      setIsDatabaseReady(true);
    }
  }, []);

  useEffect(() => {
    const initApp = async () => {
      const sessionId = db.session.get();
      if (sessionId) {
        const localUsers = db.users.getAll();
        const foundUser = localUsers.find(u => u.id === sessionId);
        if (foundUser) {
          setUser(foundUser);
          await loadAllData(foundUser);
          setScreen(foundUser.role === 'admin' ? Screen.ADMIN_DASHBOARD : Screen.GARAGE);
        } else {
          setIsDatabaseReady(true);
        }
      } else {
        setIsDatabaseReady(true);
      }
    };
    initApp();
  }, [loadAllData]);

  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
    db.session.set(loggedInUser.id);
    await loadAllData(loggedInUser);
    setScreen(loggedInUser.role === 'admin' ? Screen.ADMIN_DASHBOARD : Screen.GARAGE);
  };

  const handleSaveCar = async (car: Car) => {
    const updatedCars = [...allCars.filter(c => c.id !== car.id), car];
    setAllCars(updatedCars);
    db.cars.saveAll(updatedCars);
    if (cloud.isConnected()) await cloud.syncCar(car);
  };

  const handleSaveInvoice = async (inv: Invoice, specs?: TechnicalSpecs) => {
    const updatedInvoices = [inv, ...allInvoices];
    setAllInvoices(updatedInvoices);
    db.invoices.saveAll(updatedInvoices);
    if (cloud.isConnected()) await cloud.syncInvoice(inv);

    if (specs && activeCarId) {
      const car = allCars.find(c => c.id === activeCarId);
      if (car) {
        const updatedCar = { ...car, specs: { ...(car.specs || {}), ...specs } };
        await handleSaveCar(updatedCar);
      }
    }
    setScreen(Screen.INVOICES_LIST);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const updated = allInvoices.filter(i => i.id !== invoiceId);
    setAllInvoices(updated);
    db.invoices.saveAll(updated);
    if (cloud.isConnected()) await cloud.deleteInvoice(invoiceId);
  };

  const handleTransferComplete = (buyerEmail: string) => {
    // Dans une app réelle, on changerait l'ownerId sur le cloud
    // Ici on simule en retirant la voiture du garage actuel
    const updatedCars = allCars.filter(c => c.id !== activeCarId);
    setAllCars(updatedCars);
    db.cars.saveAll(updatedCars);
    setScreen(Screen.GARAGE);
  };

  const handleImportSuccess = (newCar: Car, newInvoices: Invoice[]) => {
    const carWithUser = { ...newCar, ownerId: user!.id };
    const invoicesWithUser = newInvoices.map(inv => ({ ...inv, carId: carWithUser.id }));
    
    setAllCars(prev => [...prev, carWithUser]);
    setAllInvoices(prev => [...prev, ...invoicesWithUser]);
    
    db.cars.saveAll([...allCars, carWithUser]);
    db.invoices.saveAll([...allInvoices, ...invoicesWithUser]);
    
    setScreen(Screen.GARAGE);
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
           <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Initialisation...</p>
        </div>
      ) : (
        <>
         {screen === Screen.AUTH && <AuthScreen onLogin={handleLogin} onForgotPasswordRequest={() => true} existingUsers={allUsers} />}
         {screen === Screen.GARAGE && <GarageScreen user={user!} cars={allCars} invoices={allInvoices} onSelectCar={(id) => { setActiveCarId(id); setScreen(Screen.DASHBOARD); }} onViewInvoices={(id) => { setActiveCarId(id); setScreen(Screen.INVOICES_LIST); }} onAddCar={() => setScreen(Screen.ONBOARDING)} onLogout={() => { setUser(null); db.session.clear(); setScreen(Screen.AUTH); }} onBuyCar={() => setScreen(Screen.BUY_CAR)} />}
         {screen === Screen.ADMIN_DASHBOARD && <AdminDashboardScreen currentUser={user!} allUsers={allUsers} allCars={allCars} allInvoices={allInvoices} onLogout={() => { setUser(null); db.session.clear(); setScreen(Screen.AUTH); }} onUpdateUser={() => {}} onDeleteUser={() => {}} onRefresh={() => loadAllData(user!)} />}
         {screen === Screen.DASHBOARD && activeCarId && <DashboardScreen user={user!} car={allCars.find(c => c.id === activeCarId)!} invoices={allInvoices.filter(i => i.carId === activeCarId)} aiStatus={{status:'neutral', message:''}} onBackToGarage={() => setScreen(Screen.GARAGE)} onAddInvoice={() => setScreen(Screen.ADD_INVOICE)} onSellCar={() => setScreen(Screen.SELL_CAR)} onBuyCar={() => {}} onAssistance={() => setScreen(Screen.ASSISTANCE)} onDeleteCar={() => {}} onUpdateSpecs={() => {}} onUpdateCar={() => {}} onDeleteInvoice={handleDeleteInvoice} />}
         {screen === Screen.ONBOARDING && <OnboardingScreen onSave={(c) => { handleSaveCar({...c, ownerId: user!.id}); setScreen(Screen.GARAGE); }} onCancel={() => setScreen(Screen.GARAGE)} canUseSiv={true} onRequireSiv={() => {}} />}
         {screen === Screen.ADD_INVOICE && <AddInvoiceScreen carId={activeCarId!} onSave={handleSaveInvoice} onCancel={() => setScreen(Screen.DASHBOARD)} />}
         {screen === Screen.INVOICES_LIST && activeCarId && <InvoicesListScreen car={allCars.find(c => c.id === activeCarId)!} invoices={allInvoices.filter(i => i.carId === activeCarId)} onBack={() => setScreen(Screen.DASHBOARD)} onAdd={() => setScreen(Screen.ADD_INVOICE)} onDelete={handleDeleteInvoice} />}
         {screen === Screen.SELL_CAR && activeCarId && <SellCarScreen car={allCars.find(c => c.id === activeCarId)!} invoices={allInvoices.filter(i => i.carId === activeCarId)} onCancel={() => setScreen(Screen.DASHBOARD)} onConfirmTransfer={handleTransferComplete} />}
         {screen === Screen.BUY_CAR && <BuyCarScreen onCancel={() => setScreen(Screen.GARAGE)} onImportSuccess={handleImportSuccess} />}
         {screen === Screen.ASSISTANCE && <AssistanceScreen onBack={() => setScreen(Screen.DASHBOARD)} canUseAssistance={true} onRequireAccess={() => {}} />}
        </>
      )}
    </div>
  );
};

export default App;
