
import React, { useState, useRef } from 'react';
import { Invoice, TechnicalSpecs } from '../types';
import { Loader2, X, Check, Camera, Zap, AlertTriangle, Fuel, Wrench, RefreshCw, FileText, Info } from 'lucide-react';
import { analyzeInvoiceImage, fileToGenerativePart } from '../services/geminiService';

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
  const [currentMimeType, setCurrentMimeType] = useState<string>('image/jpeg');
  const [detectedSpecs, setDetectedSpecs] = useState<TechnicalSpecs | undefined>(undefined);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    km: '',
    price: '',
    volume: ''
  });

  const performAnalysis = async (base64: string, mime: string) => {
    setIsAnalyzing(true);
    setIsSuccess(false);
    setAnalysisError(null);

    try {
      const result = await analyzeInvoiceImage(base64, mime);
      
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
      console.error("AI Analysis Failed:", error);
      setAnalysisError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mime = file.type;
    setCurrentMimeType(mime);
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      if (mime.startsWith('image/')) {
        setImagePreview(URL.createObjectURL(file));
      } else {
        setImagePreview(null);
      }

      const base64 = await fileToGenerativePart(file);
      setFinalBase64(base64);

      await performAnalysis(base64, mime);
    } catch (error: any) {
      setIsAnalyzing(false);
      setAnalysisError("Impossible de lire le fichier sélectionné.");
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
      imageUrl: imagePreview || undefined,
      detectedSpecs
    };
    onSave(newInvoice, detectedSpecs);
  };

  return (
    <div className="h-[100dvh] bg-nsp-bg flex flex-col w-full absolute inset-0 z-50 overflow-hidden">
      <div className="p-4 flex items-center justify-between bg-nsp-card border-b border-nsp-border shrink-0 pt-safe-top">
        <button onClick={onCancel} className="text-nsp-sub p-2"><X size={24} /></button>
        <h2 className="text-sm font-black text-white uppercase tracking-widest">Document Numérique</h2>
        <div className="w-6"></div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto pb-32">
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

        <div className="mb-6">
          <div 
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            className={`relative aspect-video rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all ${isSuccess ? 'border-nsp-success bg-nsp-success/5' : analysisError ? 'border-red-500/30 bg-red-950/10' : 'border-gray-700 bg-nsp-input'}`}
          >
            {imagePreview ? (
              <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Aperçu" />
            ) : currentMimeType === 'application/pdf' && finalBase64 ? (
              <div className="flex flex-col items-center text-nsp-primary">
                <FileText size={48} />
                <span className="text-[10px] font-black mt-2">PDF Détecté</span>
              </div>
            ) : null}
            
            <div className="z-10 flex flex-col items-center gap-3">
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Loader2 className="animate-spin text-nsp-primary" size={48} />
                    <Zap className="absolute inset-0 m-auto text-nsp-primary animate-pulse" size={16} />
                  </div>
                  <span className="text-[11px] font-black text-white uppercase tracking-[0.3em] animate-pulse">Extraction IA en cours...</span>
                </div>
              ) : isSuccess ? (
                <div className="bg-nsp-success text-white px-8 py-4 rounded-full font-black text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-2xl">
                  <Check size={20} /> Lecture Terminée
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-nsp-bg flex items-center justify-center border border-white/5 shadow-2xl mb-2">
                    <Camera size={32} className="text-gray-600" />
                  </div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Prendre en Photo / PDF</span>
                </>
              )}
            </div>
          </div>
          
          {finalBase64 && !isAnalyzing && (
            <button 
              onClick={() => performAnalysis(finalBase64, currentMimeType)}
              className="mt-4 w-full bg-nsp-primary/10 text-nsp-primary border border-nsp-primary/20 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <RefreshCw size={14} /> Réessayer l'analyse IA
            </button>
          )}
        </div>

        {analysisError && (
           <div className="mb-6 bg-red-950/40 border border-red-500/30 p-5 rounded-[2rem] space-y-3 text-red-200">
             <div className="flex items-center gap-4">
                <AlertTriangle size={24} className="shrink-0 text-red-500" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{analysisError}</p>
             </div>
             {analysisError.includes("CONFIG_ERROR") && (
               <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                  <p className="text-[9px] text-gray-400 font-bold flex items-center gap-2">
                    <Info size={12} className="text-nsp-primary" />
                    Action : Vérifiez les variables d'environnement sur votre dashboard Vercel et redéployez.
                  </p>
               </div>
             )}
           </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="text-[9px] text-gray-600 font-black uppercase mb-2 ml-1 block tracking-widest">Établissement</label>
            <input 
              type="text" 
              className="w-full bg-nsp-input border border-nsp-border rounded-2xl px-6 py-5 text-white font-bold text-sm focus:border-nsp-primary outline-none transition-all" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              placeholder="Ex: Norauto, Total..." 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] text-gray-600 font-black uppercase mb-2 ml-1 block tracking-widest">Kilométrage</label>
              <input 
                type="number" 
                className="w-full bg-nsp-input border border-nsp-border rounded-2xl px-6 py-5 text-white font-bold text-sm focus:border-nsp-primary outline-none" 
                value={formData.km} 
                onChange={e => setFormData({...formData, km: e.target.value})} 
              />
            </div>
            <div>
              <label className="text-[9px] text-gray-600 font-black uppercase mb-2 ml-1 block tracking-widest">Prix (€)</label>
              <input 
                type="number" 
                className="w-full bg-nsp-input border border-nsp-border rounded-2xl px-6 py-5 text-white font-bold text-sm focus:border-nsp-primary outline-none" 
                value={formData.price} 
                onChange={e => setFormData({...formData, price: e.target.value})} 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-nsp-card border-t border-nsp-border fixed bottom-0 w-full pb-safe-bottom z-40">
        <button 
          onClick={handleSubmit} 
          disabled={isAnalyzing}
          className="w-full bg-nsp-primary text-white font-black py-5 rounded-[2.5rem] text-[12px] uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(230,57,70,0.3)] disabled:opacity-50"
        >
           {isAnalyzing ? 'Synchronisation IA...' : 'ENREGISTRER AU GARAGE'}
        </button>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*,application/pdf" 
        onChange={handleFileChange} 
      />
    </div>
  );
};
