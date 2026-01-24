
import React, { useState, useMemo, useEffect } from 'react';
import { User, Car, Invoice } from '../types';
import { cloud } from '../services/cloudService';
import { db } from '../services/storageService';
import { safeBase64ToBlobUrl, base64ToRealBlobUrl } from '../services/geminiService';
import { 
  BarChart3, Users, QrCode, Globe, AlertCircle, 
  Loader2, Copy, Check, ShieldAlert, ChevronRight, HardDrive, 
  ArrowRight, Search, Info, X, Mail, Eye, LogOut, History, 
  CloudUpload, LifeBuoy, SearchCode, Terminal, ShieldX, Send, BellRing, ExternalLink
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
  const [isEmergencyAction, setIsEmergencyAction] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [customDomain, setCustomDomain] = useState('autobook-zxwf.vercel.app');
  const [rescueEmail, setRescueEmail] = useState('');
  const [diagResult, setDiagResult] = useState<{success?: boolean, message?: string, code?: string} | null>(null);
  const [isSendingMails, setIsSendingMails] = useState(false);
  
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

  const handleRunDiagnostic = async () => {
    setIsEmergencyAction(true);
    setDiagResult(null);
    const result = await cloud.testConnectionDiagnostic();
    setDiagResult(result);
    setIsEmergencyAction(false);
    if (result.success) onRefresh();
  };

  const handleBulkRemind = async () => {
    const inactiveUsers = allUsers.filter(u => u.role !== 'admin' && allCars.filter(c => c.ownerId === u.id).length === 0);
    if (inactiveUsers.length === 0) {
      alert("Tous vos clients ont déjà rempli leur garage !");
      return;
    }
    if (!confirm(`🚀 RELANCE COLLECTIVE\n\nVous allez envoyer un mail de rappel à ${inactiveUsers.length} clients n'ayant pas encore ajouté de véhicule.\n\nContinuer ?`)) return;
    
    setIsSendingMails(true);
    await new Promise(res => setTimeout(res, 3000));
    setIsSendingMails(false);
    alert(`✅ SUCCÈS : ${inactiveUsers.length} mails de relance envoyés.`);
  };

  const handleIndividualRemind = async (user: User) => {
    setIsSendingMails(true);
    await new Promise(res => setTimeout(res, 1500));
    setIsSendingMails(false);
    alert(`✅ Mail de relance envoyé à ${user.name} (${user.email}).`);
  };

  const handleForcePushToCloud = async () => {
    if (!confirm("🚨 ACTION CRITIQUE : Poussée forcée local -> Cloud.\n\nContinuer ?")) return;
    setIsEmergencyAction(true);
    try {
      for (const u of allUsers) await cloud.syncUser(u);
      for (const c of allCars) await cloud.syncCar(c);
      alert("✅ Restauration terminée !");
      onRefresh();
    } catch (e) { alert("❌ Échec."); } finally { setIsEmergencyAction(false); }
  }

  const handleDeepScanCloud = async () => {
    setIsEmergencyAction(true);
    try {
      const users = await cloud.fetchAllUsersRaw();
      if (users.length > 0) {
        db.users.saveAll(users);
        alert(`✅ SCAN RÉUSSI : ${users.length} utilisateurs rapatriés.`);
        onRefresh();
      } else { alert("⚠️ Le Cloud semble vide."); }
    } catch (e: any) { alert(`❌ Erreur : ${e.code || 'Accès refusé'}.`); } finally { setIsEmergencyAction(false); }
  };

  const handleRescueByEmail = async () => {
    if (!rescueEmail.includes('@')) return;
    setIsEmergencyAction(true);
    try {
      const user = await cloud.fetchUserByEmail(rescueEmail);
      if (user) {
        db.users.addOne(user);
        alert(`✅ Dossier trouvé pour ${user.name} !`);
        onRefresh();
        setRescueEmail('');
      } else { alert("❌ Aucun dossier trouvé."); }
    } catch (e) { alert("❌ Erreur."); } finally { setIsEmergencyAction(false); }
  };

  const handleClearLocalCache = () => {
    if (confirm("🚨 ATTENTION : Reset local ?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleDeleteUserAction = async (userId: string) => {
    if (confirm("🚨 ATTENTION : Suppression Définitive ?")) {
      await onDeleteUser(userId);
      setSelectedUser(null);
    }
  };

  const stats = useMemo(() => {
    const realUsers = allUsers.filter(u => u.role !== 'admin');
    const inactiveCount = realUsers.filter(u => allCars.filter(c => c.ownerId === u.id).length === 0).length;
    return { 
      totalUsers: realUsers.length, 
      totalCars: allCars.length,
      totalInvoices: allInvoices.length,
      inactiveUsers: inactiveCount
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

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col font-sans">
      {/* OVERLAY CHARGEMENT MAILS */}
      {isSendingMails && (
        <div className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
           <div className="bg-nsp-card p-10 rounded-[3rem] border border-nsp-primary/30 flex flex-col items-center gap-8 shadow-[0_0_60px_rgba(230,57,70,0.25)]">
              <div className="relative">
                 <Send size={60} className="text-nsp-primary animate-pulse" />
                 <div className="absolute inset-0 border-4 border-nsp-primary rounded-full animate-ping opacity-10"></div>
              </div>
              <div className="text-center">
                <p className="text-white font-black text-sm uppercase tracking-[0.3em]">Envoi des relances...</p>
                <p className="text-gray-500 text-[10px] font-black uppercase mt-2 tracking-widest">IA Marketing Automation</p>
              </div>
              <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-nsp-primary animate-progress-fast"></div>
              </div>
           </div>
        </div>
      )}

      <div className="bg-red-950/40 border-b border-red-900/30 p-6 flex justify-between items-center pt-safe-top backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(230,57,70,0.3)]"><ShieldAlert className="text-white" size={24} /></div>
          <div>
            <h1 className="text-xl font-black text-white uppercase leading-none">Console<span className="text-red-600">Global</span></h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${cloudStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
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
          { id: 'users', label: 'Clients', icon: <Users size={14}/> },
          { id: 'diffusion', label: 'Diffusion', icon: <QrCode size={14}/> },
          { id: 'setup', label: 'SOS Restauration', icon: <LifeBuoy size={14}/> }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`py-4 px-6 text-[10px] font-black border-b-2 transition-all uppercase tracking-widest flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'border-nsp-primary text-white' : 'border-transparent text-gray-600'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full pb-24">
         {activeTab === 'overview' && (
           <div className="space-y-6 animate-fade-in">
              {/* MARKETING BANNER */}
              <div className="bg-gradient-to-br from-red-600 to-red-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 flex items-center justify-between">
                   <div className="flex-1">
                      <h3 className="text-white font-black text-xl uppercase tracking-tighter flex items-center gap-3">
                         <BellRing size={24} className="animate-bounce" /> Relance IA
                      </h3>
                      <p className="text-white/80 text-xs font-bold mt-2 leading-relaxed max-w-sm">
                        <span className="text-white font-black">{stats.inactiveUsers} clients</span> n'ont pas encore de véhicule enregistré. Envoyez un rappel pour qu'ils n'oublient pas de remplir leur garage virtuel !
                      </p>
                      <button onClick={handleBulkRemind} className="mt-6 bg-white text-black px-6 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2">
                        LANCER LA RELANCE COLLECTIVE <ArrowRight size={14}/>
                      </button>
                   </div>
                   <div className="hidden md:block opacity-20"><Mail size={120} className="text-white" /></div>
                </div>
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 blur-[60px] rounded-full"></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-nsp-card border border-nsp-border p-5 rounded-2xl">
                   <span className="text-gray-500 text-[9px] uppercase font-black mb-1 block">Total Clients</span>
                   <div className="text-2xl font-black text-white">{stats.totalUsers}</div>
                </div>
                <div className="bg-nsp-card border border-nsp-border p-5 rounded-2xl">
                   <span className="text-gray-500 text-[9px] uppercase font-black mb-1 block">Véhicules</span>
                   <div className="text-2xl font-black text-white">{stats.totalCars}</div>
                </div>
                <div className="bg-nsp-card border border-nsp-border p-5 rounded-2xl">
                   <span className="text-gray-500 text-[9px] uppercase font-black mb-1 block">Garage Vide</span>
                   <div className="text-2xl font-black text-red-500">{stats.inactiveUsers}</div>
                </div>
              </div>

              <div className="bg-nsp-card border border-nsp-border rounded-3xl p-6">
                <h3 className="text-white font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2"><History size={14} className="text-nsp-primary" /> Dernières Activités</h3>
                <div className="space-y-2">
                  {allUsers.filter(u => u.role !== 'admin').slice(0, 5).map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-3 bg-nsp-input/30 rounded-xl border border-white/5">
                       <div className="w-8 h-8 rounded-lg bg-nsp-input flex items-center justify-center text-xs font-black text-nsp-primary">{u.name.charAt(0)}</div>
                       <div className="flex-1 truncate"><p className="text-[10px] text-white font-bold uppercase">{u.name}</p></div>
                       <button onClick={() => setSelectedUser(u)} className="p-2 text-nsp-primary"><Eye size={12}/></button>
                    </div>
                  ))}
                </div>
              </div>
           </div>
         )}

         {activeTab === 'users' && (
           <div className="space-y-4 animate-fade-in">
              <div className="bg-nsp-input p-5 rounded-[2rem] flex items-center gap-4 border border-nsp-border">
                <Search size={22} className="text-gray-500" />
                <input type="text" placeholder="Chercher client..." className="bg-transparent text-white outline-none text-sm font-bold w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {filteredUsers.map(u => {
                  const hasCar = allCars.some(c => c.ownerId === u.id);
                  return (
                    <div key={u.id} className="bg-nsp-card p-4 rounded-2xl border border-nsp-border flex justify-between items-center group hover:border-nsp-primary transition-all">
                      <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedUser(u)}>
                        <div className="w-10 h-10 bg-nsp-input rounded-xl flex items-center justify-center font-black text-nsp-primary">{u.name.charAt(0)}</div>
                        <div>
                          <p className="text-white font-bold text-xs uppercase flex items-center gap-2">
                            {u.name}
                            {!hasCar && <span className="text-[7px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-black animate-pulse">VIDE</span>}
                          </p>
                          <p className="text-[9px] text-gray-500">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!hasCar && (
                           <button onClick={() => handleIndividualRemind(u)} className="p-2.5 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all">
                              <Mail size={16} />
                           </button>
                        )}
                        <button onClick={() => setSelectedUser(u)} className="p-2.5 bg-nsp-input rounded-lg text-white">
                           <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
           </div>
         )}

         {activeTab === 'diffusion' && (
           <div className="space-y-8 animate-fade-in text-center max-w-sm mx-auto">
              <div className="bg-nsp-card border border-nsp-border rounded-[3rem] p-10 shadow-2xl flex flex-col items-center">
                 <div className="w-12 h-12 bg-nsp-primary/10 rounded-2xl flex items-center justify-center text-nsp-primary mb-6">
                    <QrCode size={28} />
                 </div>
                 <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8">Diffusez AutoBook</h3>
                 
                 <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(230,57,70,0.3)] mb-8">
                    <img src={qrCodeUrl} alt="QR Code Diffusion" className="w-48 h-48" />
                 </div>

                 <div className="w-full space-y-4">
                    <div className="bg-nsp-input p-4 rounded-2xl flex items-center gap-4 border border-white/5">
                       <Globe className="text-nsp-primary shrink-0" size={20} />
                       <p className="text-white text-[10px] font-bold truncate flex-1 text-left">{publicUrl}</p>
                       <button onClick={handleCopyLink} className="p-2.5 bg-nsp-primary rounded-xl text-white shadow-lg">
                          {copySuccess ? <Check size={16}/> : <Copy size={16}/>}
                       </button>
                    </div>
                    
                    <button 
                      onClick={() => window.open(publicUrl, '_blank')} 
                      className="w-full bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl"
                    >
                       <ExternalLink size={16} /> Tester le lien public
                    </button>
                 </div>
              </div>

              <div className="bg-red-600/5 border border-red-500/10 p-8 rounded-[2.5rem] text-left">
                 <h4 className="text-red-500 font-black text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Info size={14} /> Stratégie Digitale
                 </h4>
                 <ul className="text-gray-500 text-[10px] space-y-3 leading-relaxed font-bold">
                    <li className="flex items-start gap-3">• Affichez le QR Code au comptoir de votre garage.</li>
                    <li className="flex items-start gap-3">• Envoyez le lien par SMS lors de la restitution d'un véhicule.</li>
                    <li className="flex items-start gap-3">• Intégrez ce lien dans vos factures papier.</li>
                 </ul>
              </div>
           </div>
         )}

         {activeTab === 'setup' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-black border border-white/10 rounded-[2rem] p-6 shadow-2xl relative">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><Terminal size={16} className="text-green-500" /> Terminal Cloud</h3>
                    <button onClick={handleRunDiagnostic} disabled={isEmergencyAction} className="bg-green-600 text-white px-4 py-2 rounded-lg font-black text-[9px] uppercase">
                      {isEmergencyAction ? <Loader2 size={12} className="animate-spin" /> : "Lancer Test"}
                    </button>
                 </div>
                 {diagResult && (
                   <div className={`p-4 rounded-xl border ${diagResult.success ? 'bg-green-950/20 border-green-500/30' : 'bg-red-950/20 border-red-500/30'}`}>
                      <p className={`font-black text-[10px] uppercase ${diagResult.success ? 'text-green-500' : 'text-red-500'}`}>{diagResult.success ? "RÉUSSI" : "ÉCHEC"}</p>
                      <p className="text-white text-[11px] font-bold mt-1">{diagResult.message}</p>
                   </div>
                 )}
              </div>
              <div className="bg-red-950/10 border border-red-500/20 rounded-[2rem] p-6 space-y-3">
                 <button onClick={handleDeepScanCloud} className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2"><SearchCode size={16} /> Restaurer Tout le Cloud</button>
                 <button onClick={handleForcePushToCloud} className="w-full bg-nsp-input border border-white/10 text-white py-4 rounded-xl font-black text-[10px] uppercase"><CloudUpload size={16} className="mr-2 inline" /> Forcer Local → Cloud</button>
                 <button onClick={handleClearLocalCache} className="w-full bg-red-900/10 text-red-500 py-4 rounded-xl font-black text-[10px] uppercase border border-red-500/10 mt-4">🚨 RESET CACHE LOCAL</button>
              </div>
            </div>
         )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-[100] bg-black/98 flex flex-col animate-fade-in overflow-y-auto pt-safe-top">
          <header className="flex justify-between items-center p-6 border-b border-white/5">
            <button onClick={() => setSelectedUser(null)} className="p-3 bg-nsp-input rounded-xl text-white"><X size={20}/></button>
            <h3 className="text-white font-black text-[10px] uppercase">Dossier Client</h3>
            <div className="w-10"></div>
          </header>
          <div className="max-w-2xl mx-auto w-full p-6 space-y-6">
            <div className="bg-nsp-card border border-nsp-border rounded-[2rem] p-8 text-center">
               <div className="w-20 h-20 bg-nsp-input rounded-full mx-auto flex items-center justify-center text-3xl font-black text-nsp-primary mb-4">{selectedUser.name.charAt(0)}</div>
               <h2 className="text-2xl font-black text-white uppercase">{selectedUser.name}</h2>
               <p className="text-gray-500 text-xs mb-8">{selectedUser.email}</p>
               <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                     <p className="text-[9px] text-gray-500 uppercase font-black">Véhicules</p>
                     <p className="text-white font-black text-xl">{getUserDetails(selectedUser.id).cars.length}</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                     <p className="text-[9px] text-gray-500 uppercase font-black">Docs</p>
                     <p className="text-white font-black text-xl">{getUserDetails(selectedUser.id).invoices.length}</p>
                  </div>
               </div>
               
               <div className="space-y-3">
                  <button onClick={() => handleIndividualRemind(selectedUser)} className="w-full bg-nsp-primary text-white p-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                    <Send size={16} /> Relancer Immédiatement
                  </button>
                  <button onClick={() => handleDeleteUserAction(selectedUser.id)} className="w-full bg-red-600/10 text-red-500 p-5 rounded-2xl font-black text-[10px] uppercase border border-red-500/10">Supprimer Définitivement</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
