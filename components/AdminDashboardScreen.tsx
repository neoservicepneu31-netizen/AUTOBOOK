
import React, { useState, useMemo } from 'react';
import { User, Car, Invoice } from '../types';
import { 
  ShieldAlert, Search, Zap, AlertTriangle, RefreshCw, Key, 
  BarChart3, Activity, TrendingUp, Users, QrCode, Printer, 
  Share2, Globe, CheckCircle2, UserCheck, Car as CarIcon, 
  FileText, Calendar, ChevronRight, X, ArrowLeft
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
  const [activeTab, setActiveTab] = useState<'overview' | 'diffusion' | 'users' | 'alerts'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const appUrl = 'https://autobook-zxwf.vercel.app';
  
  const stats = useMemo(() => {
    const totalUsers = allUsers.length;
    const totalCars = allCars.length;
    const totalRevenue = allInvoices.reduce((acc, inv) => acc + inv.price, 0);
    return { totalUsers, totalCars, totalRevenue };
  }, [allUsers, allCars, allInvoices]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleResetPassword = (user: User) => {
    const newPass = Math.random().toString(36).slice(-6).toUpperCase();
    if (confirm(`Générer un mot de passe temporaire pour ${user.name} ?\nNouveau MDP : ${newPass}`)) {
      onUpdateUser({ ...user, password: newPass, passwordResetRequested: false });
      alert(`Mot de passe mis à jour : ${newPass}`);
    }
  };

  const renderKPI = (label: string, value: string | number, icon: React.ReactNode, color: string) => (
    <div className="bg-nsp-card border border-nsp-border p-5 rounded-2xl relative overflow-hidden shadow-xl">
      <div className={`absolute top-0 right-0 p-4 opacity-10 ${color}`}>{icon}</div>
      <span className="text-gray-500 text-[9px] uppercase font-black tracking-widest block mb-1">{label}</span>
      <div className="text-2xl font-black text-white">{value}</div>
    </div>
  );

  const renderUserDetail = (user: User) => {
    const userCars = allCars.filter(c => c.ownerId === user.id);
    const userInvoices = allInvoices.filter(i => userCars.some(c => c.id === i.carId));

    return (
      <div className="fixed inset-0 z-[100] bg-black animate-fade-in flex flex-col">
        <div className="bg-nsp-card border-b border-nsp-border p-6 flex items-center justify-between pt-safe-top">
          <button onClick={() => setSelectedUser(null)} className="p-2 bg-nsp-input rounded-xl text-white">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-lg font-black text-white uppercase tracking-tighter">Fiche d'Inscription Client</h2>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-2xl mx-auto w-full">
          {/* Header Profil */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 bg-nsp-primary rounded-3xl flex items-center justify-center text-4xl font-black text-white shadow-2xl">
              {user.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase">{user.name}</h3>
              <p className="text-nsp-sub font-mono text-sm">{user.email}</p>
              <div className="flex gap-2 justify-center mt-3">
                <span className={`text-[10px] font-black px-3 py-1 rounded-full ${user.isPremium ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-500'}`}>
                  {user.isPremium ? '💎 PREMIUM' : 'GRATUIT'}
                </span>
                <span className="text-[10px] font-black px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {user.clientType === 'new' ? 'NOUVEAU CLIENT' : 'CLIENT EXISTANT'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Client */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-nsp-card border border-nsp-border p-4 rounded-2xl">
                <p className="text-[9px] text-gray-500 font-black uppercase mb-1">Véhicules</p>
                <p className="text-xl font-black text-white">{userCars.length}</p>
             </div>
             <div className="bg-nsp-card border border-nsp-border p-4 rounded-2xl">
                <p className="text-[9px] text-gray-500 font-black uppercase mb-1">Documents</p>
                <p className="text-xl font-black text-white">{userInvoices.length}</p>
             </div>
          </div>

          {/* Liste Véhicules */}
          <div className="space-y-4">
            <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
              <CarIcon size={14} className="text-nsp-primary" /> Parc Automobile
            </h4>
            {userCars.length === 0 ? (
              <p className="text-gray-600 text-xs italic">Aucun véhicule enregistré pour le moment.</p>
            ) : (
              userCars.map(car => (
                <div key={car.id} className="bg-nsp-input/50 p-4 rounded-2xl border border-nsp-border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-nsp-card rounded-xl flex items-center justify-center text-nsp-primary">
                      <CarIcon size={20} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm uppercase">{car.plate}</p>
                      <p className="text-[10px] text-gray-500">{car.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-nsp-primary font-black uppercase">{car.fuelType}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions de Compte */}
          <div className="space-y-4 pt-4 border-t border-nsp-border">
             <button onClick={() => handleResetPassword(user)} className="w-full bg-nsp-card border border-nsp-border p-4 rounded-2xl text-white font-black text-xs uppercase flex items-center justify-center gap-3">
               <Key size={16} className="text-nsp-primary" /> Réinitialiser le mot de passe
             </button>
             <button onClick={() => { if(confirm('Supprimer définitivement ce client ?')) { onDeleteUser(user.id); setSelectedUser(null); } }} className="w-full bg-red-950/20 border border-red-500/30 p-4 rounded-2xl text-red-500 font-black text-xs uppercase flex items-center justify-center gap-3">
               <AlertTriangle size={16} /> Supprimer le compte client
             </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDiffusion = () => (
    <div className="space-y-8 animate-fade-in flex flex-col items-center print:hidden">
      <div className="text-center space-y-2">
        <div className="bg-nsp-primary/20 text-nsp-primary w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
          <QrCode size={24} />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Recrutement Client</h2>
        <p className="text-nsp-sub text-xs">Faites scanner ce code pour que le client télécharge l'application et s'inscrive.</p>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_0_60px_rgba(230,57,70,0.4)] border-[10px] border-nsp-card">
         <img 
           src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(appUrl)}&color=0-0-0`} 
           alt="QR Code AUTOBOOK Application" 
           className="w-64 h-64"
         />
         <div className="mt-6 text-center">
            <p className="text-black font-black text-lg uppercase tracking-tighter">AUTOBOOK-ZXWF.VERCEL.APP</p>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Scanner pour s'inscrire</p>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
         <button onClick={() => window.print()} className="bg-white text-black p-5 rounded-2xl flex flex-col items-center gap-2 shadow-xl hover:scale-105 transition-transform active:scale-95">
            <Printer size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Affiche Papier</span>
         </button>
         <button 
           onClick={() => {
             if (navigator.share) {
               navigator.share({ title: 'AUTOBOOK', text: 'Installez votre carnet d\'entretien numérique.', url: appUrl });
             } else {
               navigator.clipboard.writeText(appUrl);
               alert("Lien copié !");
             }
           }}
           className="bg-nsp-card border border-nsp-border text-nsp-primary p-5 rounded-2xl flex flex-col items-center gap-2 hover:bg-nsp-input transition-colors active:scale-95"
         >
            <Share2 size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Lien Direct</span>
         </button>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in print:hidden">
      <div className="grid grid-cols-2 gap-4">
        {renderKPI("Clients Actifs", stats.totalUsers, <Users size={24}/>, "text-blue-500")}
        {renderKPI("Total CA Réseau", `${stats.totalRevenue}€`, <TrendingUp size={24}/>, "text-green-500")}
      </div>
      
      <div className="bg-nsp-card border border-nsp-border rounded-3xl p-5">
        <h3 className="text-white font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
          <Activity size={14} className="text-nsp-primary" /> Inscriptions Temps Réel
        </h3>
        <div className="space-y-4">
          {allUsers.slice(-5).reverse().map(u => (
            <div key={u.id} onClick={() => setSelectedUser(u)} className="flex items-center gap-3 border-b border-white/5 pb-3 last:border-0 cursor-pointer hover:bg-white/5 transition-colors p-1 rounded-lg">
               <div className="w-8 h-8 rounded-full bg-nsp-input flex items-center justify-center text-[10px] font-black text-nsp-primary">{u.name.charAt(0)}</div>
               <div className="flex-1">
                 <p className="text-xs text-white font-bold">{u.name}</p>
                 <p className="text-[9px] text-gray-500">{u.email}</p>
               </div>
               <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${u.isPremium ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-800 text-gray-500'}`}>
                 {u.isPremium ? 'PREMIUM' : 'FREE'}
               </span>
               <ChevronRight size={14} className="text-gray-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col font-sans">
      
      {/* Zone Detail User (Modal) */}
      {selectedUser && renderUserDetail(selectedUser)}

      {/* ZONE D'IMPRESSION A4 */}
      <div className="hidden print:flex flex-col items-center justify-between p-20 h-[297mm] w-[210mm] bg-white text-black text-center font-sans">
        <div className="space-y-8">
          <div className="bg-black text-white px-12 py-8 rounded-[2.5rem] inline-block shadow-2xl">
            <h1 className="text-6xl font-black tracking-tighter uppercase">AUTO<span className="text-red-600">BOOK</span></h1>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-widest text-red-600">VOTRE CARNET D'ENTRETIEN NUMÉRIQUE</h2>
        </div>

        <div className="space-y-12 flex flex-col items-center">
          <h3 className="text-5xl font-black uppercase leading-tight">SCANNEZ POUR<br/><span className="text-gray-400">REJOINDRE LE RÉSEAU</span></h3>
          <div className="p-8 border-[14px] border-black rounded-[5rem] shadow-2xl">
             <img 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(appUrl)}&color=0-0-0`} 
               alt="QR Code AUTOBOOK VERCEL" 
               className="w-[12cm] h-[12cm]"
             />
          </div>
          <p className="text-3xl font-black uppercase tracking-tighter text-black mt-4">autobook-zxwf.vercel.app</p>
          <p className="text-xl font-bold uppercase tracking-tighter text-gray-500">Accessible sur iOS & Android • Inscription Gratuite</p>
        </div>

        <div className="w-full flex justify-between items-center border-t-8 border-black pt-16">
           <div className="text-left">
              <p className="text-2xl font-black uppercase">Sécurité Cloud Européenne</p>
              <p className="text-lg text-gray-600">Propulsé par NEO SERVICE PNEU</p>
           </div>
           <p className="text-lg font-bold text-gray-400 italic">Certifié conforme SIV / RGPD</p>
        </div>
      </div>

      {/* DASHBOARD UI */}
      <div className="flex flex-col flex-1 print:hidden">
        {/* Header Admin */}
        <div className="bg-red-950/40 border-b border-red-900/30 p-6 flex justify-between items-center pt-safe-top backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="bg-red-600 p-2.5 rounded-xl"><ShieldAlert className="text-white" size={24} /></div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Console<span className="text-red-600">Global</span></h1>
              <p className="text-red-500 text-[9px] uppercase font-black tracking-widest mt-1">ADMINISTRATION RÉSEAU EUROPE</p>
            </div>
          </div>
          <button onClick={onLogout} className="text-white bg-red-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase">Logout</button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-nsp-border px-4 bg-nsp-card/20 overflow-x-auto no-scrollbar backdrop-blur-sm sticky top-[84px] z-40">
          {[
            { id: 'overview', label: 'Surveillance', icon: <BarChart3 size={14}/> },
            { id: 'diffusion', label: 'Diffusion QR', icon: <QrCode size={14}/> },
            { id: 'users', label: 'Répertoire Clients', icon: <Users size={14}/> },
            { id: 'alerts', label: 'Système', icon: <AlertTriangle size={14}/> }
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

        {/* Content Area */}
        <div className="flex-1 p-6 max-w-4xl mx-auto w-full pb-24">
           {activeTab === 'overview' && renderOverview()}
           {activeTab === 'diffusion' && renderDiffusion()}
           {activeTab === 'users' && (
             <div className="space-y-4 animate-fade-in">
                <div className="flex gap-2">
                  <div className="bg-nsp-input p-3 rounded-2xl flex items-center gap-3 border border-nsp-border flex-1">
                    <Search size={18} className="text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Chercher une inscription (Nom, Email)..." 
                      className="bg-transparent text-white outline-none text-sm font-bold w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button onClick={handleManualRefresh} className={`bg-nsp-card border border-nsp-border p-3 rounded-2xl ${isRefreshing ? 'animate-spin text-nsp-primary' : 'text-white'}`}>
                    <RefreshCw size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allUsers.filter(u => 
                    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    u.email.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map(u => (
                    <div key={u.id} onClick={() => setSelectedUser(u)} className="bg-nsp-card p-4 rounded-2xl border border-nsp-border flex justify-between items-center group shadow-md cursor-pointer hover:border-nsp-primary transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-nsp-input rounded-xl flex items-center justify-center font-black text-nsp-primary">{u.name.charAt(0)}</div>
                        <div>
                          <p className="text-white font-bold text-sm uppercase">{u.name} {u.isPremium && <Zap size={10} className="inline text-yellow-500 fill-yellow-500" />}</p>
                          <p className="text-[10px] text-gray-500 truncate max-w-[120px]">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className={`text-[8px] font-black px-2 py-1 rounded-md ${u.clientType === 'new' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>
                           {u.clientType === 'new' ? 'NOUVEAU' : 'ANCIEN'}
                         </span>
                         <ChevronRight size={14} className="text-gray-700" />
                      </div>
                    </div>
                  ))}
                </div>
             </div>
           )}
           {activeTab === 'alerts' && (
             <div className="bg-red-950/10 border border-red-500/20 p-8 rounded-3xl animate-fade-in text-center">
                <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
                <h3 className="text-white font-black text-lg uppercase mb-2">Surveillance Cloud Européenne</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">La passerelle de synchronisation est active. Tous les terminaux (mobiles, tablettes) en Europe sont connectés au concentrateur AUTOBOOK.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
