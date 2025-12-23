
import React from 'react';
import { ArrowLeft, Phone, MessageSquare, AlertTriangle, FileSearch, ShieldCheck, Lock } from 'lucide-react';

interface AssistanceScreenProps {
  onBack: () => void;
  canUseAssistance: boolean;
  onRequireAccess: () => void;
}

export const AssistanceScreen: React.FC<AssistanceScreenProps> = ({ onBack, canUseAssistance, onRequireAccess }) => {
  
  const handleCall = () => {
    if (!canUseAssistance) {
        onRequireAccess();
        return;
    }
    alert("Appel vers la plateforme NSP Assistance...");
    // window.location.href = "tel:0123456789";
  };

  const handleChat = () => {
    if (!canUseAssistance) {
        onRequireAccess();
        return;
    }
    alert("Ouverture du chat avec un expert mécanicien...");
  };

  return (
    <div className="min-h-screen bg-nsp-bg flex flex-col">
      {/* Header */}
      <div className="p-6 bg-nsp-card border-b border-nsp-border flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onBack} className="text-white hover:text-nsp-primary transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">NSP Assistance</h1>
      </div>

      <div className="flex-1 p-6 overflow-y-auto max-w-md mx-auto w-full space-y-8">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-nsp-primary/20 text-nsp-primary mb-2">
             <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white">Un expert à vos côtés</h2>
          <p className="text-nsp-sub text-sm">
            Ne restez jamais seul face à un problème mécanique ou un devis incompréhensible.
          </p>
        </div>

        {/* Emergency Section */}
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-5 space-y-4 relative overflow-hidden">
           {!canUseAssistance && (
             <div className="absolute top-2 right-2">
                <div className="bg-yellow-500 text-black p-1 rounded-full shadow-lg"><Lock size={12}/></div>
             </div>
           )}
           <div className="flex items-center gap-3 text-red-500">
             <AlertTriangle size={24} />
             <h3 className="font-bold text-lg">Panne Immobilisante ?</h3>
           </div>
           <p className="text-gray-300 text-sm">
             Votre véhicule est à l'arrêt ? Contactez notre assistance dépannage 24/7. Géolocalisation immédiate.
           </p>
           <button 
             onClick={handleCall}
             className={`w-full font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${canUseAssistance ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-700 text-gray-400'}`}
           >
             {canUseAssistance ? <Phone size={20} /> : <Lock size={20} />} 
             {canUseAssistance ? "APPELER L'ASSISTANCE" : "DÉBLOQUER (1€)"}
           </button>
        </div>

        {/* Advice Section */}
        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={handleChat}
            className="bg-nsp-card border border-nsp-border hover:border-nsp-primary p-5 rounded-xl flex items-center gap-4 group transition-all text-left relative overflow-hidden"
          >
            {!canUseAssistance && <div className="absolute top-2 right-2 bg-yellow-500 p-1 rounded-full text-black z-10"><Lock size={10}/></div>}
            <div className="bg-nsp-input p-3 rounded-lg group-hover:bg-nsp-primary/20 group-hover:text-nsp-primary transition-colors">
              <FileSearch size={24} className="text-white" />
            </div>
            <div>
              <h4 className="font-bold text-white">Avis sur Devis</h4>
              <p className="text-xs text-nsp-sub mt-1">Envoyez une photo de devis, on vous dit si le prix est juste.</p>
            </div>
          </button>

          <button 
            onClick={handleChat}
            className="bg-nsp-card border border-nsp-border hover:border-nsp-primary p-5 rounded-xl flex items-center gap-4 group transition-all text-left relative overflow-hidden"
          >
            {!canUseAssistance && <div className="absolute top-2 right-2 bg-yellow-500 p-1 rounded-full text-black z-10"><Lock size={10}/></div>}
            <div className="bg-nsp-input p-3 rounded-lg group-hover:bg-nsp-primary/20 group-hover:text-nsp-primary transition-colors">
              <MessageSquare size={24} className="text-white" />
            </div>
            <div>
              <h4 className="font-bold text-white">Conseil Technique</h4>
              <p className="text-xs text-nsp-sub mt-1">Un bruit suspect ? Décrivez-le à nos experts.</p>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};
