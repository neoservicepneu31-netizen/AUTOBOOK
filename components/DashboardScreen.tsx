

import React, { useEffect, useState, useRef } from 'react';
import { User, Car, Invoice, AIStatus, ManufacturerSpecs, TechnicalSpecs } from '../types';
import { Plus, FileText, AlertTriangle, ArrowLeft, Sparkles, Calendar, ArrowRightLeft, DownloadCloud, Wrench, Phone, Droplet, Gauge, Activity, Trash2, Bell, BellOff, Fuel, TrendingUp, ClipboardList, X, Save, ChevronDown, ChevronUp, CheckCircle2, Eye, ShieldCheck, Upload, PhoneCall, ExternalLink, Camera, FolderOpen, Edit2, Disc, Filter, Wind } from 'lucide-react';
import { getPersonalizedMaintenance, processFile } from '../services/geminiService';
import { requestNotificationPermission, sendLocalNotification } from '../services/notificationService';

interface DashboardScreenProps {
  user: User;
  car: Car; // The active car
  invoices: Invoice[];
  aiStatus: AIStatus;
  onBackToGarage: () => void;
  onAddInvoice: () => void;
  onSellCar: () => void;
  onBuyCar: () => void;
  onAssistance: () => void;
  onDeleteCar: () => void;
  onUpdateSpecs: (specs: TechnicalSpecs) => void; // Callback pour sauver les specs manuelles
  onUpdateCar: (car: Car) => void; // Callback pour sauver les infos générales (Assurance)
  onDeleteInvoice: (invoiceId: string) => void; // Callback suppression facture
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  user,
  car,
  invoices,
  aiStatus,
  onBackToGarage,
  onAddInvoice,
  onSellCar,
  onBuyCar,
  onAssistance,
  onDeleteCar,
  onUpdateSpecs,
  onUpdateCar,
  onDeleteInvoice
}) => {

  const [specs, setSpecs] = useState<ManufacturerSpecs | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [showTechSheet, setShowTechSheet] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showPhotoEditModal, setShowPhotoEditModal] = useState(false);
  const [showDocCenterModal, setShowDocCenterModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'maintenance' | 'fuel'>('maintenance');
  const [showAllHistory, setShowAllHistory] = useState(false);
  
  // State pour la visionneuse de document
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const hasNotifiedRef = useRef(false);
  const insuranceFileRef = useRef<HTMLInputElement>(null);

  // Refs pour l'édition des photos
  const grayCardRef = useRef<HTMLInputElement>(null);
  const frontPhotoRef = useRef<HTMLInputElement>(null);
  const backPhotoRef = useRef<HTMLInputElement>(null);
  const leftPhotoRef = useRef<HTMLInputElement>(null);
  const rightPhotoRef = useRef<HTMLInputElement>(null);
  const enginePhotoRef = useRef<HTMLInputElement>(null);

  // State local pour l'édition de la fiche technique
  const [techForm, setTechForm] = useState<TechnicalSpecs>({
    tireDimensions: car.specs?.tireDimensions || '',
    tirePressure: car.specs?.tirePressure || '',
    oilViscosity: car.specs?.oilViscosity || '',
    oilFilterRef: car.specs?.oilFilterRef || '',
    airFilterRef: car.specs?.airFilterRef || '',
    fuelFilterRef: car.specs?.fuelFilterRef || '',
    cabinFilterRef: car.specs?.cabinFilterRef || '',
    colorCode: car.specs?.colorCode || '',
    batteryRef: car.specs?.batteryRef || '',
    wiperRef: car.specs?.wiperRef || ''
  });

  // State local pour l'assurance
  const [insuranceForm, setInsuranceForm] = useState({
    contractNumber: car.insurance?.contractNumber || '',
    assistancePhone: car.insurance?.assistancePhone || '',
    greenCardUrl: car.insurance?.greenCardUrl || ''
  });

  const lastMileage = invoices.length > 0 ? Math.max(...invoices.map(i => i.km)) : car.initialKm;

  // Calcul Consommation
  const fuelInvoices = invoices.filter(i => i.type === 'fuel').sort((a, b) => a.km - b.km);
  let averageConsu = 0;
  if (fuelInvoices.length >= 2) {
    const minKm = fuelInvoices[0].km;
    const maxKm = fuelInvoices[fuelInvoices.length - 1].km;
    const relevantVolume = fuelInvoices.slice(1).reduce((acc, i) => acc + (i.volume || 0), 0);
    if (maxKm > minKm && relevantVolume > 0) {
      averageConsu = (relevantVolume / (maxKm - minKm)) * 100;
    }
  }

  // Filtrage par onglet et tri
  const filteredInvoices = invoices.filter(inv => inv.type === activeTab);
  const sortedInvoices = [...filteredInvoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const displayedInvoices = showAllHistory ? sortedInvoices : sortedInvoices.slice(0, 5);

  useEffect(() => {
    // Initialiser l'état des notifications basé sur la permission du navigateur
    if ("Notification" in window && Notification.permission === 'granted') {
      setNotifEnabled(true);
    }
  }, []);

  useEffect(() => {
    const loadSpecs = async () => {
      setSpecs(null);
      // Small delay to prevent flickering if API is fast
      const data = await getPersonalizedMaintenance(car, lastMileage);
      setSpecs(data);
    };
    loadSpecs();
  }, [car.id, lastMileage]); 

  useEffect(() => {
    // Mettre à jour le formulaire quand la voiture change (ou que l'IA a mis à jour les specs)
    setTechForm({
        tireDimensions: car.specs?.tireDimensions || '',
        tirePressure: car.specs?.tirePressure || '',
        oilViscosity: car.specs?.oilViscosity || '',
        oilFilterRef: car.specs?.oilFilterRef || '',
        airFilterRef: car.specs?.airFilterRef || '',
        fuelFilterRef: car.specs?.fuelFilterRef || '',
        cabinFilterRef: car.specs?.cabinFilterRef || '',
        colorCode: car.specs?.colorCode || '',
        batteryRef: car.specs?.batteryRef || '',
        wiperRef: car.specs?.wiperRef || ''
    });
    setInsuranceForm({
        contractNumber: car.insurance?.contractNumber || '',
        assistancePhone: car.insurance?.assistancePhone || '',
        greenCardUrl: car.insurance?.greenCardUrl || ''
    });
  }, [car]);

  useEffect(() => {
    if (aiStatus.status === 'success' || aiStatus.status === 'neutral') {
      hasNotifiedRef.current = false;
    }

    const checkAndNotify = async () => {
      if (hasNotifiedRef.current) return;
      
      if (aiStatus.status === 'critical' || aiStatus.status === 'warning') {
        if (notifEnabled) {
          sendLocalNotification(`⚠️ Alerte NSP : ${car.name}`, `${aiStatus.message}`);
          hasNotifiedRef.current = true;
        }
      }
      
      if (averageConsu > 8.5 && car.fuelType === 'diesel' && notifEnabled) {
         setTimeout(() => {
            sendLocalNotification(`⛽ Surconsommation Détectée`, `Votre moyenne est de ${averageConsu.toFixed(1)}L/100. Vérifiez la pression des pneus.`);
         }, 4000);
      }
    };
    checkAndNotify();
  }, [aiStatus, notifEnabled, car, averageConsu]);

  const toggleNotifications = async () => {
    if (notifEnabled) {
      setNotifEnabled(false);
    } else {
      const granted = await requestNotificationPermission();
      setNotifEnabled(granted);
      if (granted) {
        sendLocalNotification("Notifications Activées", "NSP Auto surveille votre véhicule en temps réel.");
      }
    }
  };

  const saveTechSpecs = () => {
    onUpdateSpecs(techForm);
    setShowTechSheet(false);
  };

  const saveInsurance = () => {
    const updatedCar = {
      ...car,
      insurance: {
        contractNumber: insuranceForm.contractNumber,
        assistancePhone: insuranceForm.assistancePhone,
        greenCardUrl: insuranceForm.greenCardUrl
      }
    };
    onUpdateCar(updatedCar);
    setShowInsuranceModal(false);
  };

  const handleInsuranceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        let resultUrl = '';
        if (file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            resultUrl = await new Promise((resolve) => {
                reader.onload = () => resolve(reader.result as string);
            });
        } else {
            resultUrl = await processFile(file);
        }
        setInsuranceForm(prev => ({ ...prev, greenCardUrl: resultUrl }));
      } catch (err) {
        alert("Erreur lors de l'import du fichier.");
      }
    }
  };

  const handlePhotoUpdate = async (e: React.ChangeEvent<HTMLInputElement>, field: 'grayCardUrl' | keyof Car['photos']) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const resultUrl = await processFile(file);
        let updatedCar = { ...car };
        
        if (field === 'grayCardUrl') {
            updatedCar.grayCardUrl = resultUrl;
        } else {
            updatedCar.photos = { ...updatedCar.photos, [field]: resultUrl };
        }
        onUpdateCar(updatedCar);
      } catch (err) {
        alert("Erreur lors de la mise à jour de la photo.");
      }
    }
  };

  // Helper pour l'icône de préconisation
  const getAlertIcon = (text: string) => {
    const t = text.toLowerCase();
    if(t.includes('huile') || t.includes('vidange')) return <Droplet size={14} className="text-yellow-500" />;
    if(t.includes('pneu') || t.includes('pression')) return <Gauge size={14} className="text-blue-500" />;
    if(t.includes('frein') || t.includes('plaquette')) return <AlertTriangle size={14} className="text-red-500" />;
    return <Activity size={14} className="text-nsp-primary" />;
  };

  // Helper pour ouvrir le document (download)
  const downloadDocument = (url: string, title: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `Autobook-${title.replace(/\s+/g, '_')}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-[100dvh] bg-nsp-bg pb-24 relative overflow-y-auto">
      {/* Header Navigation */}
      <header className="bg-nsp-card/90 backdrop-blur-md sticky top-0 z-40 border-b border-nsp-border px-4 py-4 flex items-center gap-4 pt-safe-top">
        <button 
          onClick={onBackToGarage}
          className="p-2 rounded-full bg-nsp-input hover:bg-nsp-primary hover:text-white text-nsp-sub transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
           <h2 className="text-lg font-bold text-white">{car.name}</h2>
           <p className="text-xs text-gray-500">Garage de {user.name}</p>
        </div>
        
        <button 
          onClick={toggleNotifications}
          className={`p-2 rounded-lg transition-colors ${notifEnabled ? 'text-nsp-success bg-green-900/20' : 'text-nsp-sub bg-nsp-input hover:bg-nsp-primary hover:text-white'}`}
          title={notifEnabled ? "Désactiver les notifications" : "Activer les notifications"}
        >
          {notifEnabled ? <Bell size={20} /> : <BellOff size={20} />}
        </button>

        <button 
          onClick={onDeleteCar} 
          className="p-2 text-nsp-sub hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
        
        {/* Car Identité Visuelle + Gestion Photos */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
             <div className="flex items-center gap-3">
                {/* Plaque Style */}
                <div className="bg-white px-3 py-1 rounded border-2 border-gray-300 shadow-sm flex items-center gap-2">
                    <div className="w-3 h-6 bg-blue-800 rounded-sm"></div>
                    <span className="text-black font-bold font-mono text-lg tracking-wider">{car.plate}</span>
                    <div className="w-3 h-6 bg-blue-800 rounded-sm relative"></div>
                </div>
             </div>
             <button 
                onClick={() => setShowPhotoEditModal(true)}
                className="text-xs text-nsp-primary font-bold flex items-center gap-1 hover:text-white transition-colors"
             >
                <Edit2 size={12} /> Gérer Photos
             </button>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-nsp-primary">{lastMileage.toLocaleString()} <span className="text-sm text-gray-500">km</span></div>
             <span className="text-xs text-gray-500 capitalize bg-nsp-input px-2 py-0.5 rounded">{car.fuelType}</span>
          </div>
        </div>

        {/* AI Mechanic Status */}
        <div className={`relative overflow-hidden rounded-2xl border p-6 transition-all shadow-xl ${
          aiStatus.status === 'critical' ? 'border-red-600 bg-gradient-to-r from-red-950 to-black' :
          aiStatus.status === 'warning' ? 'border-nsp-warning/50 bg-gradient-to-r from-nsp-card to-yellow-900/10' : 
          aiStatus.status === 'success' ? 'border-nsp-success/50 bg-gradient-to-r from-nsp-card to-green-900/10' :
          'border-gray-600 bg-gradient-to-r from-nsp-card to-gray-900/50' // Neutral handling
        }`}>
          <div className="flex items-start gap-4 relative z-10">
            <div className={`p-3 rounded-full ${
              aiStatus.status === 'critical' ? 'bg-red-600 text-white animate-pulse' :
              aiStatus.status === 'warning' ? 'bg-nsp-warning/20 text-nsp-warning' : 
              aiStatus.status === 'success' ? 'bg-nsp-success/20 text-nsp-success' :
              'bg-gray-700 text-gray-300' // Neutral icon
            }`}>
              <Sparkles size={24} />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold text-lg mb-1 ${
                aiStatus.status === 'critical' ? 'text-red-500' : 
                aiStatus.status === 'warning' ? 'text-nsp-warning' :
                aiStatus.status === 'success' ? 'text-nsp-success' :
                'text-white'
              }`}>
                {aiStatus.status === 'critical' ? 'ACTION REQUISE' : 
                 aiStatus.status === 'warning' ? 'ATTENTION REQUISE' : 
                 aiStatus.status === 'success' ? 'DIAGNOSTIC IA : OK' : 
                 'ANALYSE EN COURS'}
              </h3>
              <p className="text-gray-300 leading-relaxed text-sm">
                {aiStatus.message}
              </p>
            </div>
          </div>
        </div>

        {/* Consommation & Eco-Conduite Card (Visible only if data available) */}
        {averageConsu > 0 && (
           <div className="bg-nsp-card rounded-2xl border border-nsp-border p-5">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-white font-bold flex items-center gap-2">
                    <Fuel size={18} className="text-blue-500" /> Suivi Carburant
                 </h3>
              </div>
              <div className="flex items-center gap-6">
                 <div>
                    <p className="text-xs text-nsp-sub mb-1">Moyenne</p>
                    <p className="text-2xl font-bold text-white">{averageConsu.toFixed(1)} <span className="text-sm font-normal text-gray-500">L/100km</span></p>
                 </div>
                 <div className="h-10 w-px bg-gray-700"></div>
                 <div>
                    <p className="text-xs text-nsp-sub mb-1">Tendance</p>
                    <p className="text-sm font-bold text-green-400 flex items-center gap-1"><TrendingUp size={16} /> Stable</p>
                 </div>
                 <div className="h-10 w-px bg-gray-700"></div>
                 <div>
                    <p className="text-xs text-nsp-sub mb-1">Coût estimé</p>
                    <p className="text-sm font-bold text-white">{(averageConsu * 1.85).toFixed(2)} € / 100km</p>
                 </div>
              </div>
           </div>
        )}

        {/* PRECONISATIONS IA - NOUVEAU DESIGN */}
        <div className="bg-nsp-card rounded-2xl border border-nsp-border p-5 space-y-4">
          <div className="flex justify-between items-center">
             <h3 className="text-white font-bold flex items-center gap-2">
                <Wrench size={18} className="text-nsp-primary" /> Préconisations Constructeur
             </h3>
             <button 
                onClick={() => setShowTechSheet(true)}
                className="text-xs bg-nsp-input hover:bg-nsp-primary hover:text-white text-nsp-sub px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
             >
                <ClipboardList size={14} /> Fiche Technique
             </button>
          </div>
          
          {specs ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                {/* Pression Pneus */}
                <div className="bg-nsp-input rounded-xl border-l-4 border-blue-500 p-4 relative overflow-hidden">
                  <div className="absolute right-0 top-0 p-2 opacity-10">
                    <Gauge size={64} />
                  </div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Pression</p>
                  <p className="text-lg font-bold text-white leading-tight">{specs.tirePressure}</p>
                  <div className="mt-2 text-[10px] text-blue-400 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Vérifier à froid
                  </div>
                </div>

                {/* Huile Moteur */}
                <div className="bg-nsp-input rounded-xl border-l-4 border-yellow-500 p-4 relative overflow-hidden">
                  <div className="absolute right-0 top-0 p-2 opacity-10">
                    <Droplet size={64} />
                  </div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Huile Moteur</p>
                  <p className="text-lg font-bold text-white leading-tight">{specs.oilType}</p>
                  <div className="mt-2 text-[10px] text-yellow-500 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Norme Constructeur
                  </div>
                </div>
              </div>

              {/* Points de Vigilance - Liste */}
              <div className="bg-nsp-input rounded-xl border border-nsp-border p-4">
                 <h4 className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-3 flex items-center gap-2">
                   <Activity size={14} className="text-nsp-primary" /> Points de Vigilance (Kilométrage)
                 </h4>
                 <div className="space-y-2">
                    {specs.checkPoints.map((cp, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-nsp-bg/50 border border-nsp-border/30">
                         <div className="w-5 h-5 rounded-full bg-nsp-primary/20 text-nsp-primary flex items-center justify-center shrink-0">
                            {getAlertIcon(cp)}
                         </div>
                         <span className="text-sm text-gray-200">{cp}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-8 gap-2 text-nsp-sub text-sm animate-pulse">
              <Sparkles size={16} /> Recherche des données constructeurs...
            </div>
          )}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onAssistance}
            className="col-span-2 bg-nsp-primary hover:bg-red-600 rounded-xl p-4 flex items-center justify-center gap-3 transition-all shadow-lg shadow-red-900/20 group"
          >
            <Phone size={20} className="text-white" />
            <span className="font-bold text-white">ASSISTANCE & EXPERTS</span>
          </button>
          
          <button 
             onClick={() => setShowDocCenterModal(true)}
             className="col-span-1 bg-gray-800 border border-gray-700 hover:border-gray-500 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors group"
          >
             <FolderOpen size={24} className="text-yellow-500" />
             <span className="font-bold text-white text-xs text-center">MES DOCUMENTS</span>
          </button>

          <button 
             onClick={() => setShowInsuranceModal(true)}
             className="col-span-1 bg-blue-900/30 border border-blue-500/30 hover:bg-blue-900/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors group"
          >
            <ShieldCheck size={24} className="text-blue-400" />
            <span className="font-bold text-blue-100 group-hover:text-white text-xs text-center">ASSURANCE</span>
          </button>

          <button onClick={onSellCar} className="bg-nsp-card border border-nsp-border hover:border-nsp-primary/50 rounded-xl p-3 flex flex-col items-center justify-center gap-2">
            <ArrowRightLeft size={20} className="text-nsp-primary" />
            <span className="font-bold text-white text-xs">Vendre Véhicule</span>
          </button>
          <button onClick={onBuyCar} className="bg-nsp-card border border-nsp-border hover:border-nsp-success/50 rounded-xl p-3 flex flex-col items-center justify-center gap-2">
            <DownloadCloud size={20} className="text-nsp-success" />
            <span className="font-bold text-white text-xs">Importer Véhicule</span>
          </button>
        </div>

        {/* Invoices List with Tabs */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="text-lg font-semibold text-white">Historique</h3>
            {filteredInvoices.length > 5 && (
              <button 
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="text-xs text-nsp-primary font-bold flex items-center gap-1 hover:text-white transition-colors"
              >
                {showAllHistory ? 'Réduire' : `Voir tout (${filteredInvoices.length})`}
                {showAllHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>
          
          {/* Outils de filtrage (Tabs) */}
          <div className="bg-nsp-input p-1 rounded-lg flex gap-1">
             <button 
                onClick={() => { setActiveTab('maintenance'); setShowAllHistory(false); }}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'maintenance' ? 'bg-nsp-card text-white shadow' : 'text-gray-500'}`}
             >
                ENTRETIENS
             </button>
             <button 
                onClick={() => { setActiveTab('fuel'); setShowAllHistory(false); }}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'fuel' ? 'bg-nsp-card text-blue-400 shadow' : 'text-gray-500'}`}
             >
                CARBURANT
             </button>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="bg-nsp-input/30 rounded-xl p-8 border border-dashed border-nsp-border flex flex-col items-center text-center">
              <FileText className="text-nsp-sub opacity-50 mb-2" size={32} />
              <p className="text-nsp-sub text-sm">Aucun historique {activeTab === 'fuel' ? 'carburant' : 'entretien'}.</p>
              <p className="text-xs text-gray-600 mt-1">Cliquez sur + pour ajouter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedInvoices.map((inv) => (
                <div 
                    key={inv.id} 
                    className={`bg-nsp-card p-4 rounded-xl border border-nsp-border flex items-center justify-between hover:border-nsp-primary transition-colors cursor-pointer group ${inv.type === 'fuel' ? 'border-l-4 border-l-blue-500' : ''}`}
                    onClick={() => setViewingInvoice(inv)} // Ouverture du modal
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${inv.type === 'fuel' ? 'bg-blue-900/20 text-blue-400' : 'bg-nsp-input'}`}>
                      {inv.type === 'fuel' ? <Fuel size={20} /> : '🧾'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{inv.title}</h4>
                      <p className="text-xs text-nsp-sub truncate">
                        {inv.date} • {inv.km.toLocaleString()} km
                        {inv.type === 'fuel' && inv.volume && <span className="text-blue-400 ml-2">• {inv.volume}L</span>}
                      </p>
                      {/* Indicateur si specs détectées */}
                      {inv.detectedSpecs && Object.keys(inv.detectedSpecs).length > 0 && (
                         <p className="text-[10px] text-purple-400 flex items-center gap-1 mt-1">
                           <Sparkles size={10} /> Données techniques extraites
                         </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-1">
                        <div className={`${inv.type === 'fuel' ? 'text-blue-400' : 'text-nsp-success'} font-bold font-mono text-sm`}>
                            {inv.price} €
                        </div>
                        {inv.imageUrl && <Eye size={14} className="text-gray-600" />}
                    </div>
                    {/* BOUTON SUPPRIMER */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteInvoice(inv.id); }}
                        className="p-2 text-gray-600 hover:text-red-500 bg-nsp-input hover:bg-red-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* DOCUMENT VIEWER MODAL */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col animate-fade-in">
           {/* Header Viewer */}
           <div className="p-4 flex items-center justify-between bg-nsp-card border-b border-nsp-border pt-safe-top">
              <div>
                 <h3 className="text-white font-bold">{viewingInvoice.title}</h3>
                 <p className="text-xs text-gray-500">{viewingInvoice.date} • {viewingInvoice.price} €</p>
              </div>
              <div className="flex items-center gap-2">
                  {viewingInvoice.imageUrl && (
                      <button 
                        onClick={() => downloadDocument(viewingInvoice.imageUrl!, viewingInvoice.title)}
                        className="p-2 bg-blue-600 rounded-full text-white hover:bg-blue-500"
                        title="Ouvrir / Télécharger"
                      >
                        <ExternalLink size={20} />
                      </button>
                  )}
                  <button 
                    onClick={() => setViewingInvoice(null)}
                    className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20"
                  >
                    <X size={24} />
                  </button>
              </div>
           </div>

           {/* Content Viewer */}
           <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative">
              {viewingInvoice.imageUrl ? (
                viewingInvoice.imageUrl.startsWith('data:application/pdf') ? (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                        <FileText size={64} className="text-red-500" />
                        <p className="text-white">Document PDF</p>
                        <div className="w-full h-full bg-white rounded-lg overflow-hidden">
                            <iframe 
                                src={viewingInvoice.imageUrl} 
                                className="w-full h-full"
                                title="Document PDF"
                            />
                        </div>
                        <button 
                            onClick={() => downloadDocument(viewingInvoice.imageUrl!, viewingInvoice.title)}
                            className="bg-nsp-primary text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"
                        >
                            <DownloadCloud size={20} /> Ouvrir le PDF
                        </button>
                    </div>
                ) : (
                    <img 
                        src={viewingInvoice.imageUrl} 
                        alt="Document" 
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            // Fallback UI
                            const parent = (e.target as HTMLElement).parentElement;
                            if (parent) {
                                parent.innerHTML = `
                                    <div class="text-center space-y-4 text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                                        <p>Image introuvable ou corrompue.</p>
                                    </div>
                                `;
                            }
                        }}
                    />
                )
              ) : (
                <div className="text-center space-y-4 opacity-50">
                   <FileText size={64} className="mx-auto" />
                   <p className="text-white">Aucun document numérique associé.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* MODAL GESTION PHOTOS VEHICULE */}
      {showPhotoEditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-nsp-card w-full max-w-md rounded-2xl border border-nsp-border p-6 space-y-4 animate-scale-up shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><Camera size={24} /> Gérer les Photos</h3>
                    <button onClick={() => setShowPhotoEditModal(false)} className="p-2 bg-nsp-input rounded-full text-gray-400 hover:text-white"><X size={20}/></button>
                </div>
                
                {/* Inputs masqués */}
                <input type="file" ref={grayCardRef} className="hidden" accept="image/*" onChange={(e) => handlePhotoUpdate(e, 'grayCardUrl')} />
                <input type="file" ref={frontPhotoRef} className="hidden" accept="image/*" onChange={(e) => handlePhotoUpdate(e, 'front')} />
                <input type="file" ref={backPhotoRef} className="hidden" accept="image/*" onChange={(e) => handlePhotoUpdate(e, 'back')} />
                <input type="file" ref={leftPhotoRef} className="hidden" accept="image/*" onChange={(e) => handlePhotoUpdate(e, 'left')} />
                <input type="file" ref={rightPhotoRef} className="hidden" accept="image/*" onChange={(e) => handlePhotoUpdate(e, 'right')} />
                <input type="file" ref={enginePhotoRef} className="hidden" accept="image/*" onChange={(e) => handlePhotoUpdate(e, 'engine')} />

                {/* Carte Grise */}
                <div className="bg-nsp-input p-3 rounded-xl border border-nsp-border">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase">Carte Grise</span>
                        {car.grayCardUrl && <CheckCircle2 size={14} className="text-green-500" />}
                    </div>
                    <button onClick={() => grayCardRef.current?.click()} className="w-full h-24 bg-black/30 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600 hover:border-nsp-primary overflow-hidden relative">
                        {car.grayCardUrl ? <img src={car.grayCardUrl} className="w-full h-full object-cover" /> : <Upload className="text-gray-500" />}
                    </button>
                </div>

                {/* 4 Angles */}
                <div className="grid grid-cols-2 gap-3">
                    <div onClick={() => frontPhotoRef.current?.click()} className="aspect-video bg-nsp-input rounded-xl border border-nsp-border relative overflow-hidden flex items-center justify-center cursor-pointer hover:border-nsp-primary">
                        {car.photos.front ? <img src={car.photos.front} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500">AVANT</span>}
                    </div>
                    <div onClick={() => backPhotoRef.current?.click()} className="aspect-video bg-nsp-input rounded-xl border border-nsp-border relative overflow-hidden flex items-center justify-center cursor-pointer hover:border-nsp-primary">
                        {car.photos.back ? <img src={car.photos.back} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500">ARRIÈRE</span>}
                    </div>
                    <div onClick={() => leftPhotoRef.current?.click()} className="aspect-video bg-nsp-input rounded-xl border border-nsp-border relative overflow-hidden flex items-center justify-center cursor-pointer hover:border-nsp-primary">
                        {car.photos.left ? <img src={car.photos.left} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500">GAUCHE</span>}
                    </div>
                    <div onClick={() => rightPhotoRef.current?.click()} className="aspect-video bg-nsp-input rounded-xl border border-nsp-border relative overflow-hidden flex items-center justify-center cursor-pointer hover:border-nsp-primary">
                        {car.photos.right ? <img src={car.photos.right} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500">DROITE</span>}
                    </div>
                </div>

                {/* Moteur */}
                <button onClick={() => enginePhotoRef.current?.click()} className="w-full h-20 bg-nsp-input rounded-xl border border-nsp-border relative overflow-hidden flex items-center justify-center hover:border-nsp-primary">
                     {car.photos.engine ? <img src={car.photos.engine} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500 flex items-center gap-2"><Activity size={14}/> PHOTO MOTEUR</span>}
                </button>
            </div>
        </div>
      )}

      {/* MODAL CENTRE DE DOCUMENTS */}
      {showDocCenterModal && (
         <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col animate-fade-in">
             <div className="p-4 bg-nsp-card border-b border-nsp-border flex items-center justify-between pt-safe-top">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><FolderOpen size={24} className="text-yellow-500"/> Mes Documents</h2>
                <button onClick={() => setShowDocCenterModal(false)} className="p-2 bg-white/10 rounded-full text-white"><X size={24}/></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* Section Officielle */}
                <div>
                   <h3 className="text-xs text-gray-500 font-bold uppercase mb-3">Documents Officiels</h3>
                   <div className="grid grid-cols-2 gap-3">
                      {car.grayCardUrl ? (
                         <div onClick={() => setViewingInvoice({id:'gc', carId: car.id, type: 'maintenance', title: 'Carte Grise', date: '', km:0, price:0, imageUrl: car.grayCardUrl!})} className="bg-nsp-input p-3 rounded-xl border border-nsp-border flex flex-col items-center gap-2 cursor-pointer hover:bg-nsp-card">
                            <img src={car.grayCardUrl} className="w-full h-24 object-cover rounded-lg bg-black" />
                            <span className="text-xs font-bold text-white">Carte Grise</span>
                         </div>
                      ) : <div className="p-4 border border-dashed border-gray-700 rounded-xl text-center text-xs text-gray-500">Pas de Carte Grise</div>}

                      {car.insurance?.greenCardUrl ? (
                         <div onClick={() => setViewingInvoice({id:'ins', carId: car.id, type: 'maintenance', title: 'Assurance', date: '', km:0, price:0, imageUrl: car.insurance.greenCardUrl!})} className="bg-nsp-input p-3 rounded-xl border border-nsp-border flex flex-col items-center gap-2 cursor-pointer hover:bg-nsp-card">
                            {car.insurance.greenCardUrl.startsWith('data:application/pdf') ? <FileText size={48} className="text-green-500 my-4"/> : <img src={car.insurance.greenCardUrl} className="w-full h-24 object-cover rounded-lg bg-black" />}
                            <span className="text-xs font-bold text-white">Assurance</span>
                         </div>
                      ) : <div className="p-4 border border-dashed border-gray-700 rounded-xl text-center text-xs text-gray-500">Pas d'Assurance</div>}
                   </div>
                </div>

                {/* Section Photos Véhicule */}
                <div>
                    <h3 className="text-xs text-gray-500 font-bold uppercase mb-3">Photos Véhicule</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {['front', 'back', 'left', 'right', 'engine'].map((key) => {
                            const url = car.photos[key as keyof Car['photos']];
                            if(!url || typeof url !== 'string') return null;
                            return (
                                <img key={key} src={url} className="w-full aspect-square object-cover rounded-lg border border-gray-700" />
                            );
                        })}
                    </div>
                </div>

                {/* Section Factures */}
                <div>
                    <h3 className="text-xs text-gray-500 font-bold uppercase mb-3">Toutes les Factures ({invoices.length})</h3>
                    <div className="space-y-2">
                        {sortedInvoices.map(inv => (
                            <div key={inv.id} onClick={() => setViewingInvoice(inv)} className="bg-nsp-input p-3 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-nsp-card border border-transparent hover:border-nsp-primary">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${inv.type === 'fuel' ? 'bg-blue-900/30 text-blue-400' : 'bg-nsp-primary/20 text-nsp-primary'}`}>
                                    {inv.type === 'fuel' ? <Fuel size={14}/> : <FileText size={14}/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-bold truncate">{inv.title}</p>
                                    <p className="text-xs text-gray-500">{inv.date}</p>
                                </div>
                                <ArrowRightLeft size={14} className="text-gray-600"/>
                            </div>
                        ))}
                    </div>
                </div>

             </div>
         </div>
      )}

      {/* MODAL FICHE TECHNIQUE */}
      {showTechSheet && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-nsp-card w-full max-w-md rounded-2xl border border-nsp-border p-6 space-y-6 animate-scale-up shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ClipboardList className="text-nsp-primary" /> Fiche Technique
              </h3>
              <button onClick={() => setShowTechSheet(false)} className="p-2 bg-nsp-input rounded-full text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30 text-sm text-blue-300 flex items-start gap-3">
               <Sparkles className="shrink-0 mt-0.5" size={16} />
               <p>Ces données sont extraites automatiquement de vos factures par l'IA ou remplies manuellement. Elles aident à l'entretien.</p>
            </div>

            <div className="space-y-6">
              
              {/* SECTION PNEUMATIQUES */}
              <div>
                  <h4 className="text-xs text-gray-500 font-bold uppercase mb-3 border-b border-gray-700 pb-1">Pneumatiques</h4>
                  <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-nsp-sub mb-1 uppercase">Dimensions Pneus</label>
                        <div className="relative">
                          <Disc className="absolute left-3 top-3 text-nsp-sub" size={18} />
                          <input 
                              type="text" 
                              value={techForm.tireDimensions}
                              onChange={e => setTechForm({...techForm, tireDimensions: e.target.value})}
                              placeholder="Ex: 205/55 R16 91V"
                              className="w-full bg-nsp-input pl-10 rounded-lg py-2.5 text-white focus:border-nsp-primary border border-transparent outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-nsp-sub mb-1 uppercase">Pression (Bar)</label>
                        <div className="relative">
                          <Gauge className="absolute left-3 top-3 text-nsp-sub" size={18} />
                          <input 
                              type="text" 
                              value={techForm.tirePressure}
                              onChange={e => setTechForm({...techForm, tirePressure: e.target.value})}
                              placeholder="Ex: 2.5 AV / 2.4 AR"
                              className="w-full bg-nsp-input pl-10 rounded-lg py-2.5 text-white focus:border-nsp-primary border border-transparent outline-none"
                          />
                        </div>
                      </div>
                  </div>
              </div>

              {/* SECTION MOTEUR & FLUIDES */}
              <div>
                  <h4 className="text-xs text-gray-500 font-bold uppercase mb-3 border-b border-gray-700 pb-1">Moteur & Fluides</h4>
                  <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-nsp-sub mb-1 uppercase">Huile Moteur</label>
                        <div className="relative">
                          <Droplet className="absolute left-3 top-3 text-nsp-sub" size={18} />
                          <input 
                              type="text" 
                              value={techForm.oilViscosity}
                              onChange={e => setTechForm({...techForm, oilViscosity: e.target.value})}
                              placeholder="Ex: 5W30 Synthétique"
                              className="w-full bg-nsp-input pl-10 rounded-lg py-2.5 text-white focus:border-nsp-primary border border-transparent outline-none"
                          />
                        </div>
                      </div>
                  </div>
              </div>

              {/* SECTION FILTRES */}
              <div>
                  <h4 className="text-xs text-gray-500 font-bold uppercase mb-3 border-b border-gray-700 pb-1">Filtres (Références)</h4>
                  <div className="grid grid-cols-1 gap-3">
                      <div className="relative">
                          <Filter className="absolute left-3 top-3 text-nsp-sub" size={18} />
                          <input 
                              type="text" 
                              value={techForm.oilFilterRef}
                              onChange={e => setTechForm({...techForm, oilFilterRef: e.target.value})}
                              placeholder="Filtre à Huile (Ex: Purflux L398)"
                              className="w-full bg-nsp-input pl-10 rounded-lg py-2.5 text-white focus:border-nsp-primary border border-transparent outline-none text-xs"
                          />
                      </div>
                      <div className="relative">
                          <Wind className="absolute left-3 top-3 text-nsp-sub" size={18} />
                          <input 
                              type="text" 
                              value={techForm.airFilterRef}
                              onChange={e => setTechForm({...techForm, airFilterRef: e.target.value})}
                              placeholder="Filtre à Air (Ex: Mann C2512)"
                              className="w-full bg-nsp-input pl-10 rounded-lg py-2.5 text-white focus:border-nsp-primary border border-transparent outline-none text-xs"
                          />
                      </div>
                      <div className="relative">
                          <Fuel className="absolute left-3 top-3 text-nsp-sub" size={18} />
                          <input 
                              type="text" 
                              value={techForm.fuelFilterRef}
                              onChange={e => setTechForm({...techForm, fuelFilterRef: e.target.value})}
                              placeholder="Filtre Carburant (Ex: Bosch F026)"
                              className="w-full bg-nsp-input pl-10 rounded-lg py-2.5 text-white focus:border-nsp-primary border border-transparent outline-none text-xs"
                          />
                      </div>
                      <div className="relative">
                          <Activity className="absolute left-3 top-3 text-nsp-sub" size={18} />
                          <input 
                              type="text" 
                              value={techForm.cabinFilterRef}
                              onChange={e => setTechForm({...techForm, cabinFilterRef: e.target.value})}
                              placeholder="Filtre Habitacle (Ex: Valeo 715)"
                              className="w-full bg-nsp-input pl-10 rounded-lg py-2.5 text-white focus:border-nsp-primary border border-transparent outline-none text-xs"
                          />
                      </div>
                  </div>
              </div>

              {/* SECTION DIVERS */}
              <div>
                  <h4 className="text-xs text-gray-500 font-bold uppercase mb-3 border-b border-gray-700 pb-1">Autres</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-nsp-sub mb-1 uppercase">Code Couleur</label>
                      <input 
                        type="text" 
                        value={techForm.colorCode}
                        onChange={e => setTechForm({...techForm, colorCode: e.target.value})}
                        placeholder="Ex: EWP"
                        className="w-full bg-nsp-input px-3 rounded-lg py-2.5 text-white focus:border-nsp-primary border border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-nsp-sub mb-1 uppercase">Batterie</label>
                      <input 
                        type="text" 
                        value={techForm.batteryRef}
                        onChange={e => setTechForm({...techForm, batteryRef: e.target.value})}
                        placeholder="Ex: 70Ah"
                        className="w-full bg-nsp-input px-3 rounded-lg py-2.5 text-white focus:border-nsp-primary border border-transparent outline-none"
                      />
                    </div>
                  </div>
              </div>
            </div>

            <button 
              onClick={saveTechSpecs}
              className="w-full bg-nsp-primary hover:bg-red-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Save size={20} /> ENREGISTRER LA FICHE
            </button>
          </div>
        </div>
      )}

      {/* MODAL ASSURANCE */}
      {showInsuranceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-nsp-card w-full max-w-md rounded-2xl border border-nsp-border p-6 space-y-6 animate-scale-up shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="text-blue-400" /> Mon Assurance
              </h3>
              <button onClick={() => setShowInsuranceModal(false)} className="p-2 bg-nsp-input rounded-full text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-nsp-sub mb-1 uppercase">Numéro de Contrat</label>
                <div className="relative">
                   <FileText className="absolute left-3 top-3 text-nsp-sub" size={18} />
                   <input 
                     type="text" 
                     value={insuranceForm.contractNumber}
                     onChange={e => setInsuranceForm({...insuranceForm, contractNumber: e.target.value})}
                     placeholder="Ex: A12345678"
                     className="w-full bg-nsp-input pl-10 rounded-lg py-2.5 text-white focus:border-blue-500 border border-transparent outline-none"
                   />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-nsp-sub mb-1 uppercase">Téléphone Assistance</label>
                <div className="flex gap-2">
                   <div className="relative flex-1">
                      <Phone className="absolute left-3 top-3 text-nsp-sub" size={18} />
                      <input 
                        type="tel" 
                        value={insuranceForm.assistancePhone}
                        onChange={e => setInsuranceForm({...insuranceForm, assistancePhone: e.target.value})}
                        placeholder="Ex: 01 23 45 67 89"
                        className="w-full bg-nsp-input pl-10 rounded-lg py-2.5 text-white focus:border-blue-500 border border-transparent outline-none"
                      />
                   </div>
                   {insuranceForm.assistancePhone && (
                     <button onClick={() => window.open(`tel:${insuranceForm.assistancePhone}`)} className="bg-green-600 text-white p-2.5 rounded-lg">
                        <PhoneCall size={20} />
                     </button>
                   )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-nsp-sub mb-2 uppercase">Carte Verte / Mémo Véhicule</label>
                <input 
                   type="file" 
                   ref={insuranceFileRef} 
                   onChange={handleInsuranceFile} 
                   accept="image/*,application/pdf"
                   className="hidden" 
                />
                
                {insuranceForm.greenCardUrl ? (
                   <div className="space-y-2">
                      <div className="relative h-32 w-full bg-nsp-input rounded-xl overflow-hidden border border-blue-500/50 group">
                         {insuranceForm.greenCardUrl.startsWith('data:application/pdf') ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                               <FileText size={32} />
                               <span className="text-xs mt-2">Document PDF</span>
                            </div>
                         ) : (
                            <img src={insuranceForm.greenCardUrl} className="w-full h-full object-cover" />
                         )}
                         <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             <button onClick={() => insuranceFileRef.current?.click()} className="p-2 bg-white rounded-full text-black"><Upload size={16}/></button>
                             <button 
                                onClick={() => setViewingInvoice({
                                    id: 'insurance', 
                                    carId: car.id, 
                                    type: 'maintenance', 
                                    title: 'Carte Verte', 
                                    date: new Date().toISOString().split('T')[0], 
                                    km: 0, 
                                    price: 0, 
                                    imageUrl: insuranceForm.greenCardUrl
                                })} 
                                className="p-2 bg-blue-500 rounded-full text-white"
                             >
                                <Eye size={16}/>
                             </button>
                         </div>
                      </div>
                      <p className="text-xs text-green-400 flex items-center gap-1 justify-center"><CheckCircle2 size={12}/> Document enregistré</p>
                   </div>
                ) : (
                   <button 
                     onClick={() => insuranceFileRef.current?.click()}
                     className="w-full h-24 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors bg-nsp-input"
                   >
                      <Upload size={24} />
                      <span className="text-xs font-bold">Scanner ou Importer</span>
                   </button>
                )}
              </div>
            </div>

            <button 
              onClick={saveInsurance}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
            >
              <Save size={20} /> ENREGISTRER
            </button>
          </div>
        </div>
      )}

      {/* Floating Add Button */}
      <div className="fixed bottom-8 right-8 z-30">
        <button 
          onClick={onAddInvoice}
          className="bg-nsp-primary hover:bg-red-600 text-white w-14 h-14 rounded-full shadow-lg shadow-red-900/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        >
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
};