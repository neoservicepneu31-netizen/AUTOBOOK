
import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, CreditCard, Star, Smartphone, Zap } from 'lucide-react';

export type PurchaseType = 'siv' | 'assistance' | 'premium';

interface PaymentModalProps {
  feature: PurchaseType;
  onClose: () => void;
  onSuccess: (type: PurchaseType) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ feature, onClose, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');

  const getDetails = () => {
    switch (feature) {
      case 'siv':
        return {
          title: "Identification SIV Instantanée",
          price: "1,00 €",
          desc: "Remplissez automatiquement les données techniques de votre véhicule grâce à sa plaque.",
          icon: <Smartphone size={32} className="text-blue-400" />
        };
      case 'assistance':
        return {
          title: "Accès Assistance & Experts",
          price: "1,00 €",
          desc: "Contactez nos experts mécaniques et le service de dépannage 24/7.",
          icon: <ShieldCheck size={32} className="text-green-400" />
        };
      case 'premium':
        return {
          title: "AUTOBOOK PREMIUM",
          price: "5,00 €",
          desc: "Débloquez TOUT : SIV illimité + Assistance + Stockage Cloud Sécurisé Illimité.",
          icon: <Star size={32} className="text-yellow-400 fill-yellow-400" />
        };
    }
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulation Paiement
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess(feature);
    }, 2000);
  };

  const details = getDetails();

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-nsp-card w-full max-w-sm rounded-2xl border border-nsp-border overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
          <X size={24} />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-nsp-primary/20 to-black p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nsp-primary to-transparent"></div>
          <div className="mx-auto w-16 h-16 bg-black/50 rounded-full flex items-center justify-center mb-3 border border-white/10 shadow-xl">
            {details.icon}
          </div>
          <h3 className="text-xl font-bold text-white">{details.title}</h3>
          <p className="text-nsp-sub text-xs mt-1 px-4">{details.desc}</p>
        </div>

        {/* Pricing */}
        <div className="p-6 text-center">
            <div className="inline-block bg-white/5 rounded-xl px-6 py-2 border border-white/10 mb-6">
                <span className="text-3xl font-black text-white tracking-tighter">{details.price}</span>
                {feature === 'premium' && <span className="text-xs text-gray-400 block uppercase tracking-widest">Paiement Unique</span>}
            </div>

            {feature !== 'premium' && (
                <div 
                    onClick={() => onSuccess('premium')} // Raccourci pour demo: upgrade direct
                    className="mb-6 bg-yellow-900/20 border border-yellow-500/30 p-3 rounded-lg cursor-pointer hover:bg-yellow-900/30 transition-colors flex items-center gap-3 text-left"
                >
                    <div className="bg-yellow-500 text-black p-1.5 rounded-full"><Star size={12} fill="black"/></div>
                    <div>
                        <p className="text-yellow-400 font-bold text-sm">OFFRE SPÉCIALE</p>
                        <p className="text-gray-400 text-xs">Passez Premium pour 5€ et tout est gratuit !</p>
                    </div>
                </div>
            )}

            <form onSubmit={handlePayment} className="space-y-4 text-left">
                <div>
                    <label className="text-xs text-gray-500 font-bold uppercase ml-1">Numéro de Carte (Simulation)</label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-3 text-gray-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="0000 0000 0000 0000" 
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full bg-nsp-input border border-nsp-border rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-nsp-primary focus:outline-none transition-colors font-mono"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="MM/YY" className="bg-nsp-input border border-nsp-border rounded-lg px-4 py-2.5 text-white focus:border-nsp-primary outline-none text-center" />
                    <input type="text" placeholder="CVC" className="bg-nsp-input border border-nsp-border rounded-lg px-4 py-2.5 text-white focus:border-nsp-primary outline-none text-center" />
                </div>

                <button 
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-white text-black hover:bg-gray-200 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 mt-2"
                >
                    {isProcessing ? (
                        <>Traitement en cours...</>
                    ) : (
                        <>Payer {details.price} <CheckCircle2 size={18}/></>
                    )}
                </button>
            </form>
            
            <p className="text-[10px] text-gray-600 mt-4 flex items-center justify-center gap-1">
                <ShieldCheck size={10} /> Paiement 100% Sécurisé via Stripe (Simulé)
            </p>
        </div>
      </div>
    </div>
  );
};
