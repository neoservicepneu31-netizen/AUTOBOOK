
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { db } from '../services/storageService';
import { cloud } from '../services/cloudService';
import { ArrowRight, UserPlus, ShieldCheck, CheckCircle2, Wrench, Car, Lock, AlertCircle, ShieldAlert, LayoutDashboard, CheckSquare, Square, UserCircle2, KeyRound, Check, RefreshCw, Mail } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

type AuthMode = 'login' | 'register' | 'recovery';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onNotify }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const lastEmail = db.session.getLastEmail();
    const rememberMePref = localStorage.getItem('AUTOBOOK_REMEMBER_ME');
    
    if (lastEmail) {
      setEmail(lastEmail);
      if (rememberMePref === 'false') {
        setRememberMe(false);
      } else {
        setRememberMe(true);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'recovery') {
        await cloud.resetPassword(email);
        setIsLoading(false);
        setMode('login');
        onNotify('success', 'Récupération', "✅ Un lien de réinitialisation vous a été envoyé par e-mail.");
        return;
      }

      let loggedInUser: User;

      if (mode === 'login') {
        loggedInUser = await cloud.login(email, password);
        
        if (isAdminMode && loggedInUser.role !== 'admin') {
          await cloud.logout();
          throw new Error("Accès Administrateur Refusé.");
        }
      } else {
        // Mode Inscription
        if (password.length < 6) {
          throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
        }
        loggedInUser = await cloud.register(email, password, name, isAdminMode ? 'admin' : 'user');
      }

      onLogin({ ...loggedInUser, rememberMe });
    } catch (e: any) {
      console.error("Auth Error:", e);
      let message = "Une erreur est survenue lors de l'authentification.";
      
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        if (email.toLowerCase() === "neoservicepneu31@gmail.com") {
          message = "Le compte existe déjà mais le mot de passe est incorrect. Veuillez utiliser 'Mot de passe oublié' pour le réinitialiser.";
        } else {
          message = "Identifiants incorrects ou compte inexistant. Si c'est votre première visite, veuillez vous inscrire.";
        }
      } else if (e.code === 'auth/email-already-in-use') {
        message = "Cette adresse email est déjà enregistrée. Veuillez utiliser l'onglet 'Connexion' ou réinitialiser votre mot de passe.";
      } else if (e.code === 'auth/operation-not-allowed') {
        message = "La connexion par Email/Mot de passe n'est pas activée dans la console Firebase. Veuillez l'activer dans l'onglet Authentication > Sign-in method.";
      } else if (e.message) {
        message = e.message;
      }
      
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const loggedInUser = await cloud.loginWithGoogle();
      onLogin({ ...loggedInUser, rememberMe: true });
    } catch (e: any) {
      console.error("Google Auth Error:", e);
      setError("Erreur lors de la connexion avec Google.");
    } finally {
      setIsLoading(false);
    }
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
          <div className="flex bg-nsp-input p-1.5 rounded-2xl mb-8">
             <button type="button" onClick={() => { setMode('login'); setError(null); }} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${mode === 'login' ? 'bg-nsp-card text-white shadow-lg' : 'text-gray-500'}`}>Connexion</button>
             <button type="button" onClick={() => { setMode('register'); setError(null); }} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${mode === 'register' ? 'bg-nsp-card text-white shadow-lg' : 'text-gray-500'}`}>S'inscrire</button>
          </div>

          {isAdminMode && mode === 'login' && (
            <div className="mb-8 text-center">
               <span className="bg-red-600 text-white text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg">Accès Restreint : Administrateur</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-2xl text-red-500 text-[10px] font-black uppercase flex flex-col gap-3 animate-shake">
              <div className="flex items-center gap-3">
                <AlertCircle size={16} /> {error}
              </div>
              {error.includes("S'INSCRIRE") && (
                <button 
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  className="mt-2 bg-red-600 text-white py-2 px-4 rounded-xl text-[9px] font-black hover:bg-red-700 transition-colors"
                >
                  Passer à l'inscription maintenant
                </button>
              )}
              {error.includes("réinitialiser") && (
                <button 
                  type="button"
                  onClick={() => { setMode('recovery'); setError(null); }}
                  className="mt-2 bg-white text-black py-2 px-4 rounded-xl text-[9px] font-black hover:bg-gray-200 transition-colors"
                >
                  Réinitialiser mon mot de passe
                </button>
              )}
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
              <input 
                type="email" 
                placeholder="ADRESSE EMAIL" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className={`w-full bg-nsp-input border border-transparent rounded-2xl pl-12 pr-4 py-4 text-white text-xs font-bold outline-none transition-all ${isAdminMode ? 'focus:border-red-500' : 'focus:border-nsp-primary'}`} 
                required 
                autoComplete="email" 
                autoCapitalize="none"
              />
            </div>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="MOT DE PASSE" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className={`w-full bg-nsp-input border border-transparent rounded-2xl pl-12 pr-12 py-4 text-white text-xs font-bold outline-none transition-all ${isAdminMode ? 'focus:border-red-500' : 'focus:border-nsp-primary'}`} 
                required={mode !== 'recovery'} 
                disabled={mode === 'recovery'} 
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                {showPassword ? <Lock size={16} /> : <KeyRound size={16} />}
              </button>
            </div>

            {mode !== 'recovery' && (
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setRememberMe(!rememberMe)} className="flex items-center gap-2 group">
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${rememberMe ? 'bg-nsp-primary border-nsp-primary' : 'bg-nsp-input border-white/10 group-hover:border-nsp-primary'}`}>
                    {rememberMe && <Check size={12} className="text-white" />}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-300">Rester connecté</span>
                </button>
                
                {mode === 'login' && (
                  <button type="button" onClick={() => setMode('recovery')} className="text-[9px] text-gray-500 font-black uppercase tracking-widest hover:text-nsp-primary transition-colors">
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
            )}

            {mode === 'recovery' && (
              <div className="flex justify-end">
                <button type="button" onClick={() => setMode('login')} className="text-[9px] text-gray-500 font-black uppercase tracking-widest hover:text-nsp-primary transition-colors">
                  Retour à la connexion
                </button>
              </div>
            )}
            
            <button disabled={isLoading} className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2 ${isAdminMode ? 'bg-white text-black' : 'bg-nsp-primary text-white'}`}>
              {isLoading ? (
                <><RefreshCw size={18} className="animate-spin" /> Vérification...</>
              ) : isAdminMode ? (
                <>DÉVERROUILLER LA CONSOLE <ArrowRight size={18} /></>
              ) : mode === 'login' ? (
                <>OUVRIR MON GARAGE <ArrowRight size={18} /></>
              ) : mode === 'register' ? (
                <>CRÉER MON COMPTE <Check size={18} /></>
              ) : (
                <>DEMANDER UN NOUVEAU CODE <Mail size={18} /></>
              )}
            </button>

            {mode !== 'recovery' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-px bg-white/5 flex-1"></div>
                  <span className="text-[8px] text-gray-700 font-black uppercase tracking-widest">OU</span>
                  <div className="h-px bg-white/5 flex-1"></div>
                </div>
                
                <button 
                  type="button" 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full py-4 bg-white/5 border border-white/10 rounded-[2rem] text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                  Continuer avec Google
                </button>
              </div>
            )}
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
