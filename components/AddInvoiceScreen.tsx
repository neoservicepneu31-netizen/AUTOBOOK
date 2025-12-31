
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
    <div className="fixed inset-0 bg-nsp-bg flex flex-col z-[100] overflow-hidden min-h-[100dvh]">
      <div className="p-4 flex items-center justify-between bg-nsp-card border-b border-nsp-border shrink-0 pt-safe-top">
        <button onClick={onCancel} className="text-nsp-sub p-2"><X size={24} /></button>
        <h2 className="text-sm font-black text-white uppercase tracking-widest">Scanner & Classer</h2>
        <div className="w-6"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-40">
        <div className="flex bg-nsp-input p-1 rounded-2xl">
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

        <div className="space-y-4">
          <div 
            className={`relative aspect-[3/4] max-h-[350px] rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all mx-auto w-full max-w-[300px] ${isSuccess ? 'border-nsp-success bg-nsp-success/5' : analysisError ? 'border-red-500/30 bg-red-950/10' : 'border-gray-700 bg-nsp-input'}`}
          >
            {persistentImage ? (
               isPDF ? (
                 <div className="flex flex-col items-center gap-4 text-center p-10">
                    <FileText size={48} className="text-red-500" />
                    <p className="text-white font-bold text-[10px] uppercase">Document PDF Prêt</p>
                 </div>
               ) : (
                 <img src={persistentImage} className="absolute inset-0 w-full h-full object-cover" alt="Scan" />
               )
            ) : null}
            
            <div className={`z-10 flex flex-col items-center gap-3 ${persistentImage ? 'bg-black/60 p-4 rounded-2xl backdrop-blur-sm' : ''}`}>
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="animate-spin text-nsp-primary" size={32} />
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Lecture IA...</span>
                </div>
              ) : !persistentImage ? (
                <div className="flex flex-col gap-3 w-full px-4">
                  <button onClick={() => cameraInputRef.current?.click()} className="bg-nsp-primary text-white px-4 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase">
                    <Camera size={16} /> Photo
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="bg-white/10 text-white px-4 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase border border-white/10">
                    <Upload size={16} /> PDF
                  </button>
                </div>
              ) : (
                <button onClick={() => setPersistentImage(null)} className="text-white font-black text-[9px] uppercase underline">Changer</button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-nsp-card p-5 rounded-3xl border border-nsp-border space-y-4 shadow-xl">
          <div className="space-y-4">
            <div>
              <label className="text-[9px] text-gray-500 font-black uppercase mb-1.5 ml-1 block tracking-widest">Enseigne / Titre</label>
              <input 
                type="text" 
                className="w-full bg-nsp-input border border-transparent rounded-xl px-4 py-3.5 text-white font-bold text-sm focus:border-nsp-primary outline-none" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="Ex: Garage NSP..." 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] text-gray-500 font-black uppercase mb-1.5 ml-1 block tracking-widest">Kilométrage</label>
                <input 
                  type="number" 
                  className="w-full bg-nsp-input border border-transparent rounded-xl px-4 py-3.5 text-white font-bold text-sm focus:border-nsp-primary outline-none" 
                  value={formData.km} 
                  onChange={e => setFormData({...formData, km: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[9px] text-gray-500 font-black uppercase mb-1.5 ml-1 block tracking-widest">Montant (€)</label>
                <input 
                  type="number" 
                  className="w-full bg-nsp-input border border-transparent rounded-xl px-4 py-3.5 text-white font-bold text-sm focus:border-nsp-primary outline-none" 
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
          className="w-full bg-nsp-primary text-white font-black py-4.5 rounded-[2rem] text-[11px] uppercase tracking-[0.2em] shadow-xl disabled:opacity-50 active:scale-95 transition-all"
        >
           {isAnalyzing ? 'Analyse en cours...' : 'VALIDER ET ARCHIVER'}
        </button>
      </div>

      <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
    </div>
  );
};
