
import React, { useState, useMemo, useEffect } from 'react';
import { User, Car, Invoice } from '../types';
import { cloud } from '../services/cloudService';
import { db } from '../services/storageService';
import { emailService } from '../services/emailService';
import { safeBase64ToBlobUrl, base64ToRealBlobUrl } from '../services/geminiService';
import { 
  BarChart3, Users, QrCode, Globe, AlertCircle, 
  Loader2, Copy, Check, ShieldAlert, ChevronRight, HardDrive, 
  ArrowRight, Search, Info, X, Mail, Eye, LogOut, History,
  ShieldCheck, ShieldX, SearchCode, CloudUpload, Terminal,
  LifeBuoy, Send, BellRing, ExternalLink, UserPlus, MailCheck,
  KeyRound, AlertTriangle, Trash2
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
  onNotify: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ 
  currentUser, allUsers, allCars, allInvoices, onLogout, onUpdateUser, onDeleteUser, onRefresh, onNotify
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'diffusion' | 'users' | 'requests' | 'setup'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [cloudStatus, setCloudStatus] = useState<'online' | 'syncing' | 'warning' | 'error'>('online');
  const [isEmergencyAction, setIsEmergencyAction] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{success: boolean, message: string, code?: string} | null>(null);
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [customDomain, setCustomDomain] = useState('autobook-zxwf.vercel.app');
  const [isSendingMails, setIsSendingMails] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState<{ isOpen: boolean; user: User | null }>({ isOpen: false, user: null });
  const [deleteUserConfirmation, setDeleteUserConfirmation] = useState<{ isOpen: boolean; userId: string | null }>({ isOpen: false, userId: null });
  const [infoRequests, setInfoRequests] = useState([
    { id: '1', userName: 'Jean Dupont', email: 'jean@dupont.fr', subject: 'Question sur l\'assistance', date: new Date().toISOString() },
    { id: '2', userName: 'Marie Curie', email: 'marie@curie.fr', subject: 'Problème de connexion', date: new Date(Date.now() - 3600000).toISOString() }
  ]);
  
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

  const handleInvitationMail = async (user: User) => {
    setIsSendingMails(true);
    try {
      await emailService.send({
        to: user.email,
        subject: "Bienvenue sur AutoBook - Activez votre carnet de santé",
        text: `Bonjour ${user.name},\n\nBienvenue sur AutoBook ! Scannez votre carte grise pour activer votre carnet de santé numérique et suivre l'entretien de votre véhicule.\n\nL'équipe AutoBook`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #E63946;">Bienvenue sur AutoBook !</h2>
            <p>Bonjour <strong>${user.name}</strong>,</p>
            <p>Votre compte est prêt. Scannez votre carte grise dès maintenant pour activer votre carnet de santé numérique et suivre l'entretien de votre véhicule en toute simplicité.</p>
            <div style="margin: 30px 0;">
              <a href="${publicUrl}" style="background-color: #E63946; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Accéder à mon Garage</a>
            </div>
            <p>L'équipe AutoBook</p>
          </div>
        `
      });
      onNotify('success', 'Email', `✅ Mail d'invitation envoyé avec succès à ${user.name}.`);
    } catch (error: any) {
      console.error("Email error:", error);
      onNotify('error', 'Erreur Email', `❌ Erreur lors de l'envoi du mail : ${error.message}\n\nNote: Vérifiez que RESEND_API_KEY est bien configurée.`);
    } finally {
      setIsSendingMails(false);
    }
  };

  const handleResetPassword = async (user: User) => {
    setIsSendingMails(true);
    
    try {
      await cloud.resetPassword(user.email);
      
      const updatedUser = { 
        ...user, 
        passwordResetRequested: false 
      };
      
      onUpdateUser(updatedUser);
      onNotify('success', 'Mot de passe', `✅ Un lien de réinitialisation a été envoyé à ${user.email}.`);
    } catch (error: any) {
      console.error("Reset Password error:", error);
      onNotify('error', 'Erreur', `❌ Erreur lors de l'envoi du lien : ${error.message}`);
    } finally {
      setIsSendingMails(false);
    }
  };

  const handleResetAccount = async (user: User) => {
    setResetConfirmation({ isOpen: true, user });
  };

  const confirmResetAccount = async () => {
    const user = resetConfirmation.user;
    if (!user) return;
    
    setResetConfirmation({ isOpen: false, user: null });
    setIsSendingMails(true);
    try {
      // Suppression de toutes les voitures et factures associées
      const userCars = allCars.filter(c => c.ownerId === user.id);
      for (const car of userCars) {
        const carInvoices = allInvoices.filter(i => i.carId === car.id);
        for (const inv of carInvoices) {
          if (cloud.isConnected()) await cloud.deleteInvoice(inv.id);
        }
        if (cloud.isConnected()) await cloud.deleteCar(car.id);
      }
      
      // Mise à jour locale (App.tsx s'en chargera via onRefresh ou le rechargement des données)
      onNotify('success', 'Réinitialisation', `✅ Compte de ${user.name} réinitialisé avec succès (Garages et factures vidés).`);
      onRefresh();
    } catch (e) {
      console.error("Reset account error", e);
      onNotify('error', 'Erreur', "Erreur lors de la réinitialisation du compte.");
    } finally {
      setIsSendingMails(false);
    }
  };

  const handleSendMessage = async (user: User) => {
    if (!messageText.trim()) return;

    setIsSendingMails(true);
    try {
      await emailService.send({
        to: user.email,
        subject: "Message de l'administrateur AutoBook",
        text: messageText,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; border-left: 4px solid #E63946;">
            <p>Bonjour <strong>${user.name}</strong>,</p>
            <p>Vous avez reçu un nouveau message de l'équipe AutoBook :</p>
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 12px; font-style: italic; margin: 20px 0; white-space: pre-wrap;">
              ${messageText}
            </div>
            <p>L'équipe AutoBook</p>
          </div>
        `
      });
      onNotify('success', 'Message', `✅ Message envoyé avec succès à ${user.email}.`);
      setMessageText('');
      setIsMessageModalOpen(false);
    } catch (error: any) {
      console.error("Email error:", error);
      onNotify('error', 'Erreur', `❌ Erreur lors de l'envoi du message : ${error.message}`);
    } finally {
      setIsSendingMails(false);
    }
  };

  const stats = useMemo(() => {
    const realUsers = allUsers.filter(u => u.role !== 'admin');
    const inactiveCount = realUsers.filter(u => allCars.filter(c => c.ownerId === u.id).length === 0).length;
    const resetRequests = realUsers.filter(u => u.passwordResetRequested).length;
    
    // Détection des nouveaux (inscrits il y a moins de 48h)
    const fortyEightHoursAgo = Date.now() - (48 * 60 * 60 * 1000);
    const newSignups = realUsers.filter(u => u.createdAt && new Date(u.createdAt).getTime() > fortyEightHoursAgo).length;

    return { 
      totalUsers: realUsers.length, 
      totalCars: allCars.length,
      inactiveUsers: inactiveCount,
      newSignups,
      resetRequests
    };
  }, [allUsers, allCars]);

  const filteredUsers = useMemo(() => {
    return allUsers
      .filter(u => u.role !== 'admin')
      .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        // Trier par date de création (du plus récent au plus ancien)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [allUsers, searchTerm]);

  const isNew = (user: User) => {
    if (!user.createdAt) return false;
    const fortyEightHoursAgo = Date.now() - (48 * 60 * 60 * 1000);
    return new Date(user.createdAt).getTime() > fortyEightHoursAgo;
  };

  const handleRunDiagnostic = async () => {
    setIsTestingCloud(true);
    setDiagnosticResult(null);
    try {
      const result = await cloud.testConnectionDiagnostic();
      setDiagnosticResult(result);
    } catch (e: any) {
      setDiagnosticResult({ success: false, message: e.message || "Erreur critique" });
    } finally {
      setIsTestingCloud(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col font-sans">
      {isSendingMails && (
        <div className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
           <div className="bg-nsp-card p-10 rounded-[3rem] border border-nsp-primary/30 flex flex-col items-center gap-6 shadow-2xl">
              <MailCheck size={48} className="text-nsp-primary animate-bounce" />
              <p className="text-white font-black text-xs uppercase tracking-widest">Envoi de l'invitation...</p>
           </div>
        </div>
      )}

      <div className="bg-red-950/40 border-b border-red-900/30 p-6 flex justify-between items-center pt-safe-top backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 p-2.5 rounded-xl"><ShieldAlert className="text-white" size={24} /></div>
          <div>
            <h1 className="text-xl font-black text-white uppercase leading-none">Console<span className="text-red-600">Pro</span></h1>
            <p className="text-green-500 text-[8px] uppercase font-black tracking-widest mt-1">Surveillance en temps réel</p>
          </div>
        </div>
        <button onClick={onLogout} className="text-white bg-red-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg">
          Déconnexion
        </button>
      </div>

      <div className="flex border-b border-nsp-border px-4 bg-nsp-card/20 overflow-x-auto no-scrollbar backdrop-blur-sm sticky top-[84px] z-40">
        {[
          { id: 'overview', label: 'Surveillance', icon: <BarChart3 size={14}/> },
          { id: 'users', label: 'Clients', icon: <Users size={14}/> },
          { id: 'requests', label: 'Demandes', icon: <Mail size={14}/> },
          { id: 'diffusion', label: 'Diffusion', icon: <QrCode size={14}/> },
          { id: 'setup', label: 'Maintenance', icon: <LifeBuoy size={14}/> }
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
                <div className="bg-nsp-card border border-nsp-border p-5 rounded-2xl relative overflow-hidden">
                   <span className="text-gray-500 text-[9px] uppercase font-black mb-1 block">Total Clients</span>
                   <div className="text-2xl font-black text-white">{stats.totalUsers}</div>
                </div>
                <div className="bg-nsp-card border border-nsp-border p-5 rounded-2xl border-nsp-primary/30">
                   <span className="text-nsp-primary text-[9px] uppercase font-black mb-1 block">Nouveaux (48h)</span>
                   <div className="text-2xl font-black text-white">{stats.newSignups}</div>
                   <div className="absolute top-2 right-2"><UserPlus size={12} className="text-nsp-primary" /></div>
                </div>
                <div className="bg-nsp-card border border-nsp-border p-5 rounded-2xl border-orange-500/30">
                   <span className="text-orange-500 text-[9px] uppercase font-black mb-1 block">Mots de passe</span>
                   <div className="text-2xl font-black text-white">{stats.resetRequests}</div>
                   <div className="absolute top-2 right-2"><KeyRound size={12} className="text-orange-500" /></div>
                </div>
                <div className="bg-nsp-card border border-nsp-border p-5 rounded-2xl border-red-500/20">
                   <span className="text-red-500 text-[9px] uppercase font-black mb-1 block">Garages Vides</span>
                   <div className="text-2xl font-black text-white">{stats.inactiveUsers}</div>
                </div>
              </div>

              {stats.resetRequests > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl animate-pulse">
                  <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle size={14} /> {stats.resetRequests} Demande(s) de réinitialisation en attente
                  </p>
                </div>
              )}

              <div className="bg-nsp-card border border-nsp-border rounded-3xl p-6">
                <h3 className="text-white font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2"><UserPlus size={14} className="text-nsp-primary" /> Dernières Inscriptions</h3>
                <div className="space-y-3">
                  {allUsers.filter(u => u.role !== 'admin').sort((a,b) => (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())).slice(0, 5).map(u => (
                    <div key={u.id} className="flex items-center gap-4 p-4 bg-nsp-input/30 rounded-xl border border-white/5 group">
                       <div className="w-10 h-10 rounded-lg bg-nsp-input flex items-center justify-center text-sm font-black text-nsp-primary">{u.name.charAt(0)}</div>
                       <div className="flex-1">
                          <p className="text-[10px] text-white font-bold uppercase flex items-center gap-2">
                            {u.name}
                            {isNew(u) && <span className="text-[7px] bg-nsp-primary text-white px-1.5 py-0.5 rounded-full">NOUVEAU</span>}
                          </p>
                          <p className="text-[8px] text-gray-500 font-bold uppercase mt-0.5">{u.email}</p>
                       </div>
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         {u.passwordResetRequested && (
                           <button onClick={() => handleResetPassword(u)} className="p-2 bg-orange-500/10 text-orange-500 rounded-lg" title="Réinitialiser le mot de passe"><KeyRound size={16} /></button>
                         )}
                         <button onClick={() => handleInvitationMail(u)} className="p-2 bg-nsp-primary/10 text-nsp-primary rounded-lg" title="Inviter à remplir le garage"><Mail size={16} /></button>
                         <button onClick={() => setSelectedUser(u)} className="p-2 bg-nsp-input text-white rounded-lg"><Eye size={16}/></button>
                       </div>
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
                <input type="text" placeholder="Chercher un client (Nom ou Email)..." className="bg-transparent text-white outline-none text-sm font-bold w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {filteredUsers.map(u => {
                  const hasCar = allCars.some(c => c.ownerId === u.id);
                  const newUser = isNew(u);
                  return (
                    <div key={u.id} className={`bg-nsp-card p-4 rounded-2xl border transition-all flex justify-between items-center group ${newUser ? 'border-nsp-primary/40' : 'border-nsp-border'}`}>
                      <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedUser(u)}>
                        <div className="w-10 h-10 bg-nsp-input rounded-xl flex items-center justify-center font-black text-nsp-primary">{u.name.charAt(0)}</div>
                        <div>
                          <p className="text-white font-bold text-xs uppercase flex items-center gap-2">
                            {u.name}
                            {newUser && <span className="text-[7px] bg-nsp-primary text-white px-1.5 py-0.5 rounded-full font-black">NOUVEAU</span>}
                            {!hasCar && <span className="text-[7px] bg-red-600/20 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded-full font-black">GARAGE VIDE</span>}
                          </p>
                          <p className="text-[9px] text-gray-500">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!hasCar && (
                           <button onClick={() => handleInvitationMail(u)} className="p-2.5 bg-nsp-primary/10 text-nsp-primary rounded-lg hover:bg-nsp-primary hover:text-white transition-all">
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

         {activeTab === 'requests' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-white font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2"><Mail size={14} className="text-nsp-primary" /> Demandes d'informations</h3>
              {infoRequests.length === 0 ? (
                <div className="bg-nsp-card border border-nsp-border p-10 rounded-3xl text-center">
                  <Mail size={32} className="text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 text-[10px] font-black uppercase">Aucune demande en attente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {infoRequests.map(req => (
                    <div key={req.id} className="bg-nsp-card border border-nsp-border p-5 rounded-2xl flex justify-between items-center group">
                      <div>
                        <p className="text-white font-black text-[10px] uppercase">{req.subject}</p>
                        <p className="text-gray-500 text-[8px] font-bold uppercase mt-1">{req.userName} • {req.email}</p>
                        <p className="text-nsp-primary text-[7px] font-bold uppercase mt-2">{new Date(req.date).toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => {
                          const u = allUsers.find(u => u.email === req.email);
                          if (u) {
                            setSelectedUser(u);
                            setActiveTab('users');
                          } else {
                            onNotify('error', 'Erreur', "Client non trouvé dans la base.");
                          }
                        }}
                        className="p-3 bg-nsp-primary/10 text-nsp-primary rounded-xl hover:bg-nsp-primary hover:text-white transition-all"
                      >
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                    <img src={qrCodeUrl} alt="QR Code Diffusion" className="w-48 h-48" referrerPolicy="no-referrer" />
                 </div>

                 <div className="w-full space-y-4">
                    <div className="bg-nsp-input p-4 rounded-2xl flex items-center gap-4 border border-white/5">
                       <Globe className="text-nsp-primary shrink-0" size={20} />
                       <p className="text-white text-[10px] font-bold truncate flex-1 text-left">{publicUrl}</p>
                       <button onClick={handleCopyLink} className="p-2.5 bg-nsp-primary rounded-xl text-white shadow-lg">
                          {copySuccess ? <Check size={16}/> : <Copy size={16}/>}
                       </button>
                    </div>
                 </div>
              </div>
           </div>
         )}

         {activeTab === 'setup' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-black border border-white/10 rounded-[2rem] p-6 shadow-2xl relative">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><Terminal size={16} className="text-green-500" /> Terminal Cloud</h3>
                 </div>
                 <div className="space-y-3">
                   <button onClick={() => onRefresh()} className="w-full bg-nsp-input border border-white/10 text-white py-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2"><CloudUpload size={16}/> Actualiser la base</button>
                   <button 
                     onClick={handleRunDiagnostic} 
                     disabled={isTestingCloud}
                     className="w-full bg-nsp-input border border-white/10 text-white py-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 disabled:opacity-50"
                   >
                     {isTestingCloud ? <Loader2 size={16} className="animate-spin" /> : <SearchCode size={16}/>} 
                     Tester la connexion Cloud
                   </button>
                   <button 
                     onClick={async () => {
                       try {
                         const res = await fetch('/api/health');
                         const data = await res.json();
                         onNotify('info', 'API Health', `API Health: ${JSON.stringify(data)}`);
                       } catch (e: any) {
                         onNotify('error', 'API Health Error', `API Health Error: ${e.message}`);
                       }
                     }}
                     className="w-full bg-nsp-input border border-white/10 text-white py-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2"
                   >
                     <ShieldCheck size={16}/> Tester l'API (Health)
                   </button>
                   {diagnosticResult && (
                     <div className={`mt-4 p-4 rounded-xl border text-[10px] font-bold uppercase tracking-wider ${diagnosticResult.success ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                       <div className="flex items-center gap-2 mb-2">
                         {diagnosticResult.success ? <ShieldCheck size={14} /> : <ShieldX size={14} />}
                         {diagnosticResult.success ? 'Diagnostic Positif' : 'Diagnostic Négatif'}
                       </div>
                       <p className="opacity-80">{diagnosticResult.message}</p>
                       {diagnosticResult.code && <p className="mt-1 text-[8px] opacity-60">Code d'erreur: {diagnosticResult.code}</p>}
                     </div>
                   )}
                 </div>
              </div>
            </div>
         )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-[100] bg-black/98 flex flex-col animate-fade-in overflow-y-auto pt-safe-top">
          <header className="flex justify-between items-center p-6 border-b border-white/5">
            <button onClick={() => setSelectedUser(null)} className="p-3 bg-nsp-input rounded-xl text-white"><X size={20}/></button>
            <h3 className="text-white font-black text-[10px] uppercase">Fiche Client</h3>
            <div className="w-10"></div>
          </header>
          <div className="max-w-2xl mx-auto w-full p-6 space-y-6">
            <div className="bg-nsp-card border border-nsp-border rounded-[2rem] p-8 text-center">
               <div className="w-20 h-20 bg-nsp-input rounded-full mx-auto flex items-center justify-center text-3xl font-black text-nsp-primary mb-4">{selectedUser.name.charAt(0)}</div>
               <h2 className="text-2xl font-black text-white uppercase">{selectedUser.name}</h2>
               <p className="text-gray-500 text-xs mb-8">{selectedUser.email}</p>
               
               <div className="space-y-3">
                  <button onClick={() => handleResetPassword(selectedUser)} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                    <KeyRound size={16} /> Réinitialiser le mot de passe
                  </button>
                  <button onClick={() => setIsMessageModalOpen(true)} className="w-full bg-nsp-primary text-white p-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                    <Send size={16} /> Envoyer un message / Question
                  </button>
                  <button onClick={() => handleInvitationMail(selectedUser)} className="w-full bg-nsp-input text-white p-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                    <Mail size={16} /> Envoyer mail d'invitation
                  </button>
                  <button onClick={() => handleResetAccount(selectedUser)} className="w-full bg-orange-600/10 text-orange-500 p-5 rounded-2xl font-black text-[10px] uppercase border border-orange-500/10">Réinitialiser le compte (Vider garage)</button>
                  <button 
                    onClick={() => setDeleteUserConfirmation({ isOpen: true, userId: selectedUser.id })} 
                    className="w-full bg-red-600/10 text-red-500 p-5 rounded-2xl font-black text-[10px] uppercase border border-red-500/10"
                  >
                    Supprimer définitivement le compte
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {isMessageModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-nsp-card border border-nsp-border w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <h3 className="text-white font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-3">
              <Send size={18} className="text-nsp-primary" /> Message à {selectedUser.name}
            </h3>
            <textarea
              className="w-full bg-nsp-input border border-white/10 rounded-2xl p-4 text-white text-xs font-bold min-h-[150px] outline-none focus:border-nsp-primary/50 transition-all mb-6"
              placeholder="Écrivez votre message ici..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            <div className="flex gap-4">
              <button
                onClick={() => setIsMessageModalOpen(false)}
                className="flex-1 bg-nsp-input text-white py-4 rounded-xl font-black text-[10px] uppercase"
              >
                Annuler
              </button>
              <button
                onClick={() => handleSendMessage(selectedUser)}
                className="flex-1 bg-nsp-primary text-white py-4 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-nsp-primary/20"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {resetConfirmation.isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-nsp-card w-full max-w-sm rounded-[2.5rem] border border-white/10 p-8 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500">
                <AlertTriangle size={32} />
              </div>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 text-center">Réinitialiser le compte ?</h3>
            <p className="text-gray-400 text-sm font-medium leading-relaxed mb-8 text-center">
              Voulez-vous vraiment RÉINITIALISER le compte de {resetConfirmation.user?.name} ? Toutes ses voitures et factures seront supprimées définitivement.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmResetAccount} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Réinitialiser</button>
              <button onClick={() => setResetConfirmation({ isOpen: false, user: null })} className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-500 hover:text-white">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {deleteUserConfirmation.isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-nsp-card w-full max-w-sm rounded-[2.5rem] border border-white/10 p-8 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-500">
                <Trash2 size={32} />
              </div>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 text-center">Supprimer le client ?</h3>
            <p className="text-gray-400 text-sm font-medium leading-relaxed mb-8 text-center">
              Voulez-vous vraiment supprimer ce client ? Cette action est irréversible.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { onDeleteUser(deleteUserConfirmation.userId!); setSelectedUser(null); setDeleteUserConfirmation({ isOpen: false, userId: null }); }} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Supprimer</button>
              <button onClick={() => setDeleteUserConfirmation({ isOpen: false, userId: null })} className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-500 hover:text-white">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
