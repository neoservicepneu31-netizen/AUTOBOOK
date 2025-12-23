
import React, { useState, useEffect } from 'react';
import { User, Car, Invoice } from '../types';
import { LogOut, Users, FileText, Car as CarIcon, ShieldAlert, Search, CheckCircle2, XCircle, Lock, HardDrive, Activity, Settings, Cpu, Database, Wifi, Share2, Smartphone, Copy, QrCode, Info, Globe } from 'lucide-react';

interface AdminDashboardScreenProps {
  currentUser: User;
  allUsers: User[];
  allCars: Car[];
  allInvoices: Invoice[];
  onLogout: () => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ currentUser, allUsers, allCars, allInvoices, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'alerts' | 'system' | 'share'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  
  // System Stats State
  const [storageUsage, setStorageUsage] = useState(0);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline'>('online');

  useEffect(() => {
    if (activeTab === 'system') {
        try {
            let total = 0;
            const keys = Object.keys(localStorage);
            for (const key of keys) {
                const value = localStorage.getItem(key);
                if (value) {
                    total += ((value.length + key.length) * 2);
                }
            }
            setStorageUsage(total / 1024 / 1024); // MB
        } catch (e) {
            console.warn("Erreur lecture stockage", e);
            setStorageUsage(0);
        }
        setApiStatus(navigator.onLine ? 'online' : 'offline');
    }
  }, [activeTab]);

