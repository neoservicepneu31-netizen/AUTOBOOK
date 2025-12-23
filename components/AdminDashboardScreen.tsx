
import React, { useState, useEffect } from 'react';
import { User, Car, Invoice } from '../types';
import { LogOut, Users, FileText, Car as CarIcon, ShieldAlert, Search, CheckCircle2, Lock, Cpu, Database, Share2, Copy, QrCode, Globe, SmartphoneNfc, Download, ExternalLink, Mail, Zap, AlertTriangle, RefreshCw, Key, UserMinus, Trash2, Eye, EyeOff, UserPlus } from 'lucide-react';

interface AdminDashboardScreenProps {
  currentUser: User;
  allUsers: User[];
  allCars: Car[];
  allInvoices: Invoice[];
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ 
  currentUser, allUsers, allCars, allInvoices, onLogout, onUpdateUser, onDeleteUser 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'alerts' | 'system' | 'share'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  
  const getInitialUrl = () => {
    const origin = window.location.origin;
    return origin.replace(/\/$/, "");
  };

  const [customUrl, setCustomUrl] = useState(getInitialUrl());
  const isVercel = window.location.hostname.includes('vercel.app');

  // Stats
  const pendingResets = allUsers.filter(u => u.passwordResetRequested);
  const totalInvoices = allInvoices.length;

