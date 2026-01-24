
import React, { useState } from 'react';
import { Car } from '../types';
import { Camera, CheckCircle2, Gauge, Car as CarIcon, Activity, Bike, AlertCircle, Search, Loader2, Trash2, Edit2, ScanLine, Lock, ImagePlus, X } from 'lucide-react';
import { searchVehicleByPlate } from '../services/sivService';
import { processFile } from '../services/geminiService';

interface OnboardingScreenProps {
  onSave: (car: Car) => void;
  onCancel?: () => void;
  canUseSiv: boolean;
  onRequireSiv: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onSave, onCancel, canUseSiv, onRequireSiv }) => {
  const [step, setStep] = useState(1);
  const [carName, setCarName] = useState('');
  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle'>('car');
  const [plate, setPlate] = useState('');
  const [firstRegDate, setFirstRegDate] = useState('');
  const [isSearchingSIV, setIsSearchingSIV] = useState(false);
  const [sivFound, setSivFound] = useState(false);
  const [sivError, setSivError] = useState<string | null>(null);
  const [initialKm, setInitialKm] = useState('');
  const [fuelType, setFuelType] = useState<Car['fuelType']>('diesel');
  const [tiresState, setTiresState] = useState<Car['initialState']['tires']>('good');
  const [brakesState, setBrakesState] = useState<Car['initialState']['brakes']>('good');
  const [bodyState, setBodyState] = useState<Car['initialState']['body']>('good');
  const [interiorState, setInteriorState] = useState<Car['initialState']['interior']>('good');
  const [engineState, setEngineState] = useState<Car['initialState']['engine']>('good');
  const [grayCard, setGrayCard] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Car['photos']>({ front: null, back: null, left: null, right: null, engine: null, damages: [] });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsProcessing(true);
      try {
        const result = await processFile(file);
        if (type === 'grayCard') setGrayCard(result);
        else if (type === 'engine') setPhotos(prev => ({ ...prev, engine: result }));
        else if (type === 'damage') setPhotos(prev => ({ ...prev, damages: [...prev.damages, result] }));
        else if (['front', 'back', 'left', 'right'].includes(type)) setPhotos(prev => ({ ...prev, [type]: result }));
      } catch (err) { alert("Erreur photo."); } finally { setIsProcessing(false); }
    }
    e.target.value = ''; 
  };

  const handleSIVSearch = async () => {
    if (plate.length < 4) return;
    if (!canUseSiv) { onRequireSiv(); return; }
    setIsSearchingSIV(true);
    setSivError(null);
    try {
      const result = await searchVehicleByPlate(plate);
      if (result) {
        setCarName(`${result.make} ${result.model} ${result.version}`);
        setVehicleType(result.type);
        setFirstRegDate(result.firstRegistrationDate);
        setFuelType(result.fuelType);
        setSivFound(true);
      } else { setSivError("Véhicule non trouvé."); }
    } catch (error) { setSivError("Erreur SIV."); } finally { setIsSearchingSIV(false); }
  };

  const isStep1Valid = plate.length >= 2 && firstRegDate !== '' && carName !== '';
  const isStep2Valid = initialKm !== '';
  const isStep3Valid = (grayCard !== null || sivFound) && !isProcessing;

  const StateSelector = ({ label, value, onChange }: { label: string, value: string, onChange: (v: any) => void }) => (
    <div className="flex items-center justify-between bg-nsp-input/50 p-3 rounded-lg border border-nsp-border/30">
      <span className="text-white text-sm font-medium">{label}</span>
      <div className="flex gap-1">
        <button onClick={() => onChange('bad')} className={`px-3 py-1.5 text-xs rounded font-bold ${value === 'bad' ? 'bg-red-500 text-white' : 'bg-nsp-card text-gray-500'}`}>Muv.</button>
        <button onClick={() => onChange('average')} className={`px-3 py-1.5 text-xs rounded font-bold ${value === 'average' ? 'bg-orange-500 text-white' : 'bg-nsp-card text-gray-500'}`}>Moy.</button>
        <button onClick={() => onChange('good')} className={`px-3 py-1.5 text-xs rounded font-bold ${value === 'good' ? 'bg-green-500 text-white' : 'bg-nsp-card text-gray-500'}`}>Bon</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-nsp-bg p-4 overflow-y-auto">
      {isProcessing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
           <div className="bg-nsp-card p-6 rounded-2xl flex flex-col items-center"><Loader2 className="animate-spin text-nsp-primary mb-2" size={32} /><p className="text-white font-bold">Optimisation...</p></div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6 sticky top-0 z-20 bg-nsp-bg/95 py-4 border-b border-nsp-border">
        {/* Fix: Added X import to lucide-react above */}
        {onCancel && <button onClick={onCancel} className="text-white"><X size={24}/></button>}
        <h1 className="text-xl font-bold text-white">Ajouter Véhicule</h1>
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-slide-up">
          <h3 className="text-sm font-black text-nsp-sub uppercase tracking-widest">1. Identité</h3>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex-1 flex h-12 bg-white rounded-md overflow-hidden shadow-lg border-2 border-white">
                <div className="w-8 bg-[#003399] flex items-center justify-center text-white font-bold text-[10px]">F</div>
                <input type="text" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} maxLength={9} placeholder="AB-123-CD" className="flex-1 text-black font-mono text-xl font-bold text-center outline-none" />
                <div className="w-8 bg-[#003399] flex items-center justify-center text-white font-bold text-xs">75</div>
              </div>
              <button onClick={handleSIVSearch} className="h-12 w-12 bg-nsp-primary rounded-xl flex items-center justify-center text-white shadow-lg">{isSearchingSIV ? <Loader2 className="animate-spin" size={20}/> : <Search size={20}/>}</button>
            </div>
            {sivFound && <p className="text-green-500 text-[9px] font-black uppercase mt-2">Identifié !</p>}
          </div>
          <div className="flex gap-4">
            <button onClick={() => setVehicleType('car')} className={`flex-1 p-4 rounded-xl flex flex-col items-center gap-2 border ${vehicleType === 'car' ? 'bg-nsp-primary text-white border-nsp-primary' : 'bg-nsp-input text-gray-500 border-transparent'}`}><CarIcon size={24}/>Auto</button>
            <button onClick={() => setVehicleType('motorcycle')} className={`flex-1 p-4 rounded-xl flex flex-col items-center gap-2 border ${vehicleType === 'motorcycle' ? 'bg-nsp-primary text-white border-nsp-primary' : 'bg-nsp-input text-gray-500 border-transparent'}`}><Bike size={24}/>Moto</button>
          </div>
          <input type="text" value={carName} onChange={e => setCarName(e.target.value)} placeholder="Nom (Modèle)" className="w-full bg-nsp-input rounded-xl px-4 py-3.5 text-white font-bold outline-none" />
          <input type="date" value={firstRegDate} onChange={e => setFirstRegDate(e.target.value)} className="w-full bg-nsp-input rounded-xl px-4 py-3.5 text-white font-bold outline-none [color-scheme:dark]" />
          <button onClick={() => setStep(2)} disabled={!isStep1Valid} className="w-full py-4 bg-nsp-primary text-white rounded-xl font-black text-xs uppercase disabled:opacity-50">Suivant</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-slide-up">
          <h3 className="text-sm font-black text-nsp-sub uppercase tracking-widest">2. Santé</h3>
          <input type="number" value={initialKm} onChange={e => setInitialKm(e.target.value)} placeholder="Kilométrage Actuel" className="w-full bg-nsp-input rounded-xl px-4 py-3.5 text-white font-bold outline-none" />
          <div className="space-y-3">
            <StateSelector label="Pneus" value={tiresState} onChange={setTiresState} />
            <StateSelector label="Freins" value={brakesState} onChange={setBrakesState} />
            <StateSelector label="Moteur" value={engineState} onChange={setEngineState} />
            <StateSelector label="Intérieur" value={interiorState} onChange={setInteriorState} />
          </div>
          <button onClick={() => setStep(3)} disabled={!isStep2Valid} className="w-full py-4 bg-nsp-primary text-white rounded-xl font-black text-xs uppercase">Suivant</button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-slide-up pb-20">
          <h3 className="text-sm font-black text-nsp-sub uppercase tracking-widest">3. Photos Certifiées</h3>
          
          <label htmlFor="grayCardInput" className={`w-full h-16 rounded-xl border-2 border-dashed flex items-center justify-center gap-3 transition-all relative overflow-hidden cursor-pointer ${grayCard ? 'border-green-500 bg-nsp-input' : 'border-nsp-primary bg-nsp-input'}`}>
             {grayCard ? <><img src={grayCard} className="absolute inset-0 w-full h-full object-cover opacity-30" /><span className="text-white font-black text-[10px] relative z-10">Carte Grise OK</span></> : <><ScanLine size={20} className="text-white"/><span className="text-white text-xs font-bold">Scanner Carte Grise</span></>}
             <input id="grayCardInput" type="file" accept="image/*" onChange={e => handleFileChange(e, 'grayCard')} className="hidden" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            {(['front', 'back', 'left', 'right'] as const).map(angle => (
              <label key={angle} htmlFor={`photo-${angle}`} className={`aspect-square rounded-xl border border-dashed flex flex-col items-center justify-center relative overflow-hidden cursor-pointer ${photos[angle] ? 'border-green-500 bg-nsp-input' : 'border-nsp-border bg-nsp-input'}`}>
                {photos[angle] ? <img src={photos[angle]!} className="absolute inset-0 w-full h-full object-cover" /> : <><Camera size={20} className="text-nsp-sub"/><span className="text-[10px] text-nsp-sub uppercase font-black">{angle}</span></>}
                <input id={`photo-${angle}`} type="file" accept="image/*" capture="environment" onChange={e => handleFileChange(e, angle)} className="hidden" />
              </label>
            ))}
          </div>

          <label htmlFor="engineInput" className={`w-full aspect-video rounded-xl border border-dashed flex flex-col items-center justify-center relative overflow-hidden cursor-pointer ${photos.engine ? 'border-green-500 bg-nsp-input' : 'border-nsp-border bg-nsp-input'}`}>
             {photos.engine ? <img src={photos.engine} className="absolute inset-0 w-full h-full object-cover" /> : <><Activity size={24} className="text-nsp-primary"/><span className="text-xs text-nsp-sub font-bold mt-2">Photo Compartiment Moteur</span></>}
             <input id="engineInput" type="file" accept="image/*" capture="environment" onChange={e => handleFileChange(e, 'engine')} className="hidden" />
          </label>

          <button onClick={() => onSave({ id: Date.now().toString(), ownerId: '', name: carName, type: vehicleType, plate, firstRegistrationDate: firstRegDate, fuelType, initialKm: parseInt(initialKm), grayCardUrl: grayCard, photos, initialState: { tires: tiresState, brakes: brakesState, body: bodyState, interior: interiorState, engine: engineState } })} disabled={!isStep3Valid} className="w-full py-5 bg-nsp-primary text-white rounded-2xl font-black text-xs uppercase shadow-xl mt-6">ENTRER AU GARAGE</button>
        </div>
      )}
    </div>
  );
};
