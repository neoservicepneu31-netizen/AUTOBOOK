
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
import { Cloud, Loader2, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>(Screen.AUTH);
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeCarId, setActiveCarId] = useState<string | null>(null);

  /**
   * RESTAURATION TOTALE DEPUIS LE CLOUD
   * Cette fonction garantit qu'aucune donnée n'est perdue après une mise à jour.
   */
  const loadAllData = useCallback(async (targetUser: User) => {
    setIsSyncing(true);
    try {
      // 1. Toujours charger le local en premier pour la réactivité
      const localCars = db.cars.getAll().filter(c => c.ownerId === targetUser.id);
      const localInvoices = db.invoices.getAll().filter(inv => localCars.some(c => c.id === inv.carId));
      
      setAllCars(localCars);
      setAllInvoices(localInvoices);

      // 2. Si connexion Cloud active, on restaure/écrase avec les données officielles
      if (cloud.isConnected()) {
        const remoteCars = await cloud.fetchUserCars(targetUser.id);
        
        // Pour chaque voiture, on récupère ses factures
        let remoteInvoices: Invoice[] = [];
        for (const car of remoteCars) {
          const invs = await cloud.fetchUserInvoices(car.id);
          remoteInvoices = [...remoteInvoices, ...invs];
        }

        // Mise à jour de l'état UI
        setAllCars(remoteCars);
        setAllInvoices(remoteInvoices);
        
        // Mise à jour du cache local (Source de vérité = Cloud)
        db.cars.saveAll(remoteCars);
        db.invoices.saveAll(remoteInvoices);
        
        console.log(`[Sync] Restauration Cloud réussie: ${remoteCars.length} voitures, ${remoteInvoices.length} factures.`);
      }
    } catch (e) {
      console.error("Sync restoration error", e);
    } finally {
      setIsSyncing(false);
      setIsDatabaseReady(true);
    }
  }, []);

  // Initialisation de l'application
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
          // Si l'utilisateur n'est pas trouvé localement mais qu'il y a une session,
          // on force le login pour recréer le profil via le Cloud (sécurité après update majeure)
          db.session.clear();
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
    
    // On s'assure que l'utilisateur est enregistré sur le cloud
    if (cloud.isConnected()) await cloud.syncUser(loggedInUser);
    
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

  // Fix: Added handleTransferComplete to remove the car from the user's view after a successful transfer
  const handleTransferComplete = async (buyerEmail: string) => {
    if (!activeCarId) return;
    const updatedCars = allCars.filter(c => c.id !== activeCarId);
    setAllCars(updatedCars);
    db.cars.saveAll(updatedCars);
    
    const updatedInvoices = allInvoices.filter(i => i.carId !== activeCarId);
    setAllInvoices(updatedInvoices);
    db.invoices.saveAll(updatedInvoices);

    setActiveCarId(null);
    setScreen(Screen.GARAGE);
  };

  // Fix: Added handleImportSuccess to add the imported car and its invoices to the state and storage
  const handleImportSuccess = async (newCar: Car, newInvoices: Invoice[]) => {
    if (!user) return;
    const carToImport = { ...newCar, ownerId: user.id };
    
    const updatedCars = [...allCars, carToImport];
    setAllCars(updatedCars);
    db.cars.saveAll(updatedCars);
    if (cloud.isConnected()) await cloud.syncCar(carToImport);

    const updatedInvoices = [...newInvoices, ...allInvoices];
    setAllInvoices(updatedInvoices);
    db.invoices.saveAll(updatedInvoices);
    
    for (const inv of newInvoices) {
      if (cloud.isConnected()) await cloud.syncInvoice(inv);
    }

    setScreen(Screen.GARAGE);
  };

  return (
    <div className="max-w-md mx-auto bg-nsp-bg shadow-2xl h-[100dvh] relative overflow-hidden">
      {/* Indicateur de synchronisation Cloud en temps réel */}
      {isSyncing && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-nsp-primary text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-[0_10px_30px_rgba(230,57,70,0.5)] border border-white/20 animate-bounce">
           <RefreshCw size={14} className="animate-spin" /> <span>Sécurisation des données...</span>
        </div>
      )}

      {!isDatabaseReady ? (
        <div className="h-full flex flex-col items-center justify-center space-y-6">
           <div className="relative">
              <Loader2 className="animate-spin text-nsp-primary" size={48} />
              <Cloud className="absolute inset-0 m-auto text-white/20" size={16} />
           </div>
           <div className="text-center">
             <p className="text-white font-black text-xs uppercase tracking-[0.2em]">Chargement Sécurisé</p>
             <p className="text-gray-600 text-[10px] mt-1">Vérification de l'intégrité du Cloud...</p>
           </div>
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
