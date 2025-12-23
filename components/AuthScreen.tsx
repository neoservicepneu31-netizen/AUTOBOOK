
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ArrowRight, UserPlus, ShieldCheck, CheckCircle2, Wrench, Car, Lock, AlertCircle, ShieldAlert, LayoutDashboard, CheckSquare, Square } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  onForgotPasswordRequest: (email: string) => boolean;
  existingUsers?: User[]; // Pour vérifier les doublons et le login
}

type AuthMode = 'login' | 'register' | 'recovery';
type ClientType = 'new' | 'existing';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onForgotPasswordRequest, existingUsers = [] }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isAdminMode, setIsAdminMode] = useState(false); // Nouveau mode Admin
  const [clientType, setClientType] = useState<ClientType>('new');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false); // État pour "Se souvenir de moi"
  
  const [error, setError] = useState<string | null>(null);
  const [recoverySent, setRecoverySent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Au chargement, vérifier si des identifiants sont mémorisés
  useEffect(() => {
    const savedCreds = localStorage.getItem('AUTOBOOK_CREDS');
    if (savedCreds) {
      try {
        const { email: sEmail, password: sPassword } = JSON.parse(savedCreds);
        if (sEmail) setEmail(sEmail);
        if (sPassword) setPassword(sPassword);
        setRememberMe(true);
      } catch (e) {
        console.error("Erreur lecture credentials", e);
      }
    } else {
      // Fallback ancien système
      const savedEmail = localStorage.getItem('AUTOBOOK_LAST_EMAIL');
      if (savedEmail) setEmail(savedEmail);
    }
  }, []);

  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
    setMode('login'); // Force login mode
    setError(null);
    // Pre-fill pour faciliter la démo (à retirer en prod stricte)
    if (!isAdminMode) {
      setEmail('neoservicepneu31@gmail.com');
      setPassword('');
    } else {
      // Si on revient en mode user, on remet les infos mémorisées si dispo
      const savedCreds = localStorage.getItem('AUTOBOOK_CREDS');
      if (savedCreds) {
         const { email: sEmail, password: sPassword } = JSON.parse(savedCreds);
         setEmail(sEmail);
         setPassword(sPassword);
      } else {
         setEmail('');
         setPassword('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (mode === 'recovery') {
      if (!email.includes('@')) {
        setError("Email invalide.");
        return;
      }
      
      // Simulation envoi demande Admin
      console.log(`[Auth] Demande reset mot de passe pour ${email} envoyée à l'admin.`);
      const success = onForgotPasswordRequest(email);
      
      if (success) {
        setRecoverySent(true);
      } else {
        setError("Aucun compte associé à cet email n'a été trouvé.");
      }
      return;
    }

    if (email && password) {
      setIsLoading(true);
      
      // Simulation appel API sécurisé
      setTimeout(() => {
        setIsLoading(false);

        // --- GESTION CONNEXION ADMIN ---
        if (isAdminMode) {
           // Vérification stricte des admins hardcodés ou existants avec rôle admin
           const adminUser = existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === 'admin');
           
           // Backdoor hardcodée pour la première connexion si pas d'users
           // Email: neoservicepneu31@gmail.com / Pass: PAM180279
           if ((email.toLowerCase() === 'neoservicepneu31@gmail.com' && password === 'PAM180279') || (adminUser && adminUser.password === password)) {
              onLogin(adminUser || {
                id: 'admin-001',
                name: 'Administrateur NSP',
                email: email,
                password: password,
                role: 'admin',
                isValidated: true
              });
           } else {
              setError("Identifiants Administrateur incorrects.");
           }
           return;
        }

        // --- MODE LOGIN UTILISATEUR ---
        if (mode === 'login') {
          const foundUser = existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
          
          if (foundUser) {
            if (foundUser.role === 'admin') {
               setError("Veuillez utiliser le portail Administrateur.");
               return;
            }
            if (foundUser.password === password) {
              // GESTION MEMORISATION
              if (rememberMe) {
                localStorage.setItem('AUTOBOOK_CREDS', JSON.stringify({ email, password }));
              } else {
                localStorage.removeItem('AUTOBOOK_CREDS');
              }
              localStorage.setItem('AUTOBOOK_LAST_EMAIL', email);

              onLogin(foundUser);
            } else {
              setError("Mot de passe incorrect.");
            }
          } else {
             setError("Aucun compte client trouvé avec cet email.");
          }
          return;
        }

        // --- MODE REGISTER (INSCRIPTION) ---
        if (mode === 'register') {
          if (!name) {
             setError("Le nom est obligatoire.");
             return;
          }
          // Vérifier doublons
          const exists = existingUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
          if (exists) {
            setError("Cet email est déjà utilisé. Connectez-vous.");
            return;
          }

          // Mémorisation automatique à l'inscription aussi pour fluidifier
          if (rememberMe) {
             localStorage.setItem('AUTOBOOK_CREDS', JSON.stringify({ email, password }));
          }
          localStorage.setItem('AUTOBOOK_LAST_EMAIL', email);

          // Création du nouvel utilisateur (Sauvegarde gérée par App.tsx)
          onLogin({ 
            id: `user-${Date.now()}`,
            name: name, 
            email,
            password, 
            role: 'user',
            clientType: clientType,
            isValidated: true
          });
        }
      }, 1000);
    }
  };

  const renderRecovery = () => (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <div className="inline-block p-3 rounded-full bg-nsp-primary/10 mb-3">
          <ShieldCheck size={32} className="text-nsp-primary" />
        </div>
        <h2 className="text-xl font-bold text-white">Réinitialisation Sécurisée</h2>
        <p className="text-nsp-sub text-sm mt-2">
          Pour des raisons de sécurité, la réinitialisation de mot de passe nécessite une validation par l'administrateur.
        </p>
      </div>

      {recoverySent ? (
        <div className="bg-green-900/20 border border-green-500/30 p-6 rounded-xl text-center space-y-3">
          <CheckCircle2 className="mx-auto text-green-500" size={40} />
          <h3 className="text-white font-bold">Demande Envoyée</h3>
          <p className="text-sm text-gray-300">
            L'administrateur (neoservicepneu31@gmail.com) a été notifié. Vous recevrez un email temporaire dès validation.
          </p>
          <button 
            onClick={() => { setMode('login'); setRecoverySent(false); }}
            className="text-green-400 text-sm font-bold underline mt-2"
          >
            Retour à la connexion
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
             <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg flex items-center gap-2 mb-4 animate-fade-in">
                <AlertCircle size={18} className="text-red-500" />
                <p className="text-xs text-red-200 font-bold">{error}</p>
             </div>
          )}
          <div>
            <label className="block text-sm font-medium text-nsp-sub mb-2">Votre Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-nsp-input border border-transparent focus:border-nsp-primary rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none"
              placeholder="votre@email.com"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-nsp-primary hover:bg-red-600 text-white font-bold py-4 rounded-lg uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Lock size={18} /> DEMANDER ACCÈS ADMIN
          </button>
          <button 
            type="button"
            onClick={() => setMode('login')}
            className="w-full text-nsp-sub text-sm hover:text-white py-2"
          >
            Annuler
          </button>
        </form>
      )}
    </div>
  );

  return (
    // CORRECTION : Utilisation de min-h-[100dvh] et overflow-y-auto pour permettre le scroll sur mobile
    // Suppression de overflow-hidden qui coupait le contenu
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center py-12 px-4 bg-black relative overflow-y-auto">
      
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-nsp-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        
        {/* LOGO : AUTOBOOK - DESIGN NOIR ET ROUGE */}
        <div className="flex flex-col items-center justify-center space-y-4">
          
          <div className="relative w-28 h-28">
            {/* Fond Noir Carré Arrondi (Squircle) */}
            <div className={`absolute inset-0 bg-[#000000] rounded-[2rem] flex items-center justify-center shadow-2xl border ${isAdminMode ? 'border-red-900 shadow-red-900/20' : 'border-gray-800'}`}>
              
              {/* Icône Voiture Blanche Stylisée (Reconstitution Vectorielle) */}
              <svg 
                 width="60" 
                 height="60" 
                 viewBox="0 0 24 24" 
                 fill="none" 
                 stroke="white" 
                 strokeWidth="2" 
                 strokeLinecap="round" 
                 strokeLinejoin="round"
                 className={isAdminMode ? "text-red-500" : "text-white"}
              >
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H12c-.7 0-1.3.3-1.8.7-.9.9-2.2 2.3-2.2 2.3s-2.7.6-4.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" />
                <path d="M15 17h-6" />
                <circle cx="7" cy="17" r="2" />
                <circle cx="17" cy="17" r="2" />
                <path d="M5 11h2" /> {/* Phare gauche */}
                <path d="M17 11h2" /> {/* Phare droit */}
              </svg>

            </div>

            {/* Overlay Badge Rouge (Bouclier) */}
            {!isAdminMode && (
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-[#E63946] rounded-xl flex items-center justify-center shadow-lg border-[4px] border-[#0a0a0a]">
                <ShieldCheck size={22} className="text-white fill-white/20" />
              </div>
            )}
            
            {/* Overlay Admin (Si mode admin) */}
            {isAdminMode && (
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-red-800 rounded-xl flex items-center justify-center shadow-lg border-[4px] border-[#0a0a0a]">
                <ShieldAlert size={22} className="text-white" />
              </div>
            )}
          </div>
          
          <div className="text-center pt-2">
            <h1 className="text-4xl font-black text-white tracking-tighter">
              AUTO<span className={isAdminMode ? "text-red-600" : "text-nsp-primary"}>BOOK</span>
            </h1>
            <p className={`text-[10px] font-bold uppercase tracking-[0.3em] mt-1 ${isAdminMode ? "text-red-500" : "text-gray-400"}`}>
              {isAdminMode ? "Portail Administration" : "Coffre-fort Numérique"}
            </p>
          </div>
        </div>

        <div className={`bg-nsp-card p-8 rounded-2xl border shadow-2xl backdrop-blur-sm relative transition-colors duration-500 ${isAdminMode ? 'border-red-900/50 bg-red-950/10' : 'border-nsp-border'}`}>
           {isLoading && (
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50">
                <div className="flex flex-col items-center text-white">
                  <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mb-3 ${isAdminMode ? 'border-red-500' : 'border-nsp-primary'}`}></div>
                  <span className="text-sm font-bold">Authentification...</span>
                </div>
             </div>
           )}

          {mode === 'recovery' ? renderRecovery() : (
            <>
              {/* Tabs (Cachés en mode Admin) */}
              {!isAdminMode && (
                <div className="flex bg-nsp-input rounded-lg p-1 mb-8">
                  <button 
                    onClick={() => { setMode('login'); setError(null); }}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'login' ? 'bg-nsp-card text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    CONNEXION
                  </button>
                  <button 
                    onClick={() => { setMode('register'); setError(null); }}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'register' ? 'bg-nsp-card text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    INSCRIPTION
                  </button>
                </div>
              )}

              {isAdminMode && (
                <div className="mb-8 text-center bg-red-900/20 p-3 rounded-lg border border-red-500/20">
                  <p className="text-red-400 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2">
                    <LayoutDashboard size={14} /> Accès Réservé au Personnel
                  </p>
                </div>
              )}

              {error && (
                 <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg flex items-center gap-2 mb-4 animate-fade-in">
                    <AlertCircle size={18} className="text-red-500" />
                    <p className="text-xs text-red-200 font-bold">{error}</p>
                 </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
                
                {mode === 'register' && !isAdminMode && (
                  <div className="space-y-4 mb-6">
                    <p className="text-xs text-nsp-sub uppercase font-bold tracking-wider mb-2">Vous êtes ?</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setClientType('existing')}
                        className={`p-3 rounded-xl border text-left transition-all ${clientType === 'existing' ? 'bg-nsp-primary/20 border-nsp-primary text-white' : 'bg-nsp-input border-transparent text-gray-500'}`}
                      >
                        <Wrench size={20} className="mb-1" />
                        <span className="text-xs font-bold block">Déjà Client</span>
                        <span className="text-xs opacity-70">J'ai un dossier</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setClientType('new')}
                        className={`p-3 rounded-xl border text-left transition-all ${clientType === 'new' ? 'bg-nsp-primary/20 border-nsp-primary text-white' : 'bg-nsp-input border-transparent text-gray-500'}`}
                      >
                        <UserPlus size={20} className="mb-1" />
                        <span className="text-xs font-bold block">Nouveau</span>
                        <span className="text-xs opacity-70">Première visite</span>
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'register' && !isAdminMode && (
                  <div>
                    <label className="block text-sm font-medium text-nsp-sub mb-2">Nom Complet</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-nsp-input border border-transparent focus:border-nsp-primary rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors"
                      placeholder="Nom & Prénom"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-nsp-sub mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full bg-nsp-input border border-transparent rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors ${isAdminMode ? 'focus:border-red-500' : 'focus:border-nsp-primary'}`}
                    placeholder={isAdminMode ? "neoservicepneu31@gmail.com" : "votre@email.com"}
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="block text-sm font-medium text-nsp-sub">Mot de passe</label>
                    {mode === 'login' && !isAdminMode && (
                      <button 
                        type="button" 
                        onClick={() => setMode('recovery')}
                        className="text-xs text-nsp-primary hover:text-red-400"
                      >
                        Oublié ?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full bg-nsp-input border border-transparent rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors ${isAdminMode ? 'focus:border-red-500' : 'focus:border-nsp-primary'}`}
                    placeholder="••••••••"
                    required
                  />
                </div>

                {/* CASE A COCHER "SE SOUVENIR DE MOI" */}
                {!isAdminMode && (
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                    {rememberMe ? (
                      <CheckSquare className="text-nsp-primary" size={20} />
                    ) : (
                      <Square className="text-gray-500" size={20} />
                    )}
                    <span className={`text-sm ${rememberMe ? 'text-white' : 'text-gray-500'}`}>Se souvenir de moi</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full text-white font-bold py-4 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 uppercase tracking-wider mt-6 disabled:opacity-50 disabled:cursor-not-allowed ${isAdminMode ? 'bg-red-700 hover:bg-red-600' : 'bg-nsp-primary hover:bg-red-600'}`}
                >
                  {isAdminMode ? (
                    <>Connexion Admin <ShieldAlert size={20} /></>
                  ) : mode === 'login' ? (
                    <>Ouvrir mon Coffre <ArrowRight size={20} /></>
                  ) : (
                    <>Créer Compte <UserPlus size={20} /></>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
        
        {/* PIED DE PAGE : BOUTON TOGGLE ADMIN */}
        <div className="text-center space-y-4 pb-10">
          <p className="text-xs text-gray-600">
            AutoBook v2.2 Security • <Lock size={10} className="inline" /> AES-256 Encryption
          </p>
          
          <button 
            onClick={toggleAdminMode}
            className={`text-[10px] font-bold uppercase tracking-widest py-2 px-4 rounded-full transition-colors border ${isAdminMode ? 'text-white border-white/20 bg-white/5' : 'text-gray-700 border-transparent hover:text-gray-500'}`}
          >
            {isAdminMode ? "Retour Espace Client" : "Accès Administrateur"}
          </button>
        </div>

      </div>
    </div>
  );
};
