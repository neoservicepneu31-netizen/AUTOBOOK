
import React, { useState, useRef } from 'react';
import { Invoice, TechnicalSpecs } from '../types';
import { Loader2, X, Check, FileText, Upload, Fuel, Wrench, Sparkles, Camera } from 'lucide-react';
import { analyzeInvoiceImage, fileToGenerativePart, processFile } from '../services/geminiService';

interface AddInvoiceScreenProps {
  carId: string;
  onSave: (invoice: Invoice, detectedSpecs?: TechnicalSpecs) => void;
  onCancel: () => void;
}

export const AddInvoiceScreen: React.FC<AddInvoiceScreenProps> = ({ carId, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'maintenance' | 'fuel'>('maintenance');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [finalBase64, setFinalBase64] = useState<string | null>(null); // Pour le stockage persistant

  const [fileType, setFileType] = useState<string>(''); 
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Detected specs to pass up
  const [detectedSpecs, setDetectedSpecs] = useState<TechnicalSpecs | undefined>(undefined);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    km: '',
    price: '',
    volume: ''
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isPdf = file.type === 'application/pdf';
      setFileType(isPdf ? 'pdf' : 'image');
      setFileName(file.name);
      setIsAnalyzing(true);
      setDetectedSpecs(undefined);

      try {
        let previewUrl: string;
        let base64Data: string;

        if (isPdf) {
          previewUrl = URL.createObjectURL(file);
          // Pour PDF, fileToGenerativePart retourne juste la data sans prefixe
          const rawBase64 = await fileToGenerativePart(file);
          base64Data = rawBase64;
          // On reconstruit le data URI complet pour le stockage
          setFinalBase64(`data:application/pdf;base64,${rawBase64}`);
        } else {
          // Pour Image, processFile retourne le data URI complet
          const compressedUrl = await processFile(file);
          previewUrl = compressedUrl;
          base64Data = compressedUrl.split(',')[1];
          setFinalBase64(compressedUrl);
        }

        setImagePreview(previewUrl);

        // Call Gemini
        const result = await analyzeInvoiceImage(base64Data, file.type);
        
        if (result.type === 'fuel' && activeTab !== 'fuel') {
          setActiveTab('fuel');
        } else if (result.type === 'maintenance' && activeTab !== 'maintenance') {
          setActiveTab('maintenance');
        }

        setFormData({
          title: result.title || (result.type === 'fuel' ? 'Station Service' : 'Entretien Divers'),
          date: result.date || new Date().toISOString().split('T')[0],
          km: result.km?.toString() || '',
          price: result.price?.toString() || '',
          volume: result.volume?.toString() || ''
        });

        if (result.specs) setDetectedSpecs(result.specs);

      } catch (error) {
        console.error("Error processing invoice", error);
        alert("Erreur lors de l'analyse. Veuillez remplir manuellement.");
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleSubmit = () => {
    if (!carId) {
        alert("Erreur: Véhicule non identifié. Veuillez réessayer.");
        return;
    }
    const newInvoice: Invoice = {
      id: Date.now().toString(),
      carId: carId,
      type: activeTab,
      title: formData.title || (activeTab === 'fuel' ? 'Plein Carburant' : 'Entretien'),
      date: formData.date,
      km: parseInt(formData.km) || 0,
      price: parseFloat(formData.price) || 0,
      volume: activeTab === 'fuel' ? parseFloat(formData.volume) || 0 : undefined,
      // On sauvegarde le Base64 final pour qu'il soit stocké dans le localStorage
      imageUrl: finalBase64 || undefined,
      detectedSpecs: detectedSpecs
    };
    onSave(newInvoice, detectedSpecs);
  };

  const resetUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    setFinalBase64(null);
    setFileType('');
    setFileName('');
    setDetectedSpecs(undefined);
    setFormData({title: '', date: '', km: '', price: '', volume: ''});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-[100dvh] bg-nsp-bg flex flex-col w-full absolute inset-0 z-50">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-nsp-card border-b border-nsp-border shrink-0 pt-safe-top">
        <button onClick={onCancel} className="text-nsp-sub hover:text-white p-2">
          <X size={24} />
        </button>
        <h2 className="text-lg font-bold text-white">Ajouter Document</h2>
        <div className="w-6"></div>
      </div>

      {/* Type Tabs */}
      <div className="flex p-4 gap-4 shrink-0">
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
            activeTab === 'maintenance' 
              ? 'bg-nsp-primary border-nsp-primary text-white shadow-lg' 
              : 'bg-nsp-input border-transparent text-gray-500'
          }`}
        >
          <Wrench size={18} /> Entretien
        </button>
        <button
          onClick={() => setActiveTab('fuel')}
          className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
            activeTab === 'fuel' 
              ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
              : 'bg-nsp-input border-transparent text-gray-500'
          }`}
        >
          <Fuel size={18} /> Carburant
        </button>
      </div>

      <div className="flex-1 p-4 pt-0 overflow-y-auto w-full max-w-2xl mx-auto pb-24">
        
        {/* Camera / Upload Area */}
        <div 
          className="relative w-full aspect-video rounded-2xl border-2 border-dashed border-gray-600 bg-gray-800 flex flex-col items-center justify-center mb-4 overflow-hidden cursor-pointer hover:border-white transition-colors"
          onClick={() => !imagePreview && fileInputRef.current?.click()}
        >
          {imagePreview ? (
            <>
              {fileType === 'pdf' ? (
                <div className="flex flex-col items-center justify-center text-white opacity-80">
                  <FileText size={64} className="text-red-500 mb-2" />
                  <p className="font-bold text-lg">Document PDF</p>
                  <p className="text-sm text-gray-400">{fileName}</p>
                </div>
              ) : (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain opacity-50" />
              )}
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 {isAnalyzing ? (
                   <div className="text-center space-y-2 bg-black/60 p-4 rounded-xl backdrop-blur-sm">
                     <Loader2 size={48} className="text-nsp-primary animate-spin mx-auto" />
                     <p className="text-white font-bold">Analyse IA...</p>
                   </div>
                 ) : (
                   <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full border border-green-500/50 flex items-center gap-2 backdrop-blur-md">
                     <Check size={16} /> Analyse terminée
                   </div>
                 )}
              </div>
              <button 
                onClick={resetUpload}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-nsp-primary transition-colors pointer-events-auto"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              {activeTab === 'fuel' ? (
                <div className="flex flex-col items-center animate-fade-in">
                   <div className="p-4 bg-blue-900/30 rounded-full mb-3 border border-blue-500/30">
                      <Fuel size={40} className="text-blue-400" />
                   </div>
                   <p className="text-white font-bold">Scanner Ticket Carburant</p>
                   <p className="text-blue-200/50 text-xs mt-1">L'IA détectera le volume (L) et le prix</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-4 mb-4">
                     <div className="p-3 bg-gray-700 rounded-full"><Camera size={24} className="text-white" /></div>
                     <div className="p-3 bg-gray-700 rounded-full"><Upload size={24} className="text-white" /></div>
                  </div>
                  <p className="text-white font-semibold">Toucher pour Scanner</p>
                </>
              )}
            </>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,application/pdf" 
            onChange={handleFileChange} 
          />
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Titre</label>
            <input 
              type="text" 
              className="w-full bg-nsp-input border border-transparent rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white"
              placeholder="Ex: Vidange, Pneus..."
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Km</label>
              <input 
                type="number"
                inputMode="decimal"
                className="w-full bg-nsp-input border border-transparent rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white"
                placeholder="120000"
                value={formData.km}
                onChange={(e) => setFormData({...formData, km: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Prix (€)</label>
              <input 
                type="number"
                inputMode="decimal"
                step="0.01"
                className="w-full bg-nsp-input border border-transparent rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>
          </div>

          {activeTab === 'fuel' && (
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 animate-fade-in">
              <label className="block text-sm font-medium text-blue-200 mb-2">Volume (Litres)</label>
              <input 
                type="number"
                inputMode="decimal"
                step="0.01"
                className="w-full bg-nsp-input border border-transparent focus:border-blue-500 rounded-lg px-4 py-3 text-white focus:outline-none"
                placeholder="Ex: 45.5"
                value={formData.volume}
                onChange={(e) => setFormData({...formData, volume: e.target.value})}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Date</label>
            <input 
              type="date" 
              className="w-full bg-nsp-input border border-transparent rounded-lg px-4 py-3 text-white focus:outline-none [color-scheme:dark]"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 bg-nsp-card border-t border-nsp-border shrink-0 absolute bottom-0 w-full pb-safe-bottom">
        <button 
          onClick={handleSubmit}
          className={`w-full font-bold py-4 rounded-xl text-white shadow-lg ${
            activeTab === 'fuel' ? 'bg-blue-600' : 'bg-nsp-primary'
          }`}
        >
          {activeTab === 'fuel' ? 'AJOUTER PLEIN' : 'SAUVEGARDER'}
        </button>
      </div>
    </div>
  );
};
