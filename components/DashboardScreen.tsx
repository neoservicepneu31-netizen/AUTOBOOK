
import React, { useEffect, useState } from 'react';
import { User, Car, Invoice, AIStatus, ManufacturerSpecs, TechnicalSpecs } from '../types';
import { Plus, FileText, ArrowLeft, Sparkles, Gauge, Droplet, ShieldCheck, PhoneCall, Bell, BellOff, X, Trash2, ZoomIn, Download, Wrench, Cpu, Database, AlertCircle, ChevronRight, Settings } from 'lucide-react';
import { getPersonalizedMaintenance } from '../services/geminiService';
import { requestNotificationPermission, sendLocalNotification } from '../services/notificationService';
import { calculateMaintenanceStatus } from '../services/mechanicRules';

interface DashboardScreenProps {
  user: User;
  car: Car;
  invoices: Invoice[];
  aiStatus: AIStatus;
  onBackToGarage: () => void;
  onAddInvoice: () => void;
  onSellCar: () => void;
  onBuyCar: () => void;
  onAssistance: () => void;
  onDeleteCar: () => void;
  onUpdateSpecs: (specs: TechnicalSpecs) => void;
  onUpdateCar: (car: Car) => void;
  onDeleteInvoice: (invoiceId: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  user, car, invoices, onBackToGarage, onAddInvoice, onAssistance, onDeleteInvoice
}) => {
  const [specs, setSpecs] = useState<ManufacturerSpecs | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const proactiveStatus = calculateMaintenanceStatus(car, invoices);
  const lastMileage = invoices.length > 0 ? Math.max(...invoices.map(i => i.km)) : car.initialKm;

  useEffect(() => {
    // Vérification initiale de la permission système
    if ("Notification" in window) {
      setNotifEnabled(Notification.permission === 'granted');
    }
    
    const loadSpecs = async () => {
      const data = await getPersonalizedMaintenance(car, lastMileage);
      setSpecs(data);
    };
    loadSpecs();
  }, [car.id, lastMileage]);

  const toggleNotifications = async () => {
    if (notifEnabled) {
      setNotifEnabled(false);
      // On ne peut pas révoquer au niveau OS via JS, mais on désactive l'intérêt applicatif
    } else {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotifEnabled(true);
        sendLocalNotification("✅ AUTOBOOK CONNECTÉ", "Les alertes d'entretien sont désormais actives sur votre smartphone.");
      } else {
        alert("Permission refusée. Veuillez activer les notifications dans les réglages de votre navigateur.");
      }
    }
  };

  const isPDF = (url?: string) => url?.includes('application/pdf');

  const renderTechnicalMemory = () => {
    const carSpecs = car.specs || {};
    const hasAnySpec = Object.values(carSpecs).some(v => v);

    return (
      <div className="bg-nsp-card border border-nsp-border rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="bg-nsp-input p-5 border-b border-nsp-border flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-nsp-primary/10 p-2 rounded-xl">
               <Cpu size={18} className="text-nsp-primary" />
            </div>
            <h3 className="text-white font-black text-xs uppercase tracking-widest">Mémoire Technique IA</h3>
          </div>
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/5">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-[9px] text-gray-400 font-black uppercase">Synchronisé</span>
          </div>
        </div>
        
        <div className="p-6">
          {!hasAnySpec ? (
            <div className="py-8 text-center space-y-4">
               <Database className="mx-auto text-gray-800" size={40} />
               <p className="text-gray-500 text-[10px] uppercase font-black tracking-[0.2em]">Données à extraire</p>
               <button onClick={onAddInvoice} className="text-nsp-primary text-[10px] font-black uppercase underline">Scanner un document</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(carSpecs).map(([key, val]) => val && (
                <div key={key} className="bg-black/40 p-3 rounded-2xl border border-white/5 group transition-all">
                  <p className="text-[8px] text-gray-500 uppercase font-black mb-1">{key.replace(/Ref|Dimensions|Viscosity/g, '')}</p>
                  <p className="text-[11px] text-white font-bold">{val}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {hasAnySpec && (
          <div className="px-6 py-4 bg-nsp-primary/5 border-t border-nsp-border flex items-center gap-2">
             <ShieldCheck size={14} className="text-nsp-primary" />
             <span className="text-[9px] text-gray-400 font-bold uppercase">Références certifiées par extraction IA</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-nsp-bg pb-24 relative overflow-y-auto">
      <header className="bg-nsp-card/80 backdrop-blur-xl sticky top-0 z-40 border-b border-nsp-border px-5 py-5 flex items-center gap-4 pt-safe-top">
        <button onClick={onBackToGarage} className="p-2.5 rounded-2xl bg-nsp-input text-nsp-sub"><ArrowLeft size={20} /></button>
        <div className="flex-1">
           <h2 className="text-lg font-black text-white leading-none tracking-tight">{car.name}</h2>
           <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-nsp-primary font-black tracking-widest uppercase">{car.plate}</span>
              <span className="text-gray-700">•</span>
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{lastMileage.toLocaleString()} KM</span>
           </div>
        </div>
        <button 
           onClick={toggleNotifications}
           className={`p-2.5 rounded-2xl transition-all ${notifEnabled ? 'text-nsp-primary bg-nsp-primary/10 border border-nsp-primary/20 shadow-lg shadow-nsp-primary/20' : 'text-gray-600 bg-nsp-input border border-transparent'}`}
        >
          {notifEnabled ? <Bell size={20} /> : <BellOff size={20} />}
        </button>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-8 animate-fade-in">
        {/* STATS RAPIDES */}
        <div className="grid grid-cols-3 gap-3">
            <div className="bg-nsp-card border border-nsp-border rounded-3xl p-5 flex flex-col items-center text-center">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${proactiveStatus.alerts.includes('REVISION') ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                    <Wrench size={22}/>
                </div>
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Entretien</span>
            </div>
            <div className="bg-nsp-card border border-nsp-border rounded-3xl p-5 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-3">
                    <Gauge size={22}/>
                </div>
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Gonflage</span>
            </div>
            <div className="bg-nsp-card border border-nsp-border rounded-3xl p-5 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-yellow-500/20 text-yellow-400 rounded-2xl flex items-center justify-center mb-3">
                    <Droplet size={22}/>
                </div>
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Fluides</span>
            </div>
        </div>

        {/* ANALYSE IA GÉNÉRALE */}
        <div className={`relative overflow-hidden rounded-[2.5rem] border p-8 transition-all shadow-2xl ${
          proactiveStatus.status === 'critical' ? 'border-red-600 bg-red-950/20 shadow-red-900/10' :
          proactiveStatus.status === 'warning' ? 'border-yellow-500/30 bg-yellow-900/10' : 
          'border-nsp-success/30 bg-green-900/10 shadow-green-900/5'
        }`}>
          <div className="flex items-start gap-6">
            <div className={`p-4 rounded-[1.5rem] ${proactiveStatus.status === 'critical' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-nsp-input text-nsp-primary'}`}>
              <Sparkles size={28} />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-white text-[11px] uppercase tracking-[0.3em] mb-2">IA Diagnostic Global</h3>
              <p className="text-gray-300 leading-relaxed text-sm font-bold">{proactiveStatus.message}</p>
              <div className="mt-4 flex items-center gap-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-nsp-primary"></div>
                 <span className="text-[10px] text-white font-black uppercase tracking-widest">Expertise NSP 2.5</span>
              </div>
            </div>
          </div>
        </div>

        {/* NOUVEAU : CENTRE DE CONTRÔLE NOTIFICATIONS */}
        <div className="bg-nsp-card border border-nsp-border rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${notifEnabled ? 'bg-nsp-primary/10 text-nsp-primary' : 'bg-gray-800 text-gray-500'}`}>
                <Bell size={20} className={notifEnabled ? 'animate-tada' : ''} />
              </div>
              <div>
                <h3 className="text-white font-black text-xs uppercase tracking-widest">Alertes Intelligentes</h3>
                <p className="text-[9px] text-gray-500 uppercase font-black mt-1">Maintenance & Échéances</p>
              </div>
            </div>
            
            {/* TOGGLE SWITCH CUSTOM */}
            <button 
              onClick={toggleNotifications}
              className={`w-14 h-8 rounded-full relative transition-all duration-300 shadow-inner ${notifEnabled ? 'bg-nsp-primary' : 'bg-nsp-input'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 transform ${notifEnabled ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>
          <p className="text-[10px] text-gray-400 font-bold leading-relaxed pr-8">
            {notifEnabled 
              ? "Vous recevrez des notifications push critiques pour les révisions, le contrôle technique et les alertes de sécurité."
              : "Les alertes push sont désactivées. Vous devrez ouvrir l'application manuellement pour vérifier l'état de santé."
            }
          </p>
        </div>

        {renderTechnicalMemory()}

        <button onClick={onAssistance} className="w-full bg-white text-black p-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl hover:bg-gray-200 transition-colors">
          <PhoneCall size={20} /> Assistance 24/7
        </button>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
             <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">Chronologie</h3>
             <button className="text-[10px] text-gray-500 font-black uppercase underline">Voir Tout</button>
          </div>
          <div className="space-y-3">
            {invoices.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-nsp-border rounded-[2rem] text-center">
                    <p className="text-gray-700 text-[10px] font-black uppercase tracking-widest">Aucun document numérique</p>
                </div>
            ) : (
                invoices.slice(0, 3).map(inv => (
                    <div key={inv.id} onClick={() => { setViewingInvoice(inv); setImageError(false); }} className="bg-nsp-card p-5 rounded-3xl border border-nsp-border flex items-center justify-between hover:border-nsp-primary transition-all cursor-pointer shadow-lg group">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-nsp-input flex items-center justify-center text-nsp-primary group-hover:scale-110 transition-transform overflow-hidden">
                               {inv.imageUrl ? (
                                  isPDF(inv.imageUrl) ? <FileText size={20} /> : <img src={inv.imageUrl} className="w-full h-full object-cover opacity-60" />
                               ) : <FileText size={20}/>}
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm uppercase truncate max-w-[150px]">{inv.title}</h4>
                                <p className="text-[10px] text-gray-500 mt-1">{inv.date} • {inv.km.toLocaleString()} KM</p>
                            </div>
                        </div>
                        <div className="text-right">
                           <p className="text-white font-black text-sm">{inv.price}€</p>
                           <p className="text-[8px] text-green-500 font-black uppercase tracking-tighter mt-1">Classé IA</p>
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>
      </main>

      {/* BOUTON D'AJOUT FLOTTANT */}
      <div className="fixed bottom-10 right-8 z-50">
          <button onClick={onAddInvoice} className="w-20 h-20 bg-nsp-primary rounded-[2rem] shadow-[0_20px_40px_rgba(230,57,70,0.4)] flex items-center justify-center text-white active:scale-90 transition-transform">
              <Plus size={40} />
          </button>
      </div>

      {/* VISIONNEUSE */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex flex-col animate-fade-in overflow-y-auto">
          <header className="flex justify-between items-center p-6 pt-safe-top bg-black/40 border-b border-white/5 sticky top-0 z-50">
            <button onClick={() => { setViewingInvoice(null); setIsFullscreen(false); }} className="p-3 bg-nsp-input rounded-2xl text-white"><X size={24}/></button>
            <div className="text-center">
               <h3 className="text-white font-black text-xs uppercase tracking-widest">VISIONNEUSE HD</h3>
               <p className="text-[9px] text-nsp-primary font-black uppercase mt-1">Archive Numérique Certifiée</p>
            </div>
            <div className="w-12"></div>
          </header>

          <div className="max-w-md mx-auto w-full p-6 space-y-8 pb-32">
            <div className="space-y-4">
              <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-2">
                 Document Original Scanné
              </h4>
              <div 
                className={`rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative transition-all duration-500 ${isFullscreen ? 'fixed inset-4 z-[110] bg-black m-0 rounded-3xl' : 'bg-nsp-input'}`}
              >
                {isPDF(viewingInvoice.imageUrl) ? (
                  <div className="aspect-[3/4] flex flex-col items-center justify-center p-10 text-center gap-6">
                     <div className="w-24 h-24 bg-red-600/10 rounded-full flex items-center justify-center text-red-500 border border-red-500/20">
                        <FileText size={56} />
                     </div>
                     <div className="space-y-2">
                        <p className="text-white font-black text-sm uppercase">Fichier PDF</p>
                        <p className="text-gray-500 text-[10px] font-bold uppercase leading-relaxed">Document sécurisé en haute résolution.</p>
                     </div>
                     <a 
                       href={viewingInvoice.imageUrl} 
                       target="_blank"
                       rel="noopener noreferrer"
                       className="bg-nsp-primary text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl active:scale-95 transition-all"
                     >
                       <Download size={18} /> Télécharger / Voir PDF
                     </a>
                  </div>
                ) : viewingInvoice.imageUrl && !imageError ? (
                  <div className="relative cursor-zoom-in" onClick={() => setIsFullscreen(!isFullscreen)}>
                    <img 
                      src={viewingInvoice.imageUrl} 
                      className={`w-full transition-all duration-500 ${isFullscreen ? 'h-full object-contain' : 'h-auto max-h-[70vh] object-contain mx-auto block'}`} 
                      alt="Facture" 
                      onError={() => setImageError(true)}
                    />
                    {!isFullscreen && (
                      <div className="absolute bottom-4 right-4 bg-nsp-primary/90 p-3 rounded-full text-white backdrop-blur-md shadow-2xl">
                        <ZoomIn size={20} />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-nsp-primary/90 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl">
                      <ShieldCheck size={12}/> Certifié IA
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[3/4] flex flex-col items-center justify-center p-10 text-center gap-6 bg-nsp-input">
                     <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center text-gray-500">
                        <AlertCircle size={40} />
                     </div>
                     <div>
                        <p className="text-white font-black text-sm uppercase mb-2">Erreur d'affichage</p>
                        <p className="text-gray-500 text-[10px] font-bold uppercase">Le visuel est peut-être trop volumineux pour l'aperçu, mais il est archivé.</p>
                     </div>
                     <a 
                       href={viewingInvoice.imageUrl} 
                       download={`facture_${viewingInvoice.date}.jpg`}
                       className="bg-white text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl"
                     >
                       <Download size={16} /> Forcer le téléchargement
                     </a>
                  </div>
                )}
              </div>
            </div>

            {!isFullscreen && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-nsp-card p-6 rounded-[2rem] border border-nsp-border shadow-xl">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Montant Payé</p>
                    <p className="text-white font-black text-3xl">{viewingInvoice.price}€</p>
                  </div>
                  <div className="bg-nsp-card p-6 rounded-[2rem] border border-nsp-border shadow-xl">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Kilométrage</p>
                    <p className="text-white font-black text-3xl">{viewingInvoice.km.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-nsp-card p-8 rounded-[2.5rem] border border-nsp-border space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-3 relative z-10">
                      <Sparkles size={16} className="text-nsp-primary" />
                      <h5 className="text-[10px] text-white font-black uppercase tracking-widest">Rapport d'Extraction IA</h5>
                  </div>
                  <div className="space-y-4 relative z-10">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Date Document</span>
                        <span className="text-sm text-white font-bold">{viewingInvoice.date}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Garage / Enseigne</span>
                        <span className="text-sm text-white font-bold uppercase truncate max-w-[180px] text-right">{viewingInvoice.title}</span>
                      </div>
                      {viewingInvoice.detectedSpecs && Object.entries(viewingInvoice.detectedSpecs).map(([key, val]) => val && (
                        <div key={key} className="flex justify-between items-center border-b border-white/5 pb-3">
                          <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{key.replace(/Ref|Dimensions|Viscosity/g, '')}</span>
                          <span className="text-sm text-nsp-primary font-black uppercase">{val}</span>
                        </div>
                      ))}
                  </div>
                  <div className="pt-4 flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                     <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Données certifiées conformes par NSP IA</p>
                  </div>
                </div>

                <button 
                  onClick={() => { if(confirm('Supprimer définitivement ce document ?')) { onDeleteInvoice(viewingInvoice.id); setViewingInvoice(null); } }} 
                  className="w-full bg-red-600/10 text-red-500 font-black py-5 rounded-[2rem] text-[10px] uppercase tracking-widest border border-red-600/20 flex items-center justify-center gap-3 active:bg-red-600/20 transition-all shadow-xl"
                >
                  <Trash2 size={16} /> SUPPRIMER L'ARCHIVE
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
