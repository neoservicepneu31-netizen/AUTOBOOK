
import React, { useEffect, useState, useRef } from 'react';
import { User, Car, Invoice, AIStatus, ManufacturerSpecs, TechnicalSpecs } from '../types';
import { Plus, FileText, AlertTriangle, ArrowLeft, Sparkles, Calendar, Gauge, Droplet, CheckCircle2, ShieldCheck, PhoneCall, FolderOpen, Bell, BellOff, Info, Wind, ChevronRight, Wrench, HardDrive, Cpu, Battery, Settings2, Zap, LayoutDashboard, Database } from 'lucide-react';
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

  const proactiveStatus = calculateMaintenanceStatus(car, invoices);
  const lastMileage = invoices.length > 0 ? Math.max(...invoices.map(i => i.km)) : car.initialKm;

  useEffect(() => {
    if ("Notification" in window && Notification.permission === 'granted') setNotifEnabled(true);
    const loadSpecs = async () => {
      const data = await getPersonalizedMaintenance(car, lastMileage);
      setSpecs(data);
    };
    loadSpecs();
  }, [car.id, lastMileage]);

  const toggleNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifEnabled(granted);
    if (granted) {
      sendLocalNotification("✅ AUTOBOOK ACTIVE", "Liaison smartphone confirmée.");
    }
  };

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
           className={`p-2.5 rounded-2xl transition-all ${notifEnabled ? 'text-nsp-primary bg-nsp-primary/10 border border-nsp-primary/20' : 'text-gray-600 bg-nsp-input border border-transparent'}`}
        >
          {notifEnabled ? <Bell size={20} /> : <BellOff size={20} />}
        </button>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-8 animate-fade-in">
        
        {/* STATS RAPIDES DESIGN NSP */}
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

        {/* AI STATUS BANNER */}
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
                    <div key={inv.id} onClick={() => setViewingInvoice(inv)} className="bg-nsp-card p-5 rounded-3xl border border-nsp-border flex items-center justify-between hover:border-nsp-primary transition-all cursor-pointer shadow-lg group">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-nsp-input flex items-center justify-center text-nsp-primary group-hover:scale-110 transition-transform">
                               <FileText size={20}/>
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

      <div className="fixed bottom-10 right-8 z-50">
          <button onClick={onAddInvoice} className="w-20 h-20 bg-nsp-primary rounded-[2rem] shadow-[0_20px_40px_rgba(230,57,70,0.4)] flex items-center justify-center text-white active:scale-90 transition-transform">
              <Plus size={40} />
          </button>
      </div>

      {viewingInvoice && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col p-8 animate-fade-in overflow-y-auto">
           <header className="flex justify-between items-center mb-8 pt-safe-top">
              <button onClick={() => setViewingInvoice(null)} className="p-3 bg-nsp-input rounded-2xl text-white"><ArrowLeft size={24}/></button>
              <h3 className="text-white font-black text-xs uppercase tracking-widest">Document Certifié</h3>
              <div className="w-12"></div>
           </header>
           
           <div className="space-y-6">
              {viewingInvoice.imageUrl && (
                <div className="rounded-[2rem] overflow-hidden shadow-2xl border border-white/5">
                   <img src={viewingInvoice.imageUrl} className="w-full object-contain max-h-[50vh]" alt="Facture" />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-nsp-input p-6 rounded-3xl border border-nsp-border">
                    <p className="text-[9px] text-gray-500 uppercase font-black mb-1">Montant</p>
                    <p className="text-white font-black text-2xl">{viewingInvoice.price}€</p>
                 </div>
                 <div className="bg-nsp-input p-6 rounded-3xl border border-nsp-border">
                    <p className="text-[9px] text-gray-500 uppercase font-black mb-1">Kilométrage</p>
                    <p className="text-white font-black text-2xl">{viewingInvoice.km.toLocaleString()}</p>
                 </div>
              </div>

              <div className="bg-nsp-input p-6 rounded-3xl border border-nsp-border">
                 <p className="text-[9px] text-gray-500 uppercase font-black mb-2">Analyse Technique Détectée</p>
                 <div className="space-y-2">
                    {viewingInvoice.detectedSpecs && Object.entries(viewingInvoice.detectedSpecs).map(([key, val]) => val && (
                      <div key={key} className="flex justify-between border-b border-white/5 pb-2 last:border-0">
                         <span className="text-[10px] text-gray-400 font-bold uppercase">{key}</span>
                         <span className="text-[10px] text-white font-black">{val}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <button 
                onClick={() => { if(confirm('Supprimer ce document ?')) { onDeleteInvoice(viewingInvoice.id); setViewingInvoice(null); } }} 
                className="w-full text-red-500 font-black text-[10px] uppercase tracking-widest py-4 border border-red-500/20 rounded-2xl"
              >
                Supprimer du Garage
              </button>
           </div>
        </div>
      )}
    </div>
  );
};
