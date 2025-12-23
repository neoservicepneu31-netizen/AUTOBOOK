
import React, { useState, useEffect } from 'react';
import { User, Car, Invoice } from '../types';
import { LogOut, Users, FileText, Car as CarIcon, ShieldAlert, Search, CheckCircle2, Lock, Cpu, Database, Share2, Copy, QrCode, Globe, SmartphoneNfc, Download, ExternalLink, Mail, Zap, AlertTriangle, RefreshCw } from 'lucide-react';

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
  
  // LOGIQUE DE DÉTECTION D'URL POUR VERCEL
  const getInitialUrl = () => {
    const origin = window.location.origin;
    // Sur Vercel, on veut l'URL propre sans le /admin ou autres
    return origin.replace(/\/$/, "");
  };

  const [customUrl, setCustomUrl] = useState(getInitialUrl());
  const isVercel = window.location.hostname.includes('vercel.app');

  // System Stats
  const [storageUsage, setStorageUsage] = useState(0);

  useEffect(() => {
    if (activeTab === 'system') {
        try {
            let total = 0;
            const keys = Object.keys(localStorage);
            for (const key of keys) {
                const value = localStorage.getItem(key);
                if (value) total += ((value.length + key.length) * 2);
            }
            setStorageUsage(total / 1024 / 1024);
        } catch (e) { setStorageUsage(0); }
    }
  }, [activeTab]);

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-nsp-input p-5 rounded-2xl border border-nsp-border">
          <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest block mb-1">Total Clients</span>
          <div className="text-3xl font-black text-white">{allUsers.length}</div>
        </div>
        <div className="bg-nsp-input p-5 rounded-2xl border border-nsp-border">
          <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest block mb-1">Documents Archivés</span>
          <div className="text-3xl font-black text-white">{allInvoices.length}</div>
        </div>
      </div>
      
      <div className={`p-6 rounded-2xl border flex items-center gap-4 ${isVercel ? 'bg-green-600/10 border-green-500/30' : 'bg-orange-600/10 border-orange-500/30'}`}>
          <div className={`p-3 rounded-full ${isVercel ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
            <Zap size={24} />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Hébergement : {isVercel ? 'Vercel Production 🚀' : 'Mode Local 🛠️'}</h3>
            <p className="text-xs text-gray-500">
                {isVercel ? 'L\'application est à jour et en ligne.' : 'Déploiement requis pour diffusion client.'}
            </p>
          </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4 animate-fade-in">
        <div className="bg-nsp-input p-3 rounded-2xl flex items-center gap-3 border border-nsp-border">
            <Search size={20} className="text-gray-500" />
            <input 
                type="text" 
                placeholder="Filtrer les clients..." 
                className="bg-transparent text-white outline-none flex-1 text-sm font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="space-y-2">
            {allUsers.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                <div key={u.id} className="bg-nsp-card p-4 rounded-xl border border-nsp-border flex justify-between items-center group hover:border-nsp-primary transition-all">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-nsp-input flex items-center justify-center text-nsp-primary font-black border border-nsp-border group-hover:bg-nsp-primary group-hover:text-white transition-colors">{u.name.charAt(0)}</div>
                        <div>
                            <div className="text-white font-bold text-sm uppercase">{u.name}</div>
                            <div className="text-[10px] text-nsp-primary font-mono">{u.email}</div>
                        </div>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(u.email); alert('Email copié !'); }} className="p-2 text-gray-500 hover:text-white"><Copy size={16}/></button>
                </div>
            ))}
        </div>
    </div>
  );

  const renderShare = () => {
    // QR Code PROPRE (Pas de logo au centre car ça bloque le scan sur Vercel si l'URL est longue)
    // On utilise l'API Google Charts pour plus de stabilité si besoin, ou QRServer (ici conservé car rapide)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(customUrl)}&margin=10&ecc=H`;
    
    return (
      <div className="space-y-8 animate-fade-in pb-16">
        <div className="text-center">
           <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Diffusion Client 🚀</h3>
           <p className="text-gray-500 text-xs mt-2">Générez le code d'accès pour vos affiches de garage.</p>
        </div>

        {/* Configuration de l'URL */}
        <div className="bg-nsp-card border border-nsp-border rounded-3xl p-6 space-y-5">
           <div className="flex items-center justify-between">
              <h4 className="text-white font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                 <Globe size={14} className="text-blue-500" /> URL de Destination
              </h4>
              <button 
                onClick={() => setCustomUrl(getInitialUrl())}
                className="text-[9px] bg-nsp-input hover:text-white text-gray-500 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-nsp-border flex items-center gap-1"
              >
                <RefreshCw size={10} /> Reset Auto
              </button>
           </div>
           
           <div className="space-y-3">
              <div className="bg-nsp-input p-1 rounded-2xl border border-nsp-border focus-within:border-nsp-primary flex items-center gap-2">
                 <input 
                    type="text" 
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1 bg-transparent px-4 py-3 text-white text-xs font-mono outline-none"
                    placeholder="https://votre-garage.vercel.app"
                 />
                 <button onClick={() => { navigator.clipboard.writeText(customUrl); alert('Lien copié !'); }} className="p-3 text-gray-400 hover:text-white">
                    <Copy size={18} />
                 </button>
              </div>

              <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-2xl flex gap-3">
                 <AlertTriangle size={18} className="text-blue-400 shrink-0" />
                 <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed">
                    <span className="text-blue-400">NOTE VERCEL :</span> Le QR Code pointe sur l'adresse ci-dessus. 
                    Si vous changez de domaine (ex: .com), revenez ici mettre à jour l'URL avant d'imprimer.
                 </p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
           {/* Zone QR Code */}
           <div className="bg-nsp-card border border-nsp-border rounded-[2.5rem] p-8 flex flex-col items-center shadow-2xl relative overflow-hidden group">
              <div className="bg-white p-4 rounded-3xl shadow-2xl mb-8 border-[8px] border-white transition-transform group-hover:scale-105 duration-500">
                 <img 
                   src={qrUrl} 
                   alt="QR Code" 
                   className="w-64 h-64 block"
                   key={customUrl} 
                 />
              </div>

              <div className="w-full flex gap-3">
                 <button 
                    onClick={() => window.open(qrUrl, '_blank')}
                    className="flex-1 bg-nsp-input text-white text-[10px] font-black py-4 rounded-2xl uppercase tracking-widest border border-nsp-border hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
                 >
                    <Download size={14} /> Télécharger
                 </button>
                 <button 
                    onClick={() => window.open(customUrl, '_blank')}
                    className="flex-1 bg-nsp-primary text-white text-[10px] font-black py-4 rounded-2xl uppercase tracking-widest shadow-xl shadow-red-900/30 flex items-center justify-center gap-2"
                 >
                    <ExternalLink size={14} /> Tester
                 </button>
              </div>
           </div>

           {/* Aide à l'installation */}
           <div className="space-y-4">
              <h4 className="text-white font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                 <SmartphoneNfc size={16} className="text-nsp-primary" /> Guide de Diffusion
              </h4>
              <div className="bg-nsp-card border border-nsp-border p-5 rounded-2xl flex gap-4 items-center">
                 <div className="w-10 h-10 rounded-full bg-nsp-primary/10 text-nsp-primary flex items-center justify-center font-black text-xs shrink-0">1</div>
                 <p className="text-[11px] text-gray-300 font-bold uppercase leading-tight">Imprimez ce QR Code sur vos factures ou vos affiches.</p>
              </div>
              <div className="bg-nsp-card border border-nsp-border p-5 rounded-2xl flex gap-4 items-center">
                 <div className="w-10 h-10 rounded-full bg-nsp-primary/10 text-nsp-primary flex items-center justify-center font-black text-xs shrink-0">2</div>
                 <p className="text-[11px] text-gray-300 font-bold uppercase leading-tight">Le client scanne avec son téléphone pour ouvrir AUTOBOOK.</p>
              </div>
              <div className="bg-nsp-card border border-nsp-border p-5 rounded-2xl flex gap-4 items-center">
                 <div className="w-10 h-10 rounded-full bg-nsp-primary/10 text-nsp-primary flex items-center justify-center font-black text-xs shrink-0">3</div>
                 <p className="text-[11px] text-gray-300 font-bold uppercase leading-tight">Il clique sur "Installer" pour ajouter l'icône sur son bureau.</p>
              </div>
              
              <div className="bg-gradient-to-br from-red-900/40 to-black p-6 rounded-[2rem] border border-red-500/20 mt-4">
                 <h5 className="text-nsp-primary font-black text-[10px] uppercase tracking-widest mb-2">Impact Client</h5>
                 <p className="text-[10px] text-gray-400 leading-relaxed italic">
                   "Le carnet numérique remplace le papier. Le client garde votre garage en poche 24h/24."
                 </p>
              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col">
      <div className="bg-red-950/40 border-b border-red-900/30 p-6 flex justify-between items-center pt-safe-top backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
           <div className="bg-red-600 p-2.5 rounded-xl shadow-lg shadow-red-900/40"><ShieldAlert className="text-white" size={24} /></div>
           <div>
             <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Console<span className="text-red-600">Admin</span></h1>
             <p className="text-red-500 text-[9px] uppercase font-black tracking-[0.3em] mt-1">Gérance NSP Toulouse</p>
           </div>
        </div>
        <button onClick={onLogout} className="text-white bg-red-600 px-5 py-2.5 rounded-xl font-black text-[10px] tracking-widest hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20">DÉCONNEXION</button>
      </div>

      <div className="flex border-b border-nsp-border px-4 bg-nsp-card/20 overflow-x-auto no-scrollbar backdrop-blur-sm sticky top-[84px] z-40">
        <button onClick={() => setActiveTab('overview')} className={`py-4 px-6 text-[10px] font-black border-b-2 transition-all uppercase tracking-[0.2em] ${activeTab === 'overview' ? 'border-nsp-primary text-white' : 'border-transparent text-gray-600'}`}>Tableau</button>
        <button onClick={() => setActiveTab('users')} className={`py-4 px-6 text-[10px] font-black border-b-2 transition-all uppercase tracking-[0.2em] ${activeTab === 'users' ? 'border-nsp-primary text-white' : 'border-transparent text-gray-600'}`}>Utilisateurs</button>
        <button onClick={() => setActiveTab('share')} className={`py-4 px-6 text-[10px] font-black border-b-2 transition-all uppercase tracking-[0.2em] ${activeTab === 'share' ? 'border-nsp-primary text-white' : 'border-transparent text-gray-600'}`}>Diffuser QR</button>
        <button onClick={() => setActiveTab('system')} className={`py-4 px-6 text-[10px] font-black border-b-2 transition-all uppercase tracking-[0.2em] ${activeTab === 'system' ? 'border-nsp-primary text-white' : 'border-transparent text-gray-600'}`}>Maintenance</button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full">
         {activeTab === 'overview' && renderOverview()}
         {activeTab === 'users' && renderUsers()}
         {activeTab === 'system' && (
             <div className="space-y-6">
                 <div className="bg-nsp-card border border-nsp-border rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Database size={18} className="text-blue-500" /> Stockage Navigateur</h3>
                    <p className="text-3xl font-black text-white">{storageUsage.toFixed(2)} MB</p>
                    <p className="text-[10px] text-gray-500 uppercase mt-2 tracking-widest">Utilisation locale des données (Photos/Inscriptions)</p>
                 </div>
                 <div className="bg-red-600/10 border border-red-500/20 p-6 rounded-2xl">
                    <h4 className="text-red-500 font-black text-xs uppercase mb-3 tracking-widest">Zone de danger</h4>
                    <p className="text-xs text-gray-400 mb-4">La suppression des données est irréversible et effacera tous les clients enregistrés sur cet appareil.</p>
                    <button onClick={() => { if(confirm('⚠️ ATTENTION : Effacer TOUS les clients ?')) { localStorage.clear(); window.location.reload(); } }} className="w-full bg-red-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all">
                        Réinitialiser la base de données
                    </button>
                 </div>
             </div>
         )}
         {activeTab === 'share' && renderShare()}
      </div>
    </div>
  );
};
