
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
import { db } from './services/storageService'; 
import { cloud } from './services/cloudService';
import { checkVehicleHealthAndNotify } from './services/notificationService';
import { Cloud, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>(Screen.AUTH);
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeCarId, setActiveCarId] = useState<string | null>(null);

  const performHealthChecks = useCallback((cars: Car[], invoices: Invoice[], email: string) => {
    cars.forEach(car => {
      const carInvoices = invoices.filter(i => i.carId === car.id);
      checkVehicleHealthAndNotify(car, carInvoices, email);
    });
  }, []);

  const loadAllData = useCallback(async (targetUser: User) => {
    setIsSyncing(true);
    try {
      if (targetUser.role === 'admin') {
        if (cloud.isConnected()) {
          const [remoteUsers, remoteCars, remoteInvoices] = await Promise.all([
            cloud.fetchAllUsers(),
            cloud.fetchAllCars(),
            cloud.fetchAllInvoices()
          ]);
          setAllUsers(remoteUsers);
          setAllCars(remoteCars);
          setAllInvoices(remoteInvoices);
        } else {
          setAllUsers(db.users.getAll());
          setAllCars(db.cars.getAll());
          setAllInvoices(db.invoices.getAll());
        }
      } else {
        const localCars = db.cars.getAll().filter(c => c.ownerId === targetUser.id);
        const localInvoices = db.invoices.getAll().filter(inv => localCars.some(c => c.id === inv.carId));
        
        setAllCars(localCars);
        setAllInvoices(localInvoices);

        if (cloud.isConnected()) {
          const remoteCars = await cloud.fetchUserCars(targetUser.id);
          let remoteInvoices: Invoice[] = [];
          for (const car of remoteCars) {
            const invs = await cloud.fetchUserInvoices(car.id);
            remoteInvoices = [...remoteInvoices, ...invs];
          }

          if (remoteCars.length > 0 || remoteInvoices.length > 0) {
            setAllCars(remoteCars);
            setAllInvoices(remoteInvoices);
            db.cars.saveAll(remoteCars);
            db.invoices.saveAll(remoteInvoices);
          }
        }
        // Check health after loading
        performHealthChecks(allCars, allInvoices, targetUser.email);
      }
    } catch (e) {
      console.error("Sync error", e);
    } finally {
      setIsSyncing(false);
      setIsDatabaseReady(true);
    }
  }, [allCars, allInvoices, performHealthChecks]);

  useEffect(() => {
    const initApp = async () => {
      const sessionId = db.session.get();
      const lastEmail = db.session.getLastEmail();
      let currentUser: User | null = null;
      const localUsers = db.users.getAll();
      
      if (sessionId) { 
        currentUser = localUsers.find(u => u.id === sessionId) || null; 
      }
      
      if (!currentUser && lastEmail && cloud.isConnected()) {
        try {
          const cloudUsers = await cloud.fetchAllUsers();
          currentUser = cloudUsers.find(u => u.email.toLowerCase() === lastEmail.toLowerCase()) || null;
          if (currentUser) { 
            db.users.addOne(currentUser); 
            db.session.set(currentUser.id); 
          }
        } catch (e) { 
          console.error("Cloud recovery failed", e); 
        }
      }

      if (currentUser) {
        setUser(currentUser);
        await loadAllData(currentUser);
        setScreen(currentUser.role === 'admin' ? Screen.ADMIN_DASHBOARD : Screen.GARAGE);
      } else { 
        setIsDatabaseReady(true); 
      }
    };
    initApp();
  }, [loadAllData]);

  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
    db.session.set(loggedInUser.id);
    db.users.addOne(loggedInUser);
    
    if (loggedInUser.role !== 'admin') {
      db.session.setLastEmail(loggedInUser.email);
    }

    if (cloud.isConnected()) await cloud.syncUser(loggedInUser);
    await loadAllData(loggedInUser);
    setScreen(loggedInUser.role === 'admin' ? Screen.ADMIN_DASHBOARD : Screen.GARAGE);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (cloud.isConnected()) await cloud.syncUser(updatedUser);
  };

  const handleDeleteUser = async (userId: string) => {
    setIsSyncing(true);
    try {
      if (cloud.isConnected()) {
        const userCars = allCars.filter(c => c.ownerId === userId);
        for (const car of userCars) {
          const carInvoices = allInvoices.filter(i => i.carId === car.id);
          for (const inv of carInvoices) {
            await cloud.deleteInvoice(inv.id);
          }
          await cloud.deleteCar(car.id);
        }
        await cloud.deleteUser(userId);
      }
      setAllUsers(prev => prev.filter(u => u.id !== userId));
      setAllCars(prev => prev.filter(c => c.ownerId !== userId));
    } catch (e) {
      console.error("Erreur lors de la suppression globale", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveCar = async (car: Car) => {
    const updatedCars = [...allCars.filter(c => c.id !== car.id), car];
    setAllCars(updatedCars);
    db.cars.saveAll(updatedCars);
    if (cloud.isConnected()) await cloud.syncCar(car);
    if (user) performHealthChecks(updatedCars, allInvoices, user.email);
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
    if (user) performHealthChecks(allCars, updatedInvoices, user.email);
    setScreen(Screen.INVOICES_LIST);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const updated = allInvoices.filter(i => i.id !== invoiceId);
    setAllInvoices(updated);
    db.invoices.saveAll(updated);
    if (cloud.isConnected()) {
      cloud.deleteInvoice(invoiceId).catch(err => {
        console.error("Background Cloud delete failed", err);
      });
    }
  };

  const handleTransferComplete = async (buyerEmail: string) => {
    if (!activeCarId) return;
    const updatedCars = allCars.filter(c => c.id !== activeCarId);
    setAllCars(updatedCars);
    db.cars.saveAll(updatedCars);
    setActiveCarId(null);
    setScreen(Screen.GARAGE);
  };

  const handleImportSuccess = async (newCar: Car, newInvoices: Invoice[]) => {
    if (!user) return;
    const carToImport = { ...newCar, ownerId: user.id };
    const updatedCars = [...allCars, carToImport];
    const updatedInvoices = [...allInvoices, ...newInvoices];
    setAllCars(updatedCars);
    setAllInvoices(updatedInvoices);
    db.cars.saveAll(updatedCars);
    db.invoices.saveAll(updatedInvoices);
    if (cloud.isConnected()) await cloud.syncCar(carToImport);
    performHealthChecks(updatedCars, updatedInvoices, user.email);
    setScreen(Screen.GARAGE);
  };

  return (
    <div className="max-w-md mx-auto bg-nsp-bg shadow-2xl min-h-[100dvh] flex flex-col overflow-x-hidden relative">
      {isSyncing && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-nsp-primary text-white px-4 py-2 rounded-full text-[9px] font-black uppercase flex items-center gap-2 shadow-2xl border border-white/10">
           <RefreshCw size={12} className="animate-spin" /> Protection Cloud Active
        </div>
      )}
      {!isDatabaseReady ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-10 bg-nsp-bg">
           <Loader2 className="animate-spin text-nsp-primary" size={40} />
           <p className="text-white font-black text-[10px] uppercase tracking-widest">Restauration du Garage...</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col w-full h-full min-h-full">
         {screen === Screen.AUTH && <AuthScreen onLogin={handleLogin} onForgotPasswordRequest={() => true} existingUsers={db.users.getAll()} />}
         {screen === Screen.GARAGE && <GarageScreen user={user!} cars={allCars} invoices={allInvoices} onSelectCar={(id) => { setActiveCarId(id); setScreen(Screen.DASHBOARD); }} onViewInvoices={(id) => { setActiveCarId(id); setScreen(Screen.INVOICES_LIST); }} onAddCar={() => setScreen(Screen.ONBOARDING)} onLogout={() => { setUser(null); db.session.clear(); setScreen(Screen.AUTH); }} onBuyCar={() => setScreen(Screen.BUY_CAR)} />}
         {screen === Screen.ADMIN_DASHBOARD && <AdminDashboardScreen currentUser={user!} allUsers={allUsers} allCars={allCars} allInvoices={allInvoices} onLogout={() => { setUser(null); db.session.clear(); setScreen(Screen.AUTH); }} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} onRefresh={() => loadAllData(user!)} />}
         {screen === Screen.DASHBOARD && activeCarId && <DashboardScreen user={user!} car={allCars.find(c => c.id === activeCarId)!} invoices={allInvoices.filter(i => i.carId === activeCarId)} aiStatus={{status:'neutral', message:''}} onBackToGarage={() => setScreen(Screen.GARAGE)} onAddInvoice={() => setScreen(Screen.ADD_INVOICE)} onSellCar={() => setScreen(Screen.SELL_CAR)} onBuyCar={() => {}} onAssistance={() => setScreen(Screen.ASSISTANCE)} onDeleteCar={() => {}} onUpdateSpecs={() => {}} onUpdateCar={() => {}} onDeleteInvoice={handleDeleteInvoice} />}
         {screen === Screen.ONBOARDING && <OnboardingScreen onSave={(c) => { handleSaveCar({...c, ownerId: user!.id}); setScreen(Screen.GARAGE); }} onCancel={() => setScreen(Screen.GARAGE)} canUseSiv={true} onRequireSiv={() => {}} />}
         {screen === Screen.ADD_INVOICE && <AddInvoiceScreen carId={activeCarId!} onSave={handleSaveInvoice} onCancel={() => setScreen(Screen.DASHBOARD)} />}
         {screen === Screen.INVOICES_LIST && activeCarId && <InvoicesListScreen car={allCars.find(c => c.id === activeCarId)!} invoices={allInvoices.filter(i => i.carId === activeCarId)} onBack={() => setScreen(Screen.DASHBOARD)} onAdd={() => setScreen(Screen.ADD_INVOICE)} onDelete={handleDeleteInvoice} />}
         {screen === Screen.SELL_CAR && activeCarId && <SellCarScreen car={allCars.find(c => c.id === activeCarId)!} invoices={allInvoices.filter(i => i.carId === activeCarId)} onCancel={() => setScreen(Screen.DASHBOARD)} onConfirmTransfer={handleTransferComplete} />}
         {screen === Screen.BUY_CAR && <BuyCarScreen onCancel={() => setScreen(Screen.GARAGE)} onImportSuccess={handleImportSuccess} />}
         {screen === Screen.ASSISTANCE && <AssistanceScreen onBack={() => setScreen(Screen.DASHBOARD)} canUseAssistance={true} onRequireAccess={() => {}} />}
        </div>
      )}
    </div>
  );
};
export default App;
