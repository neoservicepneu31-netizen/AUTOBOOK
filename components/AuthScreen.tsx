
import React, { useState } from 'react';
import { User } from '../types';
import { ArrowRight, UserPlus, ShieldCheck, CheckCircle2, Wrench, Car, Lock, AlertCircle, ShieldAlert, LayoutDashboard, CheckSquare, Square, UserCircle2, KeyRound, Check, RefreshCw } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  onForgotPasswordRequest: (email: string) => boolean;
  existingUsers?: User[];
}

type AuthMode = 'login' | 'register' | 'recovery';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onForgotPasswordRequest, existingUsers = [] }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const foundUser = existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (isAdminMode) {
        if (email === 'neoservicepneu31@gmail.com' && password === 'PAM180279') {
          onLogin({ id: 'admin-001', name: 'Administrateur', email, role: 'admin', createdAt: new Date().toISOString() });
        } else if (foundUser && foundUser.role === 'admin' && foundUser.password === password) {
          onLogin(foundUser);
        } else {
          setError("Accès Administrateur Refusé.");
        }
      } else if (mode === 'login') {
        if (foundUser && foundUser.password === password) {
          onLogin(foundUser);
        } else {
          setError("Identifiants incorrects ou compte inexistant.");
        }
      } else {
        if (foundUser) {
          setError("Cette adresse email est déjà enregistrée.");
        } else if (password.length < 6) {
          setError("Le mot de passe doit contenir au moins 6 caractères.");
        } else {
          onLogin({ 
            id: 'u-' + Date.now(), 
            name, 
            email, 
            password, 
            role: 'user', 
            isValidated: true,
            isPremium: false,
            createdAt: new Date().toISOString()
          });
        }
      }
    }, 800);
  };

  return (
    <div className="flex-1 w-full bg-nsp-bg flex flex-col overflow-y-auto min-h-full pb-10">
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-10">
        <div className="flex flex-col items-center gap-4">
          <div className={`w-28 h-28 rounded-[2.5rem] border flex items-center justify-center shadow-2xl transition-all duration-500 ${isAdminMode ? 'bg-red-600/10 border-red-500 shadow-red-900/40' : 'bg-nsp-card border-gray-800 shadow-black'}`}>
             {isAdminMode ? (
               <ShieldAlert size={56} className="text-red-500 animate-pulse" />
             ) : (
               <ShieldCheck size={56} className="text-nsp-primary" />
             )}
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
              Auto<span className={isAdminMode ? "text-red-500" : "text-nsp-primary"}>Book</span>
            </h1>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.4em] mt-2">
              {isAdminMode ? "Terminal de Gestion Pro" : "Votre Carnet de Santé Intelligent"}
            </p>
          </div>
        </div>

        <div className={`w-full max-w-sm bg-nsp-card p-8 rounded-[3rem] border transition-all duration-500 shadow-2xl ${isAdminMode ? 'border-red-900/50' : 'border-nsp-border'}`}>
          {!isAdminMode && (
            <div className="flex bg-nsp-input p-1.5 rounded-2xl mb-8">
               <button onClick={() => { setMode('login'); setError(null); }} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${mode === 'login' ? 'bg-nsp-card text-white shadow-lg' : 'text-gray-500'}`}>Connexion</button>
               <button onClick={() => { setMode('register'); setError(null); }} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${mode === 'register' ? 'bg-nsp-card text-white shadow-lg' : 'text-gray-500'}`}>S'inscrire</button>
            </div>
          )}

          {isAdminMode && (
            <div className="mb-8 text-center">
               <span className="bg-red-600 text-white text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg">Accès Restreint : Administrateur</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-2xl text-red-500 text-[10px] font-black uppercase flex items-center gap-3 animate-shake">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && !isAdminMode && (
              <div className="relative">
                <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input type="text" placeholder="NOM COMPLET" value={name} onChange={e => setName(e.target.value)} className="w-full bg-nsp-input border border-transparent focus:border-nsp-primary rounded-2xl pl-12 pr-4 py-4 text-white text-xs font-bold outline-none transition-all" required />
              </div>
            )}
            <div className="relative">
              <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input type="email" placeholder="ADRESSE EMAIL" value={email} onChange={e => setEmail(e.target.value)} className={`w-full bg-nsp-input border border-transparent rounded-2xl pl-12 pr-4 py-4 text-white text-xs font-bold outline-none transition-all ${isAdminMode ? 'focus:border-red-500' : 'focus:border-nsp-primary'}`} required autoComplete="off" />
            </div>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input type="password" placeholder="MOT DE PASSE" value={password} onChange={e => setPassword(e.target.value)} className={`w-full bg-nsp-input border border-transparent rounded-2xl pl-12 pr-4 py-4 text-white text-xs font-bold outline-none transition-all ${isAdminMode ? 'focus:border-red-500' : 'focus:border-nsp-primary'}`} required />
            </div>
            
            <button disabled={isLoading} className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2 ${isAdminMode ? 'bg-white text-black' : 'bg-nsp-primary text-white'}`}>
              {isLoading ? (
                <><RefreshCw size={18} className="animate-spin" /> Vérification...</>
              ) : isAdminMode ? (
                <>DÉVERROUILLER LA CONSOLE <ArrowRight size={18} /></>
              ) : mode === 'login' ? (
                <>OUVRIR MON GARAGE <ArrowRight size={18} /></>
              ) : (
                <>CRÉER MON COMPTE <Check size={18} /></>
              )}
            </button>
          </form>
        </div>

        <button onClick={() => { setIsAdminMode(!isAdminMode); setMode('login'); setError(null); setEmail(''); setPassword(''); }} className="group flex flex-col items-center gap-3 transition-all">
          <div className={`p-4 rounded-2xl border transition-all ${isAdminMode ? 'bg-nsp-primary/10 border-nsp-primary text-nsp-primary' : 'bg-nsp-input border-white/5 text-gray-700 group-hover:text-white'}`}>
             {isAdminMode ? <UserCircle2 size={24} /> : <LayoutDashboard size={24} />}
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 group-hover:text-gray-400">
            {isAdminMode ? 'RETOUR ACCÈS CLIENT' : 'ACCÈS PROFESSIONNEL'}
          </span>
        </button>
      </div>
    </div>
  );
};
