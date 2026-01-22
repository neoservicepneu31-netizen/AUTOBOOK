
import React, { useState, useMemo, useEffect } from 'react';
import { User, Car, Invoice } from '../types';
import { cloud } from '../services/cloudService';
import { db } from '../services/storageService';
import { safeBase64ToBlobUrl, base64ToRealBlobUrl } from '../services/geminiService';
import { 
  BarChart3, Users, QrCode, Printer, Globe, Radio, Database, ExternalLink, AlertCircle, RefreshCcw,
  Loader2, Copy, Check, ShieldAlert, ChevronRight, MousePointer2, HardDrive, Plus, ShieldCheck, ArrowRight,
  Search, Info, Car as CarIcon, X, Smartphone, Globe2, Link, ExternalLink as OpenLink, Trash2, Key, History, Mail, Eye, LogOut, Clock, Wrench, UserPlus, FileText, Share2, Download, Image as ImageIcon, Maximize2, CloudUpload, CloudDownload, LifeBuoy, SearchCode, DatabaseBackup, Terminal, ShieldX
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
  const [viewingDoc, setViewingDoc] = useState<{title: string, url: string} | null>(null);
  const [customDomain, setCustomDomain] = useState('autobook-zxwf.vercel.app');
  const [rescueEmail, setRescueEmail] = useState('');
  const [diagResult, setDiagResult] = useState<{success?: boolean, message?: string, code?: string} | null>(null);
  
  const isCloudActive = cloud.isConnected();
  const isApiDisabled = cloud.isApiDisabled();
  
  const isPDF = (url?: string) => {
    if (!url) return false;
    return url.includes('application/pdf') || url.substring(0, 30).includes('JVBER');
  };

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

  const handleReconnectCloud = () => {
    cloud.resetActivationFlag();
    window.location.reload();
  };

  const handleRunDiagnostic = async () => {
    setIsEmergencyAction(true);
    setDiagResult(null);
    const result = await cloud.testConnectionDiagnostic();
    setDiagResult(result);
    setIsEmergencyAction(false);
    if (result.success) onRefresh();
  };

  const handleForcePushToCloud = async () => {
    if (!confirm("🚨 ACTION CRITIQUE : Cette opération va forcer l'envoi de TOUS les utilisateurs locaux vers Firebase.\n\nUtilisez cela si vous voyez des utilisateurs ici mais qu'ils ont disparu du Cloud.\n\nContinuer ?")) return;
    
    setIsEmergencyAction(true);
    try {
      for (const u of allUsers) {
        await cloud.syncUser(u);
      }
      for (const c of allCars) {
        await cloud.syncCar(c);
      }
      alert("✅ Restauration terminée !");
      onRefresh();
    } catch (e) {
      alert("❌ Échec.");
    } finally {
      setIsEmergencyAction(false);
    }
  }

  const handleDeepScanCloud = async () => {
    setIsEmergencyAction(true);
    try {
      const users = await cloud.fetchAllUsersRaw();
      if (users.length > 0) {
        db.users.saveAll(users);
        alert(`✅ SCAN RÉUSSI : ${users.length} utilisateurs rapatriés.`);
        onRefresh();
      } else {
        alert("⚠️ Le Cloud semble vide.");
      }
    } catch (e: any) {
      alert(`❌ Erreur : ${e.code || 'Accès refusé'}. Vérifiez vos règles Firebase.`);
    } finally {
      setIsEmergencyAction(false);
    }
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
      } else {
        alert("❌ Aucun dossier trouvé pour cet email.");
      }
    } catch (e) {
      alert("❌ Erreur de recherche.");
    } finally {
      setIsEmergencyAction(false);
    }
  };

  const handleClearLocalCache = () => {
    if (confirm("🚨 ATTENTION : Vous allez vider la mémoire locale de ce navigateur.\n\nCela forcera l'application à re-télécharger TOUT depuis le Cloud au prochain démarrage.\n\nContinuer ?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleDeleteUserAction = async (userId: string) => {
    if (confirm("🚨 ATTENTION : Suppression Définitive\n\nCette action est irréversible.\n\nContinuer ?")) {
      await onDeleteUser(userId);
      setSelectedUser(null);
    }
  };

  const stats = useMemo(() => {
    const realUsers = allUsers.filter(u => u.role !== 'admin');
    return { 
      totalUsers: realUsers.length, 
      totalCars: allCars.length,
      totalInvoices: allInvoices.length
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
          { id: 'users', label: 'Tous les Clients', icon: <Users size={14}/> },
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-nsp-card border border-nsp-border p-5 rounded-2xl">
                   <span className="text-gray-500 text-[9px] uppercase font-black tracking-widest block mb-1">Total Clients</span>
                   <div className="text-2xl font-black text-white">{stats.totalUsers}</div>
                </div>
                <div className="bg-nsp-card border border-nsp-border p-5 rounded-2xl">
                   <span className="text-gray-500 text-[9px] uppercase font-black tracking-widest block mb-1">Véhicules</span>
                   <div className="text-2xl font-black text-white">{stats.totalCars}</div>
                </div>
                <div className="bg-nsp-card border border-nsp-border p-5 rounded-2xl">
                   <span className="text-gray-500 text-[9px] uppercase font-black tracking-widest block mb-1">Documents</span>
                   <div className="text-2xl font-black text-white">{stats.totalInvoices}</div>
                </div>
              </div>
              <div className="bg-nsp-card border border-nsp-border rounded-3xl p-6">
                <h3 className="text-white font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <History size={14} className="text-nsp-primary" /> Derniers Clients Locaux
                </h3>
                <div className="space-y-2">
                  {allUsers.filter(u => u.role !== 'admin').slice(0, 5).map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-3 bg-nsp-input/30 rounded-xl border border-white/5">
                       <div className="w-8 h-8 rounded-lg bg-nsp-input flex items-center justify-center text-xs font-black text-nsp-primary">{u.name.charAt(0)}</div>
                       <div className="flex-1 overflow-hidden">
                          <p className="text-[10px] text-white font-bold uppercase truncate">{u.name}</p>
                          <p className="text-[8px] text-gray-500 truncate">{u.email}</p>
                       </div>
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
                <input type="text" placeholder="Chercher un nom ou un email..." className="bg-transparent text-white outline-none text-sm font-bold w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {filteredUsers.map(u => (
                  <div key={u.id} onClick={() => setSelectedUser(u)} className="bg-nsp-card p-4 rounded-2xl border border-nsp-border flex justify-between items-center cursor-pointer group hover:border-nsp-primary transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-nsp-input rounded-xl flex items-center justify-center font-black text-nsp-primary">{u.name.charAt(0)}</div>
                      <div>
                        <p className="text-white font-bold text-xs uppercase">{u.name}</p>
                        <p className="text-[9px] text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-700" />
                  </div>
                ))}
              </div>
           </div>
         )}

         {activeTab === 'setup' && (
            <div className="space-y-6 animate-fade-in">
              {/* TERMINAL DE DIAGNOSTIC */}
              <div className="bg-black border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                       <Terminal size={16} className="text-green-500" /> Terminal de Diagnostic Cloud
                    </h3>
                    <button 
                      onClick={handleRunDiagnostic} 
                      disabled={isEmergencyAction}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-black text-[9px] uppercase shadow-lg active:scale-95 disabled:opacity-50"
                    >
                      {isEmergencyAction ? <Loader2 size={12} className="animate-spin" /> : "Lancer le Test"}
                    </button>
                 </div>

                 {diagResult ? (
                   <div className={`p-4 rounded-xl border flex gap-4 ${diagResult.success ? 'bg-green-950/20 border-green-500/30' : 'bg-red-950/20 border-red-500/30'}`}>
                      {diagResult.success ? <ShieldCheck className="text-green-500" size={24} /> : <ShieldX className="text-red-500" size={24} />}
                      <div className="flex-1">
                        <p className={`font-black text-[10px] uppercase ${diagResult.success ? 'text-green-500' : 'text-red-500'}`}>
                           {diagResult.success ? "RÉUSSI" : "ÉCHEC CRITIQUE"}
                        </p>
                        <p className="text-white text-[11px] font-bold mt-1 leading-relaxed">{diagResult.message}</p>
                        {diagResult.code && (
                          <div className="mt-2 bg-black/50 p-2 rounded font-mono text-[9px] text-gray-400">Code: {diagResult.code}</div>
                        )}
                        {!diagResult.success && diagResult.code === 'permission-denied' && (
                          <p className="text-yellow-500 text-[9px] font-black uppercase mt-2">Vérifiez vos règles Firebase !</p>
                        )}
                      </div>
                   </div>
                 ) : (
                   <div className="p-8 text-center text-gray-700">
                      <Database className="mx-auto mb-2 opacity-20" size={32} />
                      <p className="text-[9px] font-black uppercase tracking-widest">En attente de diagnostic...</p>
                   </div>
                 )}
              </div>

              <div className="bg-red-950/10 border border-red-500/20 rounded-[2rem] p-6 space-y-4">
                 <h3 className="text-red-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <LifeBuoy size={16} /> Outils de Restauration
                 </h3>
                 <div className="grid grid-cols-1 gap-3">
                    <button onClick={handleDeepScanCloud} disabled={isEmergencyAction} className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
                       <SearchCode size={16} /> Scanner TOUT le Cloud (Restauration Massive)
                    </button>
                    <div className="flex gap-2">
                       <input 
                         type="email" 
                         placeholder="Chercher email précis..." 
                         value={rescueEmail} 
                         onChange={(e) => setRescueEmail(e.target.value)} 
                         className="flex-1 bg-nsp-input border border-white/10 rounded-xl px-4 text-white text-xs outline-none"
                       />
                       <button onClick={handleRescueByEmail} disabled={isEmergencyAction} className="bg-white text-black px-4 py-3 rounded-xl font-black text-[10px] uppercase">SCAN</button>
                    </div>
                    <button onClick={handleForcePushToCloud} disabled={isEmergencyAction} className="w-full bg-nsp-input border border-white/10 text-white py-4 rounded-xl font-black text-[10px] uppercase active:scale-95 transition-all">
                       <CloudUpload size={16} className="mr-2 inline" /> {"Forcer Poussée Local → Cloud"}
                    </button>
                    <button onClick={handleClearLocalCache} className="w-full bg-red-900/10 text-red-500 py-4 rounded-xl font-black text-[10px] uppercase border border-red-500/10 mt-4">
                       🚨 VIDER LE CACHE LOCAL (RESET COMPLET)
                    </button>
                 </div>
              </div>
            </div>
         )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-[100] bg-black/98 flex flex-col animate-fade-in overflow-y-auto">
          <header className="flex justify-between items-center p-6 pt-safe-top sticky top-0 bg-black/50 border-b border-white/5 z-20">
            <button onClick={() => setSelectedUser(null)} className="p-3 bg-nsp-input rounded-xl text-white"><X size={20}/></button>
            <h3 className="text-white font-black text-[10px] uppercase tracking-widest">Dossier Client</h3>
            <div className="w-10"></div>
          </header>
          <div className="max-w-2xl mx-auto w-full p-6 space-y-6">
            <div className="bg-nsp-card border border-nsp-border rounded-[2rem] p-6 text-center">
               <div className="w-16 h-16 bg-nsp-input rounded-full mx-auto flex items-center justify-center text-2xl font-black text-nsp-primary mb-4">{selectedUser.name.charAt(0)}</div>
               <h2 className="text-xl font-black text-white uppercase">{selectedUser.name}</h2>
               <p className="text-gray-500 text-xs mb-6">{selectedUser.email}</p>
               <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                     <p className="text-[8px] text-gray-500 uppercase font-black">Véhicules</p>
                     <p className="text-white font-bold">{getUserDetails(selectedUser.id).cars.length}</p>
                  </div>
                  <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                     <p className="text-[8px] text-gray-500 uppercase font-black">Docs</p>
                     <p className="text-white font-bold">{getUserDetails(selectedUser.id).invoices.length}</p>
                  </div>
               </div>
               <button onClick={() => handleDeleteUserAction(selectedUser.id)} className="w-full bg-red-600/10 text-red-500 p-4 rounded-xl font-black text-[9px] uppercase border border-red-500/10">SUPPRIMER COMPTE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