  const togglePassword = (userId: string) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleResetPassword = (user: User) => {
    const newPass = Math.random().toString(36).slice(-6).toUpperCase();
    if (confirm(`Générer un mot de passe temporaire pour ${user.name} ?\nNouveau MDP : ${newPass}`)) {
      onUpdateUser({
        ...user,
        password: newPass,
        passwordResetRequested: false
      });
      alert(`Mot de passe mis à jour. Communiquez ${newPass} au client.`);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-nsp-input p-5 rounded-2xl border border-nsp-border">
          <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest block mb-1">Total Clients</span>
          <div className="text-3xl font-black text-white">{allUsers.length}</div>
        </div>
        <div className="bg-nsp-input p-5 rounded-2xl border border-nsp-border relative overflow-hidden">
          <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest block mb-1">Demandes MDP</span>
          <div className={`text-3xl font-black ${pendingResets.length > 0 ? 'text-red-500' : 'text-white'}`}>
            {pendingResets.length}
          </div>
          {pendingResets.length > 0 && <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-nsp-input p-5 rounded-2xl border border-nsp-border">
          <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest block mb-1">Véhicules</span>
          <div className="text-3xl font-black text-white">{allCars.length}</div>
        </div>
        <div className="bg-nsp-input p-5 rounded-2xl border border-nsp-border">
          <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest block mb-1">Factures</span>
          <div className="text-3xl font-black text-white">{allInvoices.length}</div>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border flex items-center gap-4 ${isVercel ? 'bg-green-600/10 border-green-500/30' : 'bg-orange-600/10 border-orange-500/30'}`}>
          <div className={`p-3 rounded-full ${isVercel ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
            <Zap size={24} />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Service : {isVercel ? 'Production Vercel' : 'Local Host'}</h3>
            <p className="text-xs text-gray-500">{customUrl}</p>
          </div>
      </div>
    </div>
  );

  const renderUsers = () => {
    const filtered = allUsers.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-4 animate-fade-in">
          <div className="bg-nsp-input p-3 rounded-2xl flex items-center gap-3 border border-nsp-border">
              <Search size={20} className="text-gray-500" />
              <input 
                  type="text" 
                  placeholder="Chercher un nom ou email..." 
                  className="bg-transparent text-white outline-none flex-1 text-sm font-bold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          
          <div className="space-y-3">
              {filtered.map(u => {
                const userCars = allCars.filter(c => c.ownerId === u.id);
                const isReset = u.passwordResetRequested;
                
                return (
                  <div key={u.id} className={`bg-nsp-card p-5 rounded-2xl border transition-all ${isReset ? 'border-red-500 bg-red-950/10' : 'border-nsp-border'}`}>
                      <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-nsp-input flex items-center justify-center text-nsp-primary font-black text-xl border border-nsp-border uppercase">
                                  {u.name.charAt(0)}
                              </div>
                              <div>
                                  <div className="flex items-center gap-2">
                                      <h3 className="text-white font-black text-sm uppercase tracking-tight">{u.name}</h3>
                                      {u.clientType === 'existing' && <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-black uppercase">Fidèle</span>}
                                      {u.role === 'admin' && <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black uppercase">Admin</span>}
                                  </div>
                                  <p className="text-[10px] text-nsp-primary font-mono">{u.email}</p>
                              </div>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => handleResetPassword(u)} className={`p-2 rounded-lg transition-colors ${isReset ? 'bg-red-600 text-white animate-pulse' : 'bg-nsp-input text-gray-400'}`} title="Réinitialiser MDP">
                                <Key size={16} />
                             </button>
                             <button onClick={() => { if(confirm(`Supprimer ${u.name} ?`)) onDeleteUser(u.id); }} className="p-2 bg-nsp-input text-gray-600 hover:text-red-500 rounded-lg transition-colors">
                                <UserMinus size={16} />
                             </button>
                          </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5 mb-3">
                          <div className="text-center">
                              <p className="text-[8px] text-gray-500 uppercase font-black">Véhicules</p>
                              <p className="text-xs text-white font-bold">{userCars.length}</p>
                          </div>
                          <div className="text-center">
                              <p className="text-[8px] text-gray-500 uppercase font-black">Factures</p>
                              <p className="text-xs text-white font-bold">{allInvoices.filter(i => userCars.some(c => c.id === i.carId)).length}</p>
                          </div>
                          <div className="text-center">
                              <p className="text-[8px] text-gray-500 uppercase font-black">Statut</p>
                              <p className={`text-[8px] font-black uppercase ${u.isValidated ? 'text-green-500' : 'text-yellow-500'}`}>{u.isValidated ? 'Validé' : 'En attente'}</p>
                          </div>
                      </div>

                      <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                          <div className="flex items-center gap-2">
                              <Lock size={12} className="text-gray-600" />
                              <span className="text-[10px] text-gray-400 font-mono tracking-tighter">
                                  {showPasswords[u.id] ? u.password : '••••••••'}
                              </span>
                          </div>
                          <button onClick={() => togglePassword(u.id)} className="text-gray-600 hover:text-white">
                              {showPasswords[u.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                      </div>
                  </div>
                );
              })}
          </div>
      </div>
    );
  };

  const renderAlerts = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-red-900/10 border border-red-500/20 p-5 rounded-3xl">
            <h3 className="text-white font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" /> Requêtes Prioritaires ({pendingResets.length})
            </h3>
            {pendingResets.length === 0 ? (
                <p className="text-gray-500 text-xs italic text-center py-4">Aucune demande de réinitialisation en attente.</p>
            ) : (
                <div className="space-y-3">
                    {pendingResets.map(u => (
                        <div key={u.id} className="bg-nsp-card p-4 rounded-2xl border border-red-500/30 flex justify-between items-center">
                            <div>
                                <p className="text-white font-bold text-sm">{u.name}</p>
                                <p className="text-[10px] text-red-400 font-mono">{u.email}</p>
                            </div>
                            <button onClick={() => handleResetPassword(u)} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Générer Code</button>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="bg-nsp-card border border-nsp-border p-5 rounded-3xl">
            <h3 className="text-white font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <UserPlus size={16} className="text-blue-500" /> Nouveaux Inscrits (24h)
            </h3>
            <p className="text-gray-500 text-xs italic text-center py-4">Simulation : Pas de nouveaux inscrits aujourd'hui.</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col">
      {/* Header Admin */}
      <div className="bg-red-950/40 border-b border-red-900/30 p-6 flex justify-between items-center pt-safe-top backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
           <div className="bg-red-600 p-2.5 rounded-xl shadow-lg shadow-red-900/40"><ShieldAlert className="text-white" size={24} /></div>
           <div>
             <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Console<span className="text-red-600">Admin</span></h1>
             <p className="text-red-500 text-[9px] uppercase font-black tracking-[0.3em] mt-1">NSP Toulouse Garage</p>
           </div>
        </div>
        <button onClick={onLogout} className="text-white bg-red-600 px-5 py-2.5 rounded-xl font-black text-[10px] tracking-widest hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20">LOGOUT</button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-nsp-border px-4 bg-nsp-card/20 overflow-x-auto no-scrollbar backdrop-blur-sm sticky top-[84px] z-40">
        <button onClick={() => setActiveTab('overview')} className={`py-4 px-6 text-[10px] font-black border-b-2 transition-all uppercase tracking-[0.2em] flex items-center gap-2 ${activeTab === 'overview' ? 'border-nsp-primary text-white' : 'border-transparent text-gray-600'}`}>
            Tableau
        </button>
        <button onClick={() => setActiveTab('users')} className={`py-4 px-6 text-[10px] font-black border-b-2 transition-all uppercase tracking-[0.2em] flex items-center gap-2 ${activeTab === 'users' ? 'border-nsp-primary text-white' : 'border-transparent text-gray-600'}`}>
            Clients ({allUsers.length})
        </button>
        <button onClick={() => setActiveTab('alerts')} className={`py-4 px-6 text-[10px] font-black border-b-2 transition-all uppercase tracking-[0.2em] flex items-center gap-2 ${activeTab === 'alerts' ? 'border-nsp-primary text-white' : 'border-transparent text-gray-600'}`}>
            Requêtes {pendingResets.length > 0 && <span className="w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[8px]">{pendingResets.length}</span>}
        </button>
        <button onClick={() => setActiveTab('share')} className={`py-4 px-6 text-[10px] font-black border-b-2 transition-all uppercase tracking-[0.2em] flex items-center gap-2 ${activeTab === 'share' ? 'border-nsp-primary text-white' : 'border-transparent text-gray-600'}`}>
            Diffusion
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full pb-20">
         {activeTab === 'overview' && renderOverview()}
         {activeTab === 'users' && renderUsers()}
         {activeTab === 'alerts' && renderAlerts()}
         {activeTab === 'share' && (
           <div className="animate-fade-in space-y-6">
              <div className="bg-nsp-card border border-nsp-border rounded-3xl p-8 flex flex-col items-center shadow-2xl">
                 <h3 className="text-xl font-black text-white uppercase mb-6 tracking-tight">QR Code Garage</h3>
                 <div className="bg-white p-4 rounded-3xl shadow-2xl mb-8">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(customUrl)}&margin=10&ecc=H`} alt="QR" className="w-64 h-64" />
                 </div>
                 <div className="flex gap-4 w-full">
                    <button onClick={() => { navigator.clipboard.writeText(customUrl); alert('Lien copié !'); }} className="flex-1 bg-nsp-input text-white text-[10px] font-black py-4 rounded-2xl border border-nsp-border flex items-center justify-center gap-2">
                       <Copy size={14} /> Copier URL
                    </button>
                    <button onClick={() => window.open(customUrl, '_blank')} className="flex-1 bg-nsp-primary text-white text-[10px] font-black py-4 rounded-2xl flex items-center justify-center gap-2">
                       <ExternalLink size={14} /> Tester
                    </button>
                 </div>
              </div>
           </div>
         )}
         
         {activeTab === 'system' && (
           <div className="bg-red-600/10 border border-red-500/20 p-6 rounded-2xl">
              <h4 className="text-red-500 font-black text-xs uppercase mb-3 tracking-widest">Maintenance Base de Données</h4>
              <button onClick={() => { if(confirm('⚠️ EFFACER TOUT ?')) { localStorage.clear(); window.location.reload(); } }} className="w-full bg-red-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Réinitialiser Serveur Local</button>
           </div>
         )}
      </div>
    </div>
  );
};
