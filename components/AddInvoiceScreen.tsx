
import React, { useState, useEffect } from 'react';
import { Invoice, TechnicalSpecs } from '../types';
import { Loader2, X, Camera, AlertTriangle, Fuel, Wrench, FileText, Info, Upload, Gauge, Euro } from 'lucide-react';
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
  const [detectedSpecs, setDetectedSpecs] = useState<TechnicalSpecs | undefined>(undefined);

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    km: '',
    price: '',
    volume: ''
  });

  // Pour le feedback visuel si le KM est vide après analyse
  const [highlightKm, setHighlightKm] = useState(false);

  const performAnalysis = async (base64DataUrl: string, mime: string) => {
    setIsAnalyzing(true);
    setIsSuccess(false);
    setAnalysisError(null);
    setHighlightKm(false);

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
        
        // Si le KM n'est pas trouvé, on prévient l'utilisateur
        if (!result.km) {
          setHighlightKm(true);
        }
      }
    } catch (error: any) {
      console.error("AI Analysis Failed:", error);
      setAnalysisError("Lecture impossible. Vérifiez la netteté et complétez manuellement.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mime = file.type || 'image/jpeg';
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const base64DataUrl = await processFile(file);
      setPersistentImage(base64DataUrl);
      await performAnalysis(base64DataUrl, mime);
    } catch (error: any) {
      setIsAnalyzing(false);
      setAnalysisError("Erreur de traitement du fichier.");
    } finally {
      e.target.value = '';
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
        <h2 className="text-sm font-black text-white uppercase tracking-widest">Archiver un document</h2>
        <div className="w-6"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-40">
        <div className="flex bg-nsp-input p-1 rounded-2xl">
          <button onClick={() => setActiveTab('maintenance')} className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'maintenance' ? 'bg-nsp-primary text-white' : 'text-gray-500'}`}><Wrench size={16} /> Maintenance</button>
          <button onClick={() => setActiveTab('fuel')} className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'fuel' ? 'bg-nsp-primary text-white' : 'text-gray-500'}`}><Fuel size={16} /> Carburant</button>
        </div>

        <div className="space-y-4">
          <label 
            htmlFor="realCameraInput"
            className={`relative aspect-[3/4] max-h-[350px] rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all mx-auto w-full max-w-[300px] cursor-pointer ${isSuccess ? 'border-nsp-success bg-nsp-success/5' : analysisError ? 'border-red-500/30 bg-red-950/10' : 'border-gray-700 bg-nsp-input'}`}
          >
            {persistentImage ? (
               isPDF ? (
                 <div className="flex flex-col items-center gap-4 text-center p-10"><FileText size={48} className="text-red-500" /><p className="text-white font-bold text-[10px] uppercase">PDF prêt</p></div>
               ) : (
                 <img src={persistentImage} className="absolute inset-0 w-full h-full object-cover" alt="Scan" />
               )
            ) : (
               <div className="flex flex-col items-center gap-3 text-gray-500"><Camera size={48} className="opacity-20" /><p className="text-[10px] font-black uppercase tracking-widest">Appuyez pour scanner</p></div>
            )}
            
            <div className={`z-10 flex flex-col items-center gap-3 ${persistentImage ? 'bg-black/60 p-4 rounded-2xl backdrop-blur-sm' : ''}`}>
              {isAnalyzing && (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="animate-spin text-nsp-primary" size={32} />
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Analyse IA...</span>
                </div>
              )}
            </div>
          </label>

          {!persistentImage && (
             <div className="grid grid-cols-2 gap-3 max-w-[300px] mx-auto">
                <label htmlFor="realCameraInput" className="bg-nsp-primary text-white py-4 rounded-2xl flex flex-col items-center gap-2 shadow-xl cursor-pointer active:brightness-90 transition-all">
                   <Camera size={20} />
                   <span className="text-[8px] font-black uppercase tracking-widest">Prendre Photo</span>
                </label>
                <label htmlFor="realFileInput" className="bg-nsp-input border border-white/5 text-white py-4 rounded-2xl flex flex-col items-center gap-2 shadow-xl cursor-pointer active:brightness-90 transition-all">
                   <Upload size={20} />
                   <span className="text-[8px] font-black uppercase tracking-widest">Choisir PDF / Image</span>
                </label>
             </div>
          )}
          {persistentImage && (
            <div className="flex justify-center gap-4">
               <button onClick={() => setPersistentImage(null)} className="text-white font-black text-[9px] uppercase underline decoration-nsp-primary underline-offset-4">Remplacer le scan</button>
            </div>
          )}
        </div>

        {analysisError && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-2xl text-red-500 text-[10px] font-black uppercase flex items-center gap-3 animate-shake max-w-[300px] mx-auto">
            <AlertTriangle size={16} /> {analysisError}
          </div>
        )}

        <div className="bg-nsp-card p-6 rounded-[2.5rem] border border-nsp-border space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><Info size={14} className="text-nsp-primary" /> Vérification des données</h3>
            {isSuccess && <span className="text-[8px] bg-nsp-success/20 text-nsp-success px-2 py-1 rounded-full font-black uppercase">Extraits par IA</span>}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[9px] text-gray-500 font-black uppercase mb-1.5 ml-1 block tracking-widest">Garage / Établissement</label>
              <input type="text" className="w-full bg-nsp-input border border-white/5 rounded-xl px-4 py-3.5 text-white font-bold text-sm focus:border-nsp-primary outline-none transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: TotalEnergies, Norauto..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className={`text-[9px] font-black uppercase mb-1.5 ml-1 block tracking-widest transition-colors ${highlightKm ? 'text-nsp-primary' : 'text-gray-500'}`}>
                   Kilométrage {highlightKm && "(Requis)"}
                </label>
                <div className="relative">
                   <Gauge className={`absolute left-4 top-1/2 -translate-y-1/2 ${highlightKm ? 'text-nsp-primary' : 'text-gray-500'}`} size={16} />
                   <input 
                    type="number" 
                    inputMode="numeric"
                    className={`w-full bg-nsp-input border rounded-xl pl-12 pr-4 py-3.5 text-white font-black text-sm outline-none transition-all ${highlightKm ? 'border-nsp-primary shadow-[0_0_10px_rgba(230,57,70,0.2)]' : 'border-white/5 focus:border-nsp-primary'}`} 
                    value={formData.km} 
                    onChange={e => {
                      setFormData({...formData, km: e.target.value});
                      if(e.target.value) setHighlightKm(false);
                    }} 
                    placeholder="Entrez le KM"
                   />
                </div>
              </div>

              <div>
                <label className="text-[9px] text-gray-500 font-black uppercase mb-1.5 ml-1 block tracking-widest">Total (€)</label>
                <div className="relative">
                   <Euro className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                   <input 
                    type="number" 
                    inputMode="decimal"
                    className="w-full bg-nsp-input border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-white font-black text-sm focus:border-nsp-primary outline-none transition-all" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})} 
                    placeholder="0.00"
                   />
                </div>
              </div>

              {activeTab === 'fuel' && (
                <div>
                  <label className="text-[9px] text-gray-500 font-black uppercase mb-1.5 ml-1 block tracking-widest">Volume (L)</label>
                  <div className="relative">
                    <Fuel className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="number" 
                      inputMode="decimal"
                      className="w-full bg-nsp-input border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-white font-black text-sm focus:border-nsp-primary outline-none transition-all" 
                      value={formData.volume} 
                      onChange={e => setFormData({...formData, volume: e.target.value})} 
                      placeholder="Litre"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label className="text-[9px] text-gray-500 font-black uppercase mb-1.5 ml-1 block tracking-widest">Date</label>
              <input type="date" className="w-full bg-nsp-input border border-white/5 rounded-xl px-4 py-3.5 text-white font-bold text-sm focus:border-nsp-primary outline-none [color-scheme:dark]" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-nsp-card border-t border-nsp-border fixed bottom-0 w-full pb-safe-bottom z-[110]">
        <button 
          onClick={handleSubmit} 
          disabled={isAnalyzing || !persistentImage || !formData.km} 
          className="w-full bg-nsp-primary text-white font-black py-5 rounded-[2rem] text-[11px] uppercase tracking-[0.2em] shadow-xl disabled:opacity-50 active:scale-95 transition-all"
        >
          {isAnalyzing ? 'Analyse en cours...' : !formData.km ? 'Veuillez saisir le KM' : 'ARCHIVER DANS LE CLOUD'}
        </button>
      </div>

      {/* INPUTS RÉELS - PLACÉS ICI POUR UNE COMPATIBILITÉ MAXIMALE AVEC LES LABELS */}
      <input 
        id="realCameraInput" 
        type="file" 
        accept="image/*" 
        capture="environment" 
        onChange={handleFileChange} 
        style={{ position: 'absolute', top: '-100px', left: '-100px', opacity: 0, width: '1px', height: '1px' }} 
      />
      <input 
        id="realFileInput" 
        type="file" 
        accept="image/*,application/pdf" 
        onChange={handleFileChange} 
        style={{ position: 'absolute', top: '-100px', left: '-100px', opacity: 0, width: '1px', height: '1px' }} 
      />
    </div>
  );
};
