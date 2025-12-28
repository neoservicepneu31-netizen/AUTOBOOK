
import React, { useState, useRef, useEffect } from 'react';
import { Invoice, TechnicalSpecs } from '../types';
import { Loader2, X, Check, Camera, Zap, HardDrive, AlertTriangle, ImageIcon, Key, Fuel, Wrench, ArrowRight } from 'lucide-react';
import { analyzeInvoiceImage, fileToGenerativePart, processFile } from '../services/geminiService';

interface AddInvoiceScreenProps {
  carId: string;
  onSave: (invoice: Invoice, detectedSpecs?: TechnicalSpecs) => void;
  onCancel: () => void;
}

export const AddInvoiceScreen: React.FC<AddInvoiceScreenProps> = ({ carId, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'maintenance' | 'fuel'>('maintenance');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [finalBase64, setFinalBase64] = useState<string | null>(null);
  const [detectedSpecs, setDetectedSpecs] = useState<TechnicalSpecs | undefined>(undefined);
  
  const [hasApiKey, setHasApiKey] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    km: '',
    price: '',
    volume: ''
  });

  useEffect(() => {
    const checkKeyStatus = async () => {
      // Prioritize explicit check from window.aistudio
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else if (process.env.API_KEY) {
        setHasApiKey(true);
      } else {
        setHasApiKey(false);
      }
    };
    checkKeyStatus();
  }, []);

  const handleActivateIA = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success as per guidelines to mitigate race condition
      setHasApiKey(true);
      setAnalysisError(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const isPdf = file.type === 'application/pdf';
    
    setIsAnalyzing(true);
    setIsSuccess(false);
    setAnalysisError(null);
    setDetectedSpecs(undefined);

    try {
      const base64 = isPdf 
        ? await fileToGenerativePart(file)
        : (await processFile(file)).split(',')[1];
      
      if (!isPdf) {
        setImagePreview(URL.createObjectURL(file));
      }
      setFinalBase64(base64);

      const result = await analyzeInvoiceImage(base64, file.type);
      
      if (result) {
        setIsSuccess(true);
        setActiveTab(result.type === 'fuel' ? 'fuel' : 'maintenance');
        setFormData({
          title: result.title || '',
          date: result.date || new Date().toISOString().split('T')[0],
          km: result.km?.toString() || '',
          price: result.price?.toString() || '',
          volume: result.volume?.toString() || ''
        });
        setDetectedSpecs(result.specs);
      }
    } catch (error: any) {
      console.error("Analysis failed:", error);
      if (error.message === "AUTH_REQUIRED") {
        setHasApiKey(false);
        setAnalysisError("IA non activée. Veuillez cliquer sur 'ACTIVER L'IA'.");
      } else {
        setAnalysisError("Impossible de lire ce document. Saisie manuelle requise.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    if (!carId) return;
    const newInvoice: Invoice = {
      id: Date.now().toString(),
      carId,
      type: activeTab,
      title: formData.title || (activeTab === 'fuel' ? 'Plein Carburant' : 'Entretien'),
      date: formData.date,
      km: parseInt(formData.km) || 0,
      price: parseFloat(formData.price) || 0,
      volume: activeTab === 'fuel' ? parseFloat(formData.volume) || 0 : undefined,
      imageUrl: finalBase64 || undefined,
      detectedSpecs
    };
    onSave(newInvoice, detectedSpecs);
  };

  return (
    <div className="h-[100dvh] bg-nsp-bg flex flex-col w-full absolute inset-0 z-50 overflow-hidden">
      <div className="p-4 flex items-center justify-between bg-nsp-card border-b border-nsp-border shrink-0 pt-safe-top">
        <button onClick={onCancel} className="text-nsp-sub p-2"><X size={24} /></button>
        <h2 className="text-sm font-black text-white uppercase tracking-widest">Ajouter Document</h2>
        <div className="w-6"></div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto pb-32">
        
        {/* TAB SELECTOR */}
        <div className="flex bg-nsp-input p-1 rounded-2xl mb-6">
          <button 
            onClick={() => setActiveTab('maintenance')}
            className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'maintenance' ? 'bg-nsp-primary text-white shadow-lg' : 'text-gray-500'}`}
          >
            <Wrench size={16} /> Entretien
          </button>
          <button 
            onClick={() => setActiveTab('fuel')}
            className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'fuel' ? 'bg-nsp-primary text-white shadow-lg' : 'text-gray-500'}`}
          >
            <Fuel size={16} /> Carburant
          </button>
        </div>

        {/* SCAN AREA */}
        <div className="mb-6">
          <div 
            onClick={() => !isAnalyzing && cameraInputRef.current?.click()}
            className={`relative aspect-video rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all ${isSuccess ? 'border-nsp-success bg-nsp-success/5' : 'border-gray-700 bg-nsp-input'}`}
          >
            {imagePreview && <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover opacity-30" />}
            
            <div className="z-10 flex flex-col items-center gap-3">
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-3 animate-pulse">
                  <Loader2 className="animate-spin text-nsp-primary" size={40} />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Analyse IA...</span>
                </div>
              ) : isSuccess ? (
                <div className="bg-nsp-success text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-2xl animate-fade-in">
                  <Check size={18} /> Extraction réussie
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-nsp-bg flex items-center justify-center border border-white/5 shadow-inner mb-2">
                    <Camera size={32} className="text-gray-600" />
                  </div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Scanner ou Importer</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* API KEY ALERT */}
        {!hasApiKey && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-[2.5rem] flex flex-col items-center gap-4 text-center shadow-xl">
             <Key size={32} className="text-yellow-500" />
             <div className="space-y-1">
               <p className="text-white font-black text-[11px] uppercase tracking-widest">Liaison IA Nécessaire</p>
               <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest max-w-[200px] leading-relaxed">Activez votre clé API pour l'extraction automatique des factures.</p>
             </div>
             <button 
               onClick={handleActivateIA}
               className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
             >
               ACTIVER L'IA MAINTENANT <ArrowRight size={16} />
             </button>
             <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[8px] text-gray-600 underline uppercase font-bold">Consulter la doc facturation</a>
          </div>
        )}

        {analysisError && !hasApiKey && (
           <div className="mb-6 bg-red-950/20 border border-red-500/20 p-5 rounded-[2rem] flex items-center gap-4 text-red-400">
             <AlertTriangle size={24} className="shrink-0" />
             <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{analysisError}</p>
           </div>
        )}

        {/* FORM FIELDS */}
        <div className="space-y-6">
          <div>
            <label className="text-[9px] text-gray-600 font-black uppercase mb-2 ml-1 block tracking-widest">Titre du document</label>
            <input 
              type="text" 
              className="w-full bg-nsp-input border border-nsp-border rounded-2xl px-6 py-5 text-white font-bold text-sm focus:border-nsp-primary outline-none transition-all" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              placeholder="Ex: Garage Peugeot, TotalEnergies..." 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] text-gray-600 font-black uppercase mb-2 ml-1 block tracking-widest">Kilométrage</label>
              <input 
                type="number" 
                className="w-full bg-nsp-input border border-nsp-border rounded-2xl px-6 py-5 text-white font-bold text-sm focus:border-nsp-primary outline-none transition-all" 
                value={formData.km} 
                onChange={e => setFormData({...formData, km: e.target.value})} 
                placeholder="0" 
              />
            </div>
            <div>
              <label className="text-[9px] text-gray-600 font-black uppercase mb-2 ml-1 block tracking-widest">Prix Total (€)</label>
              <input 
                type="number" 
                className="w-full bg-nsp-input border border-nsp-border rounded-2xl px-6 py-5 text-white font-bold text-sm focus:border-nsp-primary outline-none transition-all" 
                value={formData.price} 
                onChange={e => setFormData({...formData, price: e.target.value})} 
                placeholder="0.00" 
              />
            </div>
          </div>

          {activeTab === 'fuel' && (
            <div className="animate-slide-up">
              <label className="text-[9px] text-gray-600 font-black uppercase mb-2 ml-1 block tracking-widest">Volume (Litres)</label>
              <input 
                type="number" 
                className="w-full bg-nsp-input border border-nsp-border rounded-2xl px-6 py-5 text-white font-bold text-sm focus:border-nsp-primary outline-none transition-all" 
                value={formData.volume} 
                onChange={e => setFormData({...formData, volume: e.target.value})} 
                placeholder="0.00" 
              />
            </div>
          )}

          {detectedSpecs && (
            <div className="mt-8 bg-nsp-primary/5 border border-nsp-primary/10 p-6 rounded-[2.5rem] animate-slide-up shadow-inner">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                <HardDrive size={16} className="text-nsp-primary" /> Mémoire IA Détectée
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(detectedSpecs).map(([key, val]) => val && (
                  <div key={key} className="bg-black/40 p-3 rounded-2xl border border-white/5">
                    <p className="text-[8px] text-gray-500 uppercase font-black mb-1">{key.replace(/Ref|Dimensions|Viscosity/g, '')}</p>
                    <p className="text-[10px] text-white font-bold truncate">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER ACTION */}
      <div className="p-4 bg-nsp-card border-t border-nsp-border fixed bottom-0 w-full pb-safe-bottom z-40">
        <button 
          onClick={handleSubmit} 
          disabled={isAnalyzing}
          className="w-full bg-nsp-primary text-white font-black py-5 rounded-[2rem] text-[11px] uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(230,57,70,0.3)] hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50"
        >
           {isAnalyzing ? <><Loader2 className="animate-spin inline mr-2" size={18} /> Analyse en cours...</> : 'ENREGISTRER LE DOCUMENT'}
        </button>
      </div>

      <input type="file" ref={cameraInputRef} className="hidden" capture="environment" onChange={handleFileChange} />
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
    </div>
  );
};
