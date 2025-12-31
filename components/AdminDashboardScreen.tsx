
import React, { useState, useMemo, useEffect } from 'react';
import { User, Car, Invoice } from '../types';
import { cloud } from '../services/cloudService';
import { 
  BarChart3, Users, QrCode, Printer, Globe, Radio, Database, ExternalLink, AlertCircle, RefreshCcw,
  Loader2, Copy, Check, ShieldAlert, ChevronRight, MousePointer2, HardDrive, Plus, ShieldCheck, ArrowRight,
  Search, Info, Car as CarIcon, X, Smartphone, Globe2, Link, ExternalLink as OpenLink, Trash2, Key, History, Mail, Eye, LogOut, Clock, Wrench, UserPlus, FileText, Share2, Download
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

  const qrCodeUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(publicUrl)}&color=E63946&bgcolor=1E1E1E`;
  }, [publicUrl]);

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
    const newUsers = realUsers.filter(u => {
      if (!u.createdAt) return false;
      const createdDate = new Date(u.createdAt);
      const now = new Date();
      return (now.getTime() - createdDate.getTime()) < (48 * 60 * 60 * 1000);
    });
    return { 
      totalUsers: realUsers.length, 
      newUsers: newUsers.length,
      totalCars: allCars.length,
      totalInvoices: allInvoices.length,
      totalRevenue: allInvoices.reduce((acc, inv) => acc + (inv.price || 0), 0)
    };
  }, [allUsers, allCars, allInvoices]);

  const getUserDetails = (userId: string) => {
    const cars = allCars.filter(c => c.ownerId === userId);
    const userInvoices = allInvoices.filter(i => cars.some(c => c.id === i.carId));
    return { cars, invoices: userInvoices };
  };

  const filteredUsers = allUsers
    .filter(u => u.role !== 'admin')
    .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

  const renderKPI = (label: string, value: string | number, icon: React.ReactNode, color: string) => (
    <div className="bg-nsp-card border border-nsp-border p-5 rounded-2xl relative overflow-hidden shadow-xl">
      <div className={`absolute top-0 right-0 p-4 opacity-10 ${color}`}>{icon}</div>
      <span className="text-gray-500 text-[9px] uppercase font-black tracking-widest block mb-1">{label}</span>
      <div className="text-2xl font-black text-white">{value}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col font-sans">
      <div className="bg-red-950/40 border-b border-red-900/30 p-6 flex justify-between items-center pt-safe-top backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(230,57,70,0.3)]"><ShieldAlert className="text-white" size={24} /></div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Console<span className="text-red-600">Global</span></h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${cloudStatus === 'online' ? 'bg-green-500 animate-pulse' : cloudStatus === 'error' ? 'bg-red-500 animate-bounce' : cloudStatus === 'warning' ? 'bg-yellow-500' : 'bg-blue-500 animate-spin'}`}></div>
              <p className="text-green-500 text-[8px] uppercase font-black tracking-widest">Surveillance Active</p>
            </div>
          </div>
        </div>
        <button onClick={onLogout} className="text-white bg-red-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 flex items-center gap-2">
          <LogOut size={14} /> Quitter
        </button>
      </div>

      <div className="flex border-b border-nsp-border px-4 bg-nsp-card/20 overflow-x-auto no-scrollbar backdrop-blur-sm sticky top-[84px] z-40">
        {[
          { id: 'overview', label: 'Surveillance', icon: <BarChart3 size={14}/> },
          { id: 'users', label: 'Tous les Clients', icon: <Users size={14}/> },
          { id: 'diffusion', label: 'Diffusion', icon: <QrCode size={14}/> },
          { id: 'setup', label: 'Cloud Liaison', icon: <Database size={14}/> }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`py-4 px-6 text-[10px] font-black border-b-2 transition-all uppercase tracking-widest flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'border-nsp-primary text-white' : 'border-transparent text-gray-600'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full pb-24">
         {activeTab === 'overview' && (
           <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {renderKPI("Total Clients", stats.totalUsers, <Users size={20}/>, "text-blue-500")}
                {renderKPI("Nouveaux (48h)", stats.newUsers, <UserPlus size={20}/>, "text-yellow-500")}
                {renderKPI("Véhicules", stats.totalCars, <CarIcon size={20}/>, "text-green-500")}
                {renderKPI("Documents", stats.totalInvoices, <FileText size={20}/>, "text-red-500")}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-nsp-card border border-nsp-border rounded-3xl p-6">
                  <h3 className="text-white font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <History size={14} className="text-nsp-primary" /> Dernières Inscriptions
                  </h3>
                  <div className="space-y-4">
                    {allUsers.filter(u => u.role !== 'admin').length === 0 ? (
                      <div className="text-center py-10"><Database className="mx-auto text-gray-800 mb-2" size={32}/><p className="text-gray-700 text-[10px] font-black uppercase">Aucun client</p></div>
                    ) : (
                      allUsers.filter(u => u.role !== 'admin').sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5).map(u => (
                        <div key={u.id} className="flex items-center gap-3 p-3 bg-nsp-input/30 rounded-2xl border border-white/5">
                           <div className="w-10 h-10 rounded-full bg-nsp-input flex items-center justify-center text-xs font-black text-nsp-primary border border-white/10">{u.name.charAt(0)}</div>
                           <div className="flex-1">
                              <p className="text-xs text-white font-bold uppercase">{u.name}</p>
                              <p className="text-[8px] text-gray-500">{u.createdAt ? new Date(u.createdAt).toLocaleString() : 'Date inconnue'}</p>
                           </div>
                           <button onClick={() => setSelectedUser(u)} className="p-2 bg-nsp-primary/10 rounded-lg text-nsp-primary hover:bg-nsp-primary hover:text-white transition-colors"><Eye size={12}/></button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-nsp-card border border-nsp-border rounded-3xl p-6">
                  <h3 className="text-white font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Radio size={14} className="text-green-500 animate-pulse" /> Activité Flux
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-nsp-input/30 rounded-2xl border border-white/5 flex items-center gap-4">
                       <Smartphone size={20} className="text-gray-600" />
                       <p className="text-[10px] text-gray-400 font-bold leading-relaxed">Le système Cloud surveille <span className="text-white font-black">{stats.totalInvoices} archives numériques</span> certifiées.</p>
                    </div>
                  </div>
                </div>
              </div>
           </div>
         )}

         {activeTab === 'users' && (
           <div className="space-y-4 animate-fade-in">
              <div className="bg-nsp-input p-5 rounded-[2rem] flex items-center gap-4 border border-nsp-border shadow-inner">
                <Search size={22} className="text-gray-500" />
                <input type="text" placeholder="Chercher un nom ou un email..." className="bg-transparent text-white outline-none text-sm font-bold w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 gap-3">
                {filteredUsers.map(u => {
                  const { cars } = getUserDetails(u.id);
                  const isNew = u.createdAt && (new Date().getTime() - new Date(u.createdAt).getTime()) < (48 * 60 * 60 * 1000);
                  return (
                    <div key={u.id} onClick={() => setSelectedUser(u)} className="bg-nsp-card p-4 rounded-3xl border border-nsp-border flex justify-between items-center hover:border-nsp-primary transition-all group cursor-pointer shadow-lg active:scale-95">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-nsp-input rounded-2xl flex items-center justify-center font-black text-nsp-primary border border-white/5 group-hover:scale-110 transition-transform">{u.name.charAt(0)}</div>
                        <div>
                          <p className="text-white font-bold text-sm uppercase flex items-center gap-2">
                             {u.name}
                             {isNew && <span className="text-[7px] bg-nsp-primary text-white px-1.5 py-0.5 rounded-full animate-pulse">NOUVEAU</span>}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-gray-500 font-bold uppercase">{cars.length} Véhicule(s)</span>
                            <span className="w-1 h-1 rounded-full bg-gray-800"></span>
                            <span className="text-[9px] text-gray-600 font-medium truncate max-w-[150px]">{u.email}</span>
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
           <div className="space-y-8 animate-fade-in">
              <div className="bg-nsp-card border border-nsp-border rounded-[2.5rem] p-8 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nsp-primary to-transparent opacity-50"></div>
                
                <h3 className="text-white font-black text-lg uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                   <QrCode className="text-nsp-primary" size={24} /> Point d'Accès Client
                </h3>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-10">Partagez votre Garage Numérique</p>

                <div className="bg-white p-6 rounded-[2rem] inline-block shadow-[0_0_50px_rgba(230,57,70,0.15)] mb-10 relative group">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code de Diffusion" 
                    className="w-56 h-56 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-[2rem]">
                     <Printer className="text-nsp-primary" size={40} />
                  </div>
                </div>

                <div className="space-y-4 max-w-sm mx-auto">
                   <div className="bg-nsp-input p-5 rounded-2xl border border-white/5 flex items-center gap-4 group">
                      <Globe2 size={24} className="text-nsp-primary" />
                      <div className="flex-1 text-left overflow-hidden">
                         <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest">URL Vercel de l'App :</p>
                         <p className="text-white font-bold text-xs truncate">{publicUrl}</p>
                      </div>
                      <button 
                        onClick={handleCopyLink}
                        className={`p-3 rounded-xl transition-all ${copySuccess ? 'bg-green-600 text-white' : 'bg-white/5 text-white hover:bg-nsp-primary'}`}
                      >
                         {copySuccess ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                   </div>
                   
                   <div className="flex gap-3">
                      <button onClick={() => window.open(publicUrl, '_blank')} className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl">
                        <OpenLink size={16} /> Tester le lien
                      </button>
                      <button onClick={() => window.print()} className="flex-1 bg-nsp-input border border-white/10 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                        <Printer size={16} /> Imprimer QR
                      </button>
                   </div>
                </div>
              </div>

              <div className="bg-nsp-card border border-nsp-border rounded-[2.5rem] p-8">
                <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                   <ShieldCheck size={16} className="text-green-500" /> Guide d'Installation
                </h4>
                <div className="space-y-4">
                  {[
                    { step: 1, text: "Imprimez le QR Code sur vos factures ou comptoirs." },
                    { step: 2, text: "Le client scanne avec son mobile (aucune application à installer)." },
                    { step: 3, text: "Le carnet de santé numérique NSP s'ouvre instantanément." },
                    { step: 4, text: "Le client accède à son coffre-fort d'entretien 24/7." }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-start bg-nsp-input/30 p-4 rounded-2xl border border-white/5">
                       <span className="w-6 h-6 rounded-full bg-nsp-primary text-white flex items-center justify-center text-[10px] font-black shrink-0">{item.step}</span>
                       <p className="text-gray-400 text-xs font-medium leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
           </div>
         )}

         {activeTab === 'setup' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-nsp-card border border-nsp-border rounded-[2.5rem] p-8 shadow-2xl">
                 <h3 className="text-white font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Database size={18} className="text-nsp-primary" /> Configuration des Domaines
                 </h3>
                 <div className="space-y-6">
                    <div>
                      <label className="text-[9px] text-gray-500 font-black uppercase mb-2 block ml-1">Domaine de Diffusion Vercel</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={customDomain} 
                          onChange={(e) => setCustomDomain(e.target.value)}
                          className="w-full bg-nsp-input border border-transparent focus:border-nsp-primary rounded-2xl px-5 py-4 text-white font-bold text-sm outline-none transition-all"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                           <Globe size={14} className="text-gray-600" />
                        </div>
                      </div>
                      <p className="text-[8px] text-gray-600 font-bold uppercase mt-2 ml-1">Modifie dynamiquement le QR code généré ci-dessus.</p>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
                       <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-start gap-4">
                          <AlertCircle size={20} className="text-yellow-500 shrink-0" />
                          <p className="text-[10px] text-yellow-500 font-bold leading-relaxed uppercase">La base de données Cloud est actuellement synchronisée avec le projet : <span className="text-white">autobook-nsp</span>.</p>
                       </div>
                       <button className="w-full bg-nsp-primary text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                         <RefreshCcw size={16} /> Forcer la Synchronisation Globale
                       </button>
                    </div>
                 </div>
              </div>
            </div>
         )}
      </div>

      {/* DETAILED DOSSIER CLIENT MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col animate-fade-in overflow-y-auto">
          <header className="flex justify-between items-center p-6 pt-safe-top sticky top-0 bg-black/50 border-b border-white/5 z-20">
            <button onClick={() => setSelectedUser(null)} className="p-3 bg-nsp-input rounded-2xl text-white"><X size={24}/></button>
            <div className="text-center">
              <h3 className="text-white font-black text-xs uppercase tracking-widest">DOSSIER COMPLET DU CLIENT</h3>
              <p className="text-[9px] text-nsp-primary font-black uppercase mt-1">Personnel NSP Autorisé</p>
            </div>
            <div className="w-12"></div>
          </header>

          <div className="max-w-2xl mx-auto w-full p-6 space-y-10 pb-32">
            <div className="bg-nsp-card border border-nsp-border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
               <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 bg-nsp-input rounded-[1.5rem] flex items-center justify-center text-4xl font-black text-nsp-primary border border-white/10">{selectedUser.name.charAt(0)}</div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-black text-white uppercase">{selectedUser.name}</h2>
                    <p className="text-gray-500 text-sm flex items-center gap-2"><Mail size={14}/> {selectedUser.email}</p>
                    <div className="mt-3 flex gap-2">
                       <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${selectedUser.isPremium ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400'}`}>
                         {selectedUser.isPremium ? '💎 Membre Premium' : 'Utilisateur Gratuit'}
                       </span>
                    </div>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                     <p className="text-[8px] text-gray-500 uppercase font-black mb-1">Véhicules Inscrits</p>
                     <p className="text-white font-bold text-xl">{getUserDetails(selectedUser.id).cars.length}</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                     <p className="text-[8px] text-gray-500 uppercase font-black mb-1">Documents Archivés</p>
                     <p className="text-white font-bold text-xl">{getUserDetails(selectedUser.id).invoices.length}</p>
                  </div>
               </div>

               <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Clock size={12} className="text-gray-600" />
                     <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Compte créé le</span>
                  </div>
                  <span className="text-[10px] text-white font-bold">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Inconnue'}</span>
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-2 ml-2">
                 <CarIcon size={14} className="text-nsp-primary" /> Parc Automobile du Client
               </h4>
               <div className="space-y-4">
                  {getUserDetails(selectedUser.id).cars.length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-nsp-border rounded-3xl text-center text-gray-700 font-black text-[10px] uppercase">Aucun véhicule enregistré</div>
                  ) : (
                    getUserDetails(selectedUser.id).cars.map(car => {
                      const carInvoices = allInvoices.filter(i => i.carId === car.id);
                      return (
                        <div key={car.id} className="bg-nsp-card border border-nsp-border rounded-[2rem] overflow-hidden shadow-xl">
                           <div className="p-5 bg-nsp-input/50 border-b border-white/5 flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-nsp-input flex items-center justify-center text-nsp-primary font-black border border-white/5">{car.name.charAt(0)}</div>
                                 <div>
                                   <h5 className="text-white font-black text-sm uppercase">{car.name}</h5>
                                   <p className="text-[9px] text-nsp-primary font-black uppercase tracking-widest">{car.plate}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-black text-xs">{car.initialKm.toLocaleString()} KM</p>
                                <p className="text-[8px] text-gray-600 uppercase font-bold">{carInvoices.length} Interventions</p>
                              </div>
                           </div>
                           <div className="p-4 grid grid-cols-2 gap-2">
                              <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                 <p className="text-[8px] text-gray-600 font-black uppercase mb-1">Pneus</p>
                                 <p className="text-white font-bold text-[10px] truncate">{car.specs?.tireDimensions || 'Non scanné'}</p>
                              </div>
                              <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                 <p className="text-[8px] text-gray-600 font-black uppercase mb-1">Huile</p>
                                 <p className="text-white font-bold text-[10px] truncate">{car.specs?.oilViscosity || 'Non scanné'}</p>
                              </div>
                           </div>
                        </div>
                      );
                    })
                  )}
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-2 ml-2">
                 <ShieldAlert size={14} className="text-red-500" /> Actions de Sécurité Admin
               </h4>
               <div className="grid grid-cols-1 gap-3">
                  <button onClick={() => handleResetPasswordAction(selectedUser)} className="w-full bg-white text-black p-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                    <Key size={18} /> RÉINITIALISER MOT DE PASSE (PROVISOIRE)
                  </button>
                  <button onClick={() => handleDeleteUserAction(selectedUser.id)} className="w-full bg-red-600/10 text-red-500 p-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest border border-red-500/20 flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                    <Trash2 size={18} /> SUPPRIMER LE COMPTE CLOUD DÉFINITIVEMENT
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
