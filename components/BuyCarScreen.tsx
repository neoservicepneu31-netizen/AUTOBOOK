
import React, { useState, useEffect } from 'react';
import { Car, Invoice } from '../types';
import { ArrowLeft, DownloadCloud, CheckCircle2, ShieldCheck, FileText, Loader2, Lock } from 'lucide-react';

interface BuyCarScreenProps {
  onCancel: () => void;
  onImportSuccess: (newCar: Car, newInvoices: Invoice[]) => void;
}

export const BuyCarScreen: React.FC<BuyCarScreenProps> = ({ onCancel, onImportSuccess }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'input' | 'fetching' | 'success'>('input');

  // Refs for inputs to handle auto-focus
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleImport = () => {
    if (code.join('').length !== 6) return;
    
    setStep('fetching');
    
    // Simulation of data recovery
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        const newCarId = 'import-' + Date.now();
        // Mock Data for the "Bought" Car
        const importedCar: Car = {
          id: newCarId,
          ownerId: 'imported-temp', // Added placeholder ownerId
          name: "Aston Martin",
          type: 'car',
          plate: "AA-007-JB",
          firstRegistrationDate: "2019-03-15",
          fuelType: "essence",
          initialKm: 18000,
          grayCardUrl: "https://images.unsplash.com/photo-1585842378081-5c0203bc9a4e?w=800&q=80",
          photos: {
            front: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&q=80", // Aston Martin / Sports Car
            back: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
            left: null,
            right: null,
            engine: null,
            damages: []
          },
          initialState: {
            tires: "good",
            brakes: "good",
            body: "good",
            interior: "good",
            engine: "good"
          }
        };
        
        const importedInvoices: Invoice[] = [
          { id: 'imp-1', carId: newCarId, type: 'maintenance', title: 'Grosse Révision Constructeur', date: '2023-11-15', km: 42000, price: 1850 },
          { id: 'imp-2', carId: newCarId, type: 'maintenance', title: 'Plaquettes de Freins Céramique', date: '2023-05-10', km: 38500, price: 920 },
          { id: 'imp-3', carId: newCarId, type: 'maintenance', title: 'Changement Pneus x4', date: '2022-09-01', km: 29000, price: 1100 },
          { id: 'imp-4', carId: newCarId, type: 'maintenance', title: 'Vidange Boîte', date: '2022-01-15', km: 20000, price: 450 },
        ];

        onImportSuccess(importedCar, importedInvoices);
      }, 2500);
    }, 3000);
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-nsp-bg flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="w-24 h-24 bg-nsp-success/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle2 size={48} className="text-nsp-success" />
        </div>
        <h2 className="text-3xl font-bold text-white text-center mb-2">Garage Synchronisé !</h2>
        <p className="text-nsp-sub text-center mb-8">
          Le véhicule <span className="text-white font-bold">AA-007-JB</span> a été ajouté à votre garage avec tout son historique.
        </p>
      </div>
    );
  }

  if (step === 'fetching') {
    return (
      <div className="min-h-screen bg-nsp-bg flex flex-col items-center justify-center p-6">
        <div className="relative w-24 h-24 mb-8">
           <div className="absolute inset-0 border-4 border-nsp-border rounded-full"></div>
           <div className="absolute inset-0 border-4 border-nsp-success rounded-full border-t-transparent animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
             <DownloadCloud className="text-white animate-pulse" size={32} />
           </div>
        </div>
        <h2 className="text-xl font-bold text-white animate-pulse text-center">Récupération Sécurisée...</h2>
        <div className="mt-8 space-y-4 w-full max-w-xs">
          <LoadingStep label="Vérification Code Cession" delay={0} />
          <LoadingStep label="Téléchargement 4 Factures" delay={1000} />
          <LoadingStep label="Contrôle Histovec" delay={1800} />
          <LoadingStep label="Synchronisation Photos HD" delay={2500} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nsp-bg flex flex-col">
      {/* Header */}
      <div className="p-6 bg-nsp-card border-b border-nsp-border flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onCancel} className="text-white hover:text-nsp-primary transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">Récupération Véhicule</h1>
      </div>

      <div className="flex-1 p-6 overflow-y-auto max-w-md mx-auto w-full flex flex-col items-center pt-10">
        
        <div className="mb-8 text-center">
          <div className="inline-block bg-nsp-success/10 p-4 rounded-full mb-4 border border-nsp-success/30">
            <Lock size={40} className="text-nsp-success" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Achat & Import</h2>
          <p className="text-nsp-sub text-sm">
            Entrez le code de cession sécurisé fourni par le vendeur pour importer le "Double Numérique" du véhicule.
          </p>
        </div>

        {/* Code Input */}
        <div className="mb-10 w-full">
          <label className="block text-center text-sm font-medium text-nsp-sub mb-4 uppercase tracking-widest">Code de Cession (6 Caractères)</label>
          <div className="flex justify-center gap-3">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 bg-nsp-input border border-nsp-border focus:border-nsp-success rounded-lg text-center text-2xl font-bold text-white focus:outline-none transition-all focus:scale-110"
              />
            ))}
          </div>
        </div>

        {/* Security Note */}
        <div className="bg-nsp-card border border-nsp-border rounded-xl p-4 mb-6 w-full flex gap-3">
          <ShieldCheck className="text-nsp-success shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-white text-sm mb-1">Garantie NSP</h4>
            <p className="text-xs text-nsp-sub">
              En important ce véhicule, vous récupérez l'intégralité de l'historique de maintenance certifié par l'IA.
            </p>
          </div>
        </div>

      </div>

      {/* Bottom Action */}
      <div className="p-6 bg-nsp-card border-t border-nsp-border">
        <button
          onClick={handleImport}
          disabled={code.join('').length !== 6}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            code.join('').length === 6
              ? 'bg-nsp-success hover:bg-green-600 text-white shadow-lg shadow-green-900/30'
              : 'bg-nsp-input text-gray-500 cursor-not-allowed'
          }`}
        >
          RÉCUPÉRER LE VÉHICULE
        </button>
      </div>
    </div>
  );
};

const LoadingStep = ({ label, delay }: { label: string, delay: number }) => {
  const [status, setStatus] = useState<'waiting' | 'loading' | 'done'>('waiting');

  useEffect(() => {
    const timerStart = setTimeout(() => setStatus('loading'), delay);
    const timerEnd = setTimeout(() => setStatus('done'), delay + 700);
    return () => { clearTimeout(timerStart); clearTimeout(timerEnd); };
  }, [delay]);

  return (
    <div className="flex items-center justify-between text-sm">
      <span className={`transition-colors ${status === 'waiting' ? 'text-gray-600' : 'text-white'}`}>{label}</span>
      {status === 'waiting' && <div className="w-4 h-4 rounded-full bg-gray-800" />}
      {status === 'loading' && <Loader2 size={16} className="text-nsp-primary animate-spin" />}
      {status === 'done' && <CheckCircle2 size={16} className="text-nsp-success" />}
    </div>
  );
};
