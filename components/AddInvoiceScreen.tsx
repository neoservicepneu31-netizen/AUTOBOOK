
import React, { useState, useRef } from 'react';
import { Invoice, TechnicalSpecs } from '../types';
import { Loader2, X, Check, Camera, Zap, AlertTriangle, Fuel, Wrench, RefreshCw, FileText, Info, Upload, ImagePlus } from 'lucide-react';
import { analyzeInvoiceImage, processFile } from '../services/geminiService';

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
  const [persistentImage, setPersistentImage] = useState<string | null>(null);
  const [currentMimeType, setCurrentMimeType] = useState<string>('image/jpeg');
  const [detectedSpecs, setDetectedSpecs] = useState<TechnicalSpecs | undefined>(undefined);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    km: '',
    price: '',
    volume: ''
  });

  const performAnalysis = async (base64DataUrl: string, mime: string) => {
    setIsAnalyzing(true);
    setIsSuccess(false);
    setAnalysisError(null);

    try {
      const pureBase64 = base64DataUrl.split(',')[1];
      const result = await analyzeInvoiceImage(pureBase64, mime);
      
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
      setAnalysisError("L'IA n'a pas pu lire le document. Vérifiez la netteté ou importez un PDF.");
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
      const base64DataUrl = await processFile(file);
      setPersistentImage(base64DataUrl);
      await performAnalysis(base64DataUrl, mime);
    } catch (error: any) {
      setIsAnalyzing(false);
      setAnalysisError("Impossible de traiter ce fichier.");
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
      imageUrl: persistentImage || undefined,
      detectedSpecs
    };
    onSave(newInvoice, detectedSpecs);
  };

  const isPDF = persistentImage?.includes('application/pdf');

  return (
    <div className="h-[100dvh] bg-nsp-bg flex flex-col w-full absolute inset-0 z-[100] overflow-hidden">
      <div className="p-4 flex items-center justify-between bg-nsp-card border-b border-nsp-border shrink-0 pt-safe-top">
        <button onClick={onCancel} className="text-nsp-sub p-2"><X size={24} /></button>
        <h2 className="text-sm font-black text-white uppercase tracking-widest">Scanner & Classer</h2>
        <div className="w-6"></div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto pb-32">
        <div className="flex bg-nsp-input p-1 rounded-2xl mb-6">
          <button 
            onClick={() => setActiveTab('maintenance')}
            className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'maintenance' ? 'bg-nsp-primary text-white shadow-lg' : 'text-gray-500'}`}
          >
            <Wrench size={16} /> Maintenance
          </button>
          <button 
            onClick={() => setActiveTab('fuel')}
            className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'fuel' ? 'bg-nsp-primary text-white shadow-lg' : 'text-gray-500'}`}
          >
            <Fuel size={16} /> Carburant
          </button>
        </div>

        <div className="mb-6 space-y-4">
          <div 
            className={`relative aspect-[3/4] rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all ${isSuccess ? 'border-nsp-success bg-nsp-success/5' : analysisError ? 'border-red-500/30 bg-red-950/10' : 'border-gray-700 bg-nsp-input'}`}
          >
            {persistentImage ? (
               isPDF ? (
                 <div className="flex flex-col items-center gap-4 text-center p-10">
                    <FileText size={64} className="text-red-500" />
                    <p className="text-white font-bold text-xs uppercase">Document PDF Prêt</p>
                 </div>
               ) : (
                 <img src={persistentImage} className="absolute inset-0 w-full h-full object-cover" alt="Scan" />
               )
            ) : null}
            
            <div className={`z-10 flex flex-col items-center gap-3 ${persistentImage ? 'bg-black/60 p-6 rounded-3xl backdrop-blur-sm' : ''}`}>
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Loader2 className="animate-spin text-nsp-primary" size={48} />
                    <Zap className="absolute inset-0 m-auto text-nsp-primary animate-pulse" size={16} />
                  </div>
                  <span className="text-[11px] font-black text-white uppercase tracking-[0.3em] animate-pulse">Extraction IA...</span>
                </div>
              ) : !persistentImage ? (
                <div className="space-y-4 w-full px-6">
                  <button 
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full bg-nsp-primary text-white py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest shadow-xl"
                  >
                    <Camera size={20} /> Prendre une Photo
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-white/10 text-white py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest border border-white/10"
                  >
                    <Upload size={20} /> Importer un Fichier
                  </button>
                </div>
              ) : isSuccess ? (
                <div className="bg-nsp-success text-white px-8 py-4 rounded-full font-black text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-2xl">
                  <Check size={20} /> Extraction Réussie
                </div>
              ) : (
                <button onClick={() => setPersistentImage(null)} className="text-white font-black text-[10px] uppercase underline">Changer de document</button>
              )}
            </div>
          </div>
          
          {persistentImage && !isAnalyzing && (
            <div className="flex gap-2">
              <button 
                onClick={() => performAnalysis(persistentImage, currentMimeType)}
                className="flex-1 bg-nsp-primary/10 text-nsp-primary border border-nsp-primary/20 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <RefreshCw size={14} /> Relancer l'IA
              </button>
              <button 
                onClick={() => setPersistentImage(null)}
                className="bg-nsp-input text-gray-400 border border-nsp-border py-4 px-6 rounded-2xl text-[10px] font-black uppercase"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {analysisError && (
           <div className="mb-6 bg-red-950/40 border border-red-500/30 p-5 rounded-[2rem] flex items-center gap-4 text-red-200">
              <AlertTriangle size={24} className="shrink-0 text-red-500" />
              <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{analysisError}</p>
           </div>
        )}

        <div className="space-y-6">
          <div className="bg-nsp-card p-5 rounded-3xl border border-nsp-border space-y-4">
            <div>
              <label className="text-[9px] text-gray-600 font-black uppercase mb-2 ml-1 block tracking-widest">Enseigne du Garage</label>
              <input 
                type="text" 
                className="w-full bg-nsp-input border border-transparent rounded-2xl px-6 py-4 text-white font-bold text-sm focus:border-nsp-primary outline-none" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="Ex: Neo Service Pneu..." 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] text-gray-600 font-black uppercase mb-2 ml-1 block tracking-widest">KM Relevé</label>
                <input 
                  type="number" 
                  className="w-full bg-nsp-input border border-transparent rounded-2xl px-6 py-4 text-white font-bold text-sm focus:border-nsp-primary outline-none" 
                  value={formData.km} 
                  onChange={e => setFormData({...formData, km: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[9px] text-gray-600 font-black uppercase mb-2 ml-1 block tracking-widest">Montant TTC (€)</label>
                <input 
                  type="number" 
                  className="w-full bg-nsp-input border border-transparent rounded-2xl px-6 py-4 text-white font-bold text-sm focus:border-nsp-primary outline-none" 
                  value={formData.price} 
                  onChange={e => setFormData({...formData, price: e.target.value})} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-nsp-card border-t border-nsp-border fixed bottom-0 w-full pb-safe-bottom z-[110]">
        <button 
          onClick={handleSubmit} 
          disabled={isAnalyzing || !persistentImage}
          className="w-full bg-nsp-primary text-white font-black py-5 rounded-[2.5rem] text-[12px] uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(230,57,70,0.3)] disabled:opacity-50"
        >
           {isAnalyzing ? 'Synchronisation...' : 'ARCHIVER DANS LE CARNET'}
        </button>
      </div>

      {/* INPUTS SOURCES */}
      <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
    </div>
  );
};
