
import React, { useState, useMemo, useEffect } from 'react';
import { User, Car, Invoice } from '../types';
import { cloud } from '../services/cloudService';
import { 
  BarChart3, Users, QrCode, Printer, 
  Globe, Radio, Database, ExternalLink, AlertCircle, RefreshCcw,
  Loader2, Copy, Check, ShieldAlert, ChevronRight, MousePointer2, HardDrive, Plus, ShieldCheck, ArrowRight,
  Search, Info, Car as CarIcon, X, Smartphone, Globe2, Link, ExternalLink as OpenLink, Trash2, Key, History, Mail, Eye, LogOut, Clock
} from 'lucide-react';

interface AdminDashboardScreenProps {
  currentUser: User;
  allUsers: User[];
  allCars: Car[];
  allInvoices: Invoice[];
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onRefresh: () => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ 
  currentUser, allUsers, allCars, allInvoices, onLogout, onUpdateUser, onDeleteUser, onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'diffusion' | 'users' | 'setup'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [cloudStatus, setCloudStatus] = useState<'online' | 'syncing' | 'warning' | 'error'>('online');
  const [isRetrying, setIsRetrying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [customDomain, setCustomDomain] = useState('autobook-zxwf.vercel.app');
  
  const isCloudActive = cloud.isConnected();
  const isApiDisabled = cloud.isApiDisabled();
  
  const publicUrl = useMemo(() => {
    let domain = customDomain.trim();
    if (!domain.startsWith('http')) domain = `https://${domain}`;
    return domain;
  }, [customDomain]);

  useEffect(() => {
    if (isApiDisabled) {
      setCloudStatus('error');
      return;
    }
    if (!isCloudActive) {
      setCloudStatus('warning');
      return;
    }

    const unsubscribe = cloud.listenToAllUsers(() => {
      setCloudStatus('syncing');
      onRefresh();
      setTimeout(() => setCloudStatus('online'), 1000);
    });
    return () => { if(unsubscribe) unsubscribe(); };
  }, [onRefresh, isCloudActive, isApiDisabled]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleRetryCloud = () => {
    setIsRetrying(true);
    cloud.resetActivationFlag();
    onRefresh();
    setTimeout(() => setIsRetrying(false), 2000);
  };

  const handleDeleteUserAction = async (userId: string) => {
    if (confirm("🚨 ATTENTION : Suppression Définitive\n\nCette action est irréversible et supprimera le compte de la base de données Cloud.\n\nContinuer ?")) {
      await onDeleteUser(userId);
      setSelectedUser(null);
    }
  };

  const handleResetPasswordAction = async (user: User) => {
    const newPass = prompt("Saisissez le nouveau mot de passe temporaire pour ce client :", "NSP" + Math.floor(1000 + Math.random() * 9000));
    if (newPass) {
      await onUpdateUser({ ...user, password: newPass, passwordResetRequested: false });
      alert("✅ Mot de passe mis à jour sur le Cloud.\nVeuillez le communiquer au client.");
    }
  };

  const stats = useMemo(() => {
    const realUsers = allUsers.filter(u => u.role !== 'admin');
    return { 
      totalUsers: realUsers.length, 
      totalCars: allCars.filter(c => realUsers.some(u => u.id === c.ownerId)).length,
      totalRevenue: allInvoices.reduce((acc, inv) => acc + inv.price, 0)
    };
  }, [allUsers, allCars, allInvoices]);

  const getUserDetails = (userId: string) => {
    const cars = allCars.filter(c => c.ownerId === userId);
    const userInvoices = allInvoices.filter(i => cars.some(c => c.id === i.carId));
    return { cars, invoices: userInvoices };
  };

  const filteredUsers = allUsers
    .filter(u => u.role !== 'admin')
    .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  const renderKPI = (label: string, value: string | number, icon: React.ReactNode, color: string) => (
    <div className="bg-nsp-card border border-nsp-border p-5 rounded-2xl relative overflow-hidden shadow-xl">
      <div className={`absolute top-0 right-0 p-4 opacity-10 ${color}`}>{icon}</div>
      <span className="text-gray-500 text-[9px] uppercase font-black tracking-widest block mb-1">{label}</span>
      <div className="text-2xl font-black text-white">{value}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col font-sans">
      {/* Header Admin */}
      <div className="bg-red-950/40 border-b border-red-900/30 p-6 flex justify-between items-center pt-safe-top backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(230,57,70,0.3)]"><ShieldAlert className="text-white" size={24} /></div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Console<span className="text-red-600">Global</span></h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${cloudStatus === 'online' ? 'bg-green-500 animate-pulse' : cloudStatus === 'error' ? 'bg-red-500 animate-bounce' : cloudStatus === 'warning' ? 'bg-yellow-500' : 'bg-blue-500 animate-spin'}`}></div>
              <p className={`${cloudStatus === 'error' ? 'text-red-500' : cloudStatus === 'warning' ? 'text-yellow-500' : 'text-green-500'} text-[8px] uppercase font-black tracking-widest`}>
                {isApiDisabled ? 'ERREUR : BASE DE DONNÉES MANQUANTE' : isCloudActive ? 'Liaison Cloud Établie' : 'Mode Local'}
              </p>
            </div>
          </div>
        </div>
        <button onClick={onLogout} className="text-white bg-red-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 flex items-center gap-2">
          <LogOut size={14} /> Quitter
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-nsp-border px-4 bg-nsp-card/20 overflow-x-auto no-scrollbar backdrop-blur-sm sticky top-[84px] z-40">
        {[
          { id: 'overview', label: 'Surveillance', icon: <BarChart3 size={14}/> },
          { id: 'users', label: 'Clients', icon: <Users size={14}/> },
          { id: 'diffusion', label: 'Diffusion', icon: <QrCode size={14}/> },
          { id: 'setup', label: 'Liaison Cloud', icon: <Database size={14}/> }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)} 
            className={`py-4 px-6 text-[10px] font-black border-b-2 transition-all uppercase tracking-widest flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'border-nsp-primary text-white' : 'border-transparent text-gray-600'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full pb-24">
         {activeTab === 'overview' && (
           <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                {renderKPI("Total Clients", stats.totalUsers, <Users size={24}/>, "text-blue-500")}
                {renderKPI("Parc Automobile", stats.totalCars, <CarIcon size={24}/>, "text-green-500")}
              </div>

              <div className="bg-nsp-card border border-nsp-border rounded-3xl p-6">
                <h3 className="text-white font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Radio size={14} className="text-red-500 animate-pulse" /> Activité Récente
                </h3>
                <div className="space-y-4">
                  {allUsers.filter(u => u.role !== 'admin').length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-gray-800 rounded-2xl">
                       <Database className="mx-auto text-gray-700 mb-2" size={32} />
                       <p className="text-gray-600 text-[10px] uppercase font-black">En attente du premier client...</p>
                    </div>
                  ) : (
                    allUsers.filter(u => u.role !== 'admin').slice(-10).reverse().map(u => {
                       const { cars } = getUserDetails(u.id);
                       return (
                        <div key={u.id} className="flex items-center gap-3 border-b border-white/5 pb-3 last:border-0 hover:bg-white/5 p-2 rounded-xl transition-all">
                           <div className="w-10 h-10 rounded-full bg-nsp-input flex items-center justify-center text-xs font-black text-nsp-primary border border-white/10">{u.name.charAt(0)}</div>
                           <div className="flex-1">
                              <p className="text-xs text-white font-bold">{u.name}</p>
                              <p className="text-[9px] text-gray-500">{cars.length} véhicule(s)</p>
                           </div>
                           <div className="text-right flex items-center gap-2">
                             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${isCloudActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {isCloudActive ? 'CLOUD' : 'LOCAL'}
                             </span>
                             <button onClick={() => setSelectedUser(u)} className="p-2 bg-nsp-input rounded-lg text-gray-400 hover:text-white"><Eye size={12}/></button>
                           </div>
                        </div>
                       );
                    })
                  )}
                </div>
              </div>
           </div>
         )}

         {activeTab === 'users' && (
           <div className="space-y-4 animate-fade-in">
              <div className="bg-nsp-input p-5 rounded-[2rem] flex items-center gap-4 border border-nsp-border shadow-inner">
                <Search size={22} className="text-gray-500" />
                <input 
                   type="text" 
                   placeholder="Chercher un client..." 
                   className="bg-transparent text-white outline-none text-sm font-bold w-full" 
                   value={searchTerm} 
                   onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers.map(u => {
                  const { cars } = getUserDetails(u.id);
                  return (
                    <div 
                      key={u.id} 
                      onClick={() => setSelectedUser(u)}
                      className="bg-nsp-card p-5 rounded-[2rem] border border-nsp-border flex justify-between items-center hover:border-nsp-primary transition-all group cursor-pointer shadow-lg active:scale-95"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-nsp-input rounded-2xl flex items-center justify-center font-black text-nsp-primary border border-white/5 group-hover:scale-110 transition-transform">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm uppercase">{u.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-gray-500 font-bold uppercase">{cars.length} Véhicules</span>
                            {u.isPremium && <span className="text-[8px] bg-yellow-500/10 text-yellow-500 px-1.5 rounded-full font-black uppercase">Premium</span>}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-gray-700 group-hover:text-white transition-colors" />
                    </div>
                  );
                })}
              </div>
           </div>
         )}

         {activeTab === 'diffusion' && (
           <div className="space-y-8 animate-fade-in flex flex-col items-center py-10 w-full">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Acquisition Client</h2>
                <p className="text-nsp-sub text-xs">QR Code universel pour enregistrer vos clients au comptoir.</p>
              </div>
              
              <div className="bg-white p-10 rounded-[4rem] shadow-[0_0_100px_rgba(230,57,70,0.5)] border-[16px] border-nsp-card relative group">
                 <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(publicUrl)}&color=0-0-0&bgcolor=ffffff&qzone=1`} 
                    alt="QR Code" 
                    className="w-64 h-64" 
                 />
                 <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-nsp-primary text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-2xl whitespace-nowrap">
                   Scannez pour votre dossier
                 </div>
              </div>

              <div className="w-full max-sm:px-4 space-y-4 max-w-sm">
                 <div className="bg-nsp-card border border-nsp-border rounded-[2.5rem] p-8 shadow-2xl">
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Globe size={12} className="text-nsp-primary" /> Adresse de votre application
                    </p>
                    <div className="space-y-6">
                      <input 
                        type="text"
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value)}
                        className="w-full bg-nsp-input border border-white/5 rounded-2xl px-5 py-4 text-sm text-white font-bold focus:border-nsp-primary outline-none"
                      />
                      <div className="flex gap-2">
                        <div className="flex-1 bg-black/60 rounded-2xl p-4 flex items-center justify-between gap-4 border border-white/5">
                           <code className="text-[10px] text-nsp-primary font-black truncate flex-1">{publicUrl}</code>
                           <button onClick={handleCopyLink} className={`p-2.5 rounded-xl transition-all ${copySuccess ? 'bg-green-600 text-white' : 'bg-nsp-primary text-white'}`}>
                              {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                           </button>
                        </div>
                      </div>
                    </div>
                 </div>
              </div>
           </div>
         )}

         {activeTab === 'setup' && (
           <div className="space-y-6 animate-fade-in">
              <div className="bg-nsp-card border border-nsp-border p-10 rounded-[3rem] relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 left-0 w-full h-1.5 bg-nsp-primary"></div>
                 <div className="text-center mb-10">
                    <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Synchronisation Cloud</h2>
                    <p className="text-gray-500 text-[9px] uppercase font-black tracking-[0.2em]">Data Center : Google Firestore Europe</p>
                 </div>

                 {isApiDisabled ? (
                   <div className="space-y-10">
                      <div className="relative p-6 bg-red-950/20 border border-red-500/30 rounded-[2rem] flex items-center gap-5">
                         <div className="w-14 h-14 bg-red-600/20 rounded-full flex items-center justify-center text-red-500 animate-pulse border border-red-500/20"><Database size={28} /></div>
                         <div>
                            <p className="text-white font-black text-sm uppercase">Mode Hors-Ligne</p>
                            <p className="text-red-400 text-[10px] font-bold">La liaison Firestore est coupée ou indisponible.</p>
                         </div>
                      </div>
                      <button onClick={handleRetryCloud} disabled={isRetrying} className="w-full bg-white text-black px-6 py-5 rounded-[2rem] font-black text-xs uppercase flex items-center justify-center gap-3">
                        {isRetrying ? <Loader2 className="animate-spin" size={18}/> : <RefreshCcw size={18} />} Tenter reconnexion
                      </button>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center py-10 text-center space-y-6">
                      <div className="w-32 h-32 bg-green-500/10 rounded-full flex items-center justify-center border-4 border-green-500/20 animate-pulse"><ShieldCheck size={56} className="text-green-500" /></div>
                      <h3 className="text-green-500 font-black text-2xl uppercase tracking-tighter">Système Intègre</h3>
                   </div>
                 )}
              </div>
           </div>
         )}
      </div>

      {/* DETAIL CLIENT MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col animate-fade-in overflow-y-auto">
          <header className="flex justify-between items-center p-6 pt-safe-top sticky top-0 bg-black/50 border-b border-white/5 z-20">
            <button onClick={() => setSelectedUser(null)} className="p-3 bg-nsp-input rounded-2xl text-white"><X size={24}/></button>
            <div className="text-center">
              <h3 className="text-white font-black text-xs uppercase tracking-widest">DOSSIER CLIENT</h3>
              <p className="text-[9px] text-nsp-primary font-black uppercase mt-1">Personnel NSP Autorisé</p>
            </div>
            <div className="w-12"></div>
          </header>

          <div className="max-w-2xl mx-auto w-full p-6 space-y-8 pb-32">
            {/* Infos de base */}
            <div className="bg-nsp-card border border-nsp-border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
               <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 bg-nsp-input rounded-[1.5rem] flex items-center justify-center text-4xl font-black text-nsp-primary border border-white/10">{selectedUser.name.charAt(0)}</div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-black text-white uppercase">{selectedUser.name}</h2>
                    <p className="text-gray-500 text-sm flex items-center gap-2"><Mail size={14}/> {selectedUser.email}</p>
                    <div className="mt-3 flex gap-2">
                       <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${selectedUser.isPremium ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400'}`}>
                         {selectedUser.isPremium ? '💎 Premium' : 'Gratuit'}
                       </span>
                    </div>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                     <p className="text-[8px] text-gray-500 uppercase font-black mb-1">Véhicules</p>
                     <p className="text-white font-bold text-xl">{getUserDetails(selectedUser.id).cars.length}</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                     <p className="text-[8px] text-gray-500 uppercase font-black mb-1">Documents</p>
                     <p className="text-white font-bold text-xl">{getUserDetails(selectedUser.id).invoices.length}</p>
                  </div>
               </div>

               {/* Statut Sync */}
               <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Clock size={12} className="text-gray-600" />
                     <span className="text-[9px] text-gray-500 font-black uppercase">Dernière Sync Cloud</span>
                  </div>
                  <span className="text-[10px] text-white font-bold">{(selectedUser as any).lastSyncDate ? new Date((selectedUser as any).lastSyncDate).toLocaleString() : 'Jamais'}</span>
               </div>
            </div>

            {/* Liste des véhicules */}
            <div className="space-y-4">
               <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-2 ml-2">
                 <CarIcon size={14} /> Parc Automobile du Client
               </h4>
               <div className="space-y-3">
                  {getUserDetails(selectedUser.id).cars.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-nsp-border rounded-3xl text-center text-gray-700 font-black text-[10px] uppercase">Aucun véhicule enregistré</div>
                  ) : (
                    getUserDetails(selectedUser.id).cars.map(car => (
                      <div key={car.id} className="bg-nsp-card border border-nsp-border p-5 rounded-3xl flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-nsp-input rounded-xl flex items-center justify-center text-nsp-primary"><CarIcon size={20}/></div>
                            <div>
                               <p className="text-white font-bold text-sm uppercase">{car.name}</p>
                               <p className="text-[9px] text-nsp-primary font-black uppercase">{car.plate}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-white font-bold text-xs">{car.initialKm.toLocaleString()} KM</p>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>

            {/* Actions Administrateur */}
            <div className="space-y-4">
               <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-2 ml-2">
                 <ShieldAlert size={14} className="text-red-500" /> Actions de Sécurité Admin
               </h4>
               <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => handleResetPasswordAction(selectedUser)}
                    className="w-full bg-white text-black p-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                  >
                    <Key size={18} /> FORCER RÉINITIALISATION MDP (CLOUD)
                  </button>
                  <button 
                    onClick={() => handleDeleteUserAction(selectedUser.id)}
                    className="w-full bg-red-600/10 text-red-500 p-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest border border-red-500/20 flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                  >
                    <Trash2 size={18} /> SUPPRIMER DÉFINITIVEMENT DU CLOUD
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