  const totalStorage = allInvoices.length * 2.5; 
  const usersRequestingReset = allUsers.filter(u => u.passwordResetRequested);
  const pendingResets = usersRequestingReset.length;

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-nsp-input p-4 rounded-xl border border-nsp-border">
          <div className="flex items-center justify-between mb-2">
             <span className="text-gray-400 text-xs uppercase tracking-wider">Utilisateurs</span>
             <Users size={16} className="text-nsp-primary" />
          </div>
          <div className="text-2xl font-bold text-white">{allUsers.length}</div>
          <div className="text-xs text-green-500 mt-1">+12% ce mois</div>
        </div>
        <div className="bg-nsp-input p-4 rounded-xl border border-nsp-border">
          <div className="flex items-center justify-between mb-2">
             <span className="text-gray-400 text-xs uppercase tracking-wider">Documents</span>
             <FileText size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-white">{allInvoices.length}</div>
          <div className="text-xs text-gray-500 mt-1">Stockés sécurisés</div>
        </div>
        <div className="bg-nsp-input p-4 rounded-xl border border-nsp-border">
          <div className="flex items-center justify-between mb-2">
             <span className="text-gray-400 text-xs uppercase tracking-wider">Véhicules</span>
             <CarIcon size={16} className="text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-white">{allCars.length}</div>
          <div className="text-xs text-gray-500 mt-1">Actifs</div>
        </div>
        <div className="bg-nsp-input p-4 rounded-xl border border-nsp-border">
          <div className="flex items-center justify-between mb-2">
             <span className="text-gray-400 text-xs uppercase tracking-wider">Stockage</span>
             <HardDrive size={16} className="text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-white">{totalStorage.toFixed(1)} MB</div>
          <div className="text-xs text-gray-500 mt-1">Sur 50 GB</div>
        </div>
      </div>
      <div className="bg-nsp-card border border-nsp-border rounded-xl p-5">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Activity size={18} className="text-nsp-primary" /> Activité Récente
        </h3>
        <div className="space-y-4">
           <div className="flex items-center justify-between text-sm">
             <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-green-500"></div>
               <span className="text-gray-300">Nouvel utilisateur inscrit</span>
             </div>
             <span className="text-gray-600 text-xs">Il y a 10 min</span>
           </div>
           <div className="flex items-center justify-between text-sm">
             <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-blue-500"></div>
               <span className="text-gray-300">Facture uploadée (Clio V)</span>
             </div>
             <span className="text-gray-600 text-xs">Il y a 45 min</span>
           </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-nsp-input p-3 rounded-lg flex items-center gap-3 border border-nsp-border focus-within:border-nsp-primary transition-colors">
        <Search size={20} className="text-gray-500" />
        <input 
          type="text" 
          placeholder="Rechercher un utilisateur..." 
          className="bg-transparent text-white placeholder-gray-500 outline-none flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        {allUsers.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
          <div key={u.id} className="bg-nsp-card p-4 rounded-xl border border-nsp-border flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${u.role === 'admin' ? 'bg-red-900/50 text-red-500' : 'bg-gray-800 text-gray-400'}`}>
                 {u.name.charAt(0)}
               </div>
               <div>
                 <h4 className="text-white font-bold text-sm">{u.name}</h4>
                 <p className="text-xs text-gray-500">{u.email}</p>
               </div>
             </div>
             <div className="flex items-center gap-2">
               {u.role === 'admin' ? (
                 <span className="text-[10px] bg-red-500 text-white px-2 py-1 rounded uppercase font-bold">Admin</span>
               ) : (
                 <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-1 rounded uppercase font-bold">User</span>
               )}
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-nsp-card border border-nsp-border rounded-xl p-5">
         <h3 className="text-white font-bold mb-4 flex items-center gap-2">
           <Lock size={18} className="text-nsp-warning" /> Demandes de sécurité ({pendingResets})
         </h3>
         <div className="space-y-4">
            {pendingResets === 0 ? (
                <p className="text-sm text-gray-500 italic">Aucune demande en attente.</p>
            ) : (
                usersRequestingReset.map(u => (
                    <div key={u.id} className="bg-nsp-input p-4 rounded-lg flex flex-col gap-3 border border-nsp-border">
                       <div className="flex justify-between">
                         <span className="text-white font-bold text-sm">Reset Password</span>
                         <span className="text-xs text-red-400 font-bold">URGENT</span>
                       </div>
                       <p className="text-xs text-gray-400">{u.email}</p>
                       <div className="flex gap-2">
                         <button onClick={() => alert(`Email envoyé à ${u.email}`)} className="flex-1 bg-nsp-success text-white text-xs font-bold py-2 rounded">VALIDER</button>
                         <button onClick={() => alert("Refusé")} className="flex-1 bg-red-900/50 text-red-400 text-xs font-bold py-2 rounded border border-red-800">REFUSER</button>
                       </div>
                    </div>
                ))
            )}
         </div>
      </div>
    </div>
  );

  const renderSystem = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-nsp-card border border-nsp-border rounded-xl p-5">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                <Cpu size={20} className="text-nsp-primary" /> État du Système PWA
            </h3>
            
            <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-nsp-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-nsp-input rounded-lg"><Wifi size={20} className={apiStatus === 'online' ? "text-green-500" : "text-red-500"} /></div>
                        <div>
                            <p className="text-white font-bold text-sm">Connectivité API</p>
                            <p className="text-xs text-gray-500">{apiStatus === 'online' ? 'Connecté au Cloud NSP' : 'Mode Hors-Ligne'}</p>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${apiStatus === 'online' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                        {apiStatus === 'online' ? 'ONLINE' : 'OFFLINE'}
                    </div>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-nsp-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-nsp-input rounded-lg"><Database size={20} className="text-blue-500" /></div>
                        <div>
                            <p className="text-white font-bold text-sm">Mémoire Locale (Cache)</p>
                            <p className="text-xs text-gray-500">Utilisée par les photos HD</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-white font-bold text-sm">{storageUsage.toFixed(2)} MB</p>
                        <p className="text-[10px] text-gray-500">Quota ~5 MB (Soft)</p>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-nsp-input rounded-lg"><Settings size={20} className="text-purple-500" /></div>
                        <div>
                            <p className="text-white font-bold text-sm">Version Application</p>
                            <p className="text-xs text-gray-500">Dernier Build</p>
                        </div>
                    </div>
                    <div className="text-white font-mono text-sm">v2.1.0 (Stable)</div>
                </div>
            </div>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-xl">
            <h4 className="text-yellow-500 font-bold text-sm mb-2 flex items-center gap-2">
                <ShieldAlert size={16} /> Zone de Danger
            </h4>
            <p className="text-xs text-gray-400 mb-4">Actions irréversibles sur la base de données locale.</p>
            <button 
                onClick={() => { if(confirm('Vider toute la base de données ?')) { localStorage.clear(); window.location.reload(); } }}
                className="w-full border border-red-500/50 text-red-500 hover:bg-red-500/10 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
            >
                Formater la Base de Données
            </button>
        </div>
    </div>
  );

  const renderShare = () => {
    const currentUrl = window.location.href;
    
    return (
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="bg-nsp-card border border-nsp-border rounded-xl p-6 text-center shadow-xl">
          <div className="w-16 h-16 bg-nsp-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe size={32} className="text-nsp-primary" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Diffuser AUTOBOOK</h3>
          <p className="text-gray-400 text-sm mb-8">
            Partagez le lien ou le QR Code ci-dessous. Vos utilisateurs n'ont pas besoin d'aller sur l'App Store !
          </p>
          
          {/* SIMULATED QR CODE */}
          <div className="bg-white p-4 rounded-2xl inline-block mb-8 shadow-inner">
             <div className="w-48 h-48 bg-nsp-bg flex items-center justify-center relative overflow-hidden group cursor-pointer" onClick={() => alert("QR Code généré pour : " + currentUrl)}>
                <QrCode size={160} className="text-white" />
                <div className="absolute inset-0 bg-nsp-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-white font-bold text-xs uppercase bg-nsp-primary px-3 py-1 rounded-full">Agrandir</span>
                </div>
                {/* Simulated center logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white p-1 rounded-lg">
                        <div className="bg-nsp-primary text-white text-[8px] font-black px-1">AUTOBOOK</div>
                    </div>
                </div>
             </div>
          </div>

          <div className="bg-nsp-input p-4 rounded-lg border border-nsp-border flex items-center gap-3 mb-8">
             <p className="text-blue-400 font-mono text-sm flex-1 truncate text-left">{currentUrl}</p>
             <button 
               onClick={() => { navigator.clipboard.writeText(currentUrl); alert('Lien copié !'); }}
               className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
             >
               <Copy size={16} />
             </button>
          </div>

          {/* Installation Instructions */}
          <div className="space-y-4 text-left">
             <h4 className="text-white font-bold text-sm flex items-center gap-2 mb-4">
                <Smartphone size={18} className="text-nsp-primary" /> Instructions pour vos utilisateurs :
             </h4>
             
             <div className="grid grid-cols-1 gap-3">
                <div className="bg-black/30 p-4 rounded-xl border border-gray-800 hover:border-nsp-primary transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold">1</div>
                    <h5 className="text-white font-bold text-sm">Sur iPhone (Safari)</h5>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed pl-11">
                    Ouvrez le lien dans Safari, appuyez sur le bouton <strong>Partager</strong> (carré avec flèche) puis choisissez <strong>"Sur l'écran d'accueil"</strong>.
                  </p>
                </div>

                <div className="bg-black/30 p-4 rounded-xl border border-gray-800 hover:border-nsp-primary transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-green-600/20 text-green-500 flex items-center justify-center font-bold">2</div>
                    <h5 className="text-white font-bold text-sm">Sur Android (Chrome)</h5>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed pl-11">
                    Ouvrez le lien dans Chrome. Un bouton <strong>"Installer l'application"</strong> apparaîtra. Sinon, allez dans le menu (3 points) et choisissez "Installer".
                  </p>
                </div>
             </div>

             <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30 flex gap-3 mt-6">
                <Info size={20} className="text-blue-400 shrink-0" />
                <p className="text-[11px] text-blue-200">
                  <strong>CONSEIL PRO :</strong> Pour une diffusion plus large, imprimez le QR Code sur vos factures ou affichez-le dans votre point de vente.
                </p>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="bg-red-950/30 border-b border-red-900/30 p-6 flex justify-between items-center pt-safe-top">
        <div className="flex items-center gap-3">
           <div className="bg-red-600 p-2 rounded-lg"><ShieldAlert className="text-white" size={24} /></div>
           <div>
             <h1 className="text-xl font-bold text-white">PANNEAU ADMIN</h1>
             <p className="text-red-400 text-xs uppercase tracking-wider font-bold">Gestion des clients</p>
           </div>
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-white flex items-center gap-2 bg-black/30 px-4 py-2 rounded-lg hover:bg-red-900/50 transition-colors">
          <LogOut size={16} />
        </button>
      </div>

      <div className="flex border-b border-nsp-border px-4 bg-nsp-card/50 overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab('overview')} className={`py-4 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-nsp-primary text-white' : 'border-transparent text-gray-500'}`}>VUE GLOBALE</button>
        <button onClick={() => setActiveTab('users')} className={`py-4 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'users' ? 'border-nsp-primary text-white' : 'border-transparent text-gray-500'}`}>UTILISATEURS</button>
        <button onClick={() => setActiveTab('alerts')} className={`py-4 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'alerts' ? 'border-nsp-primary text-white' : 'border-transparent text-gray-500'}`}>ALERTES <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-full ml-1">{pendingResets}</span></button>
        <button onClick={() => setActiveTab('system')} className={`py-4 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'system' ? 'border-nsp-primary text-white' : 'border-transparent text-gray-500'}`}>SYSTÈME</button>
        <button onClick={() => setActiveTab('share')} className={`py-4 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'share' ? 'border-nsp-primary text-white' : 'border-transparent text-gray-500'}`}>DIFFUSION 🚀</button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto max-w-5xl mx-auto w-full">
         {activeTab === 'overview' && renderOverview()}
         {activeTab === 'users' && renderUsers()}
         {activeTab === 'alerts' && renderAlerts()}
         {activeTab === 'system' && renderSystem()}
         {activeTab === 'share' && renderShare()}
      </div>
    </div>
  );
};
