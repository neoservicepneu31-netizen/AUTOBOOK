
import React, { useEffect, useState, useRef } from 'react';
import { User, Car, Invoice, AIStatus, ManufacturerSpecs, TechnicalSpecs } from '../types';
import { Plus, FileText, AlertTriangle, ArrowLeft, Sparkles, Calendar, Gauge, Droplet, CheckCircle2, ShieldCheck, PhoneCall, FolderOpen, Bell, BellOff, Info, Wind, ChevronRight, Wrench } from 'lucide-react';
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
  user, car, invoices, aiStatus: initialAiStatus, onBackToGarage, onAddInvoice, onAssistance, onDeleteInvoice
}) => {
  const [specs, setSpecs] = useState<ManufacturerSpecs | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // Recalcul proactif complet
  const proactiveStatus = calculateMaintenanceStatus(car, invoices);
  const hasNotifiedRef = useRef(false);
  const lastMileage = invoices.length > 0 ? Math.max(...invoices.map(i => i.km)) : car.initialKm;

  useEffect(() => {
    if ("Notification" in window && Notification.permission === 'granted') setNotifEnabled(true);
    const loadSpecs = async () => {
      const data = await getPersonalizedMaintenance(car, lastMileage);
      setSpecs(data);
    };
    loadSpecs();
  }, [car.id, lastMileage]);

  useEffect(() => {
    if (proactiveStatus.status === 'critical' || proactiveStatus.status === 'warning') {
      if (notifEnabled && !hasNotifiedRef.current) {
        sendLocalNotification(`⚠️ NSP ALERT : ${car.plate}`, proactiveStatus.message);
        hasNotifiedRef.current = true;
      }
    }
  }, [proactiveStatus, notifEnabled]);

  const toggleNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifEnabled(granted);
    if (granted) alert("Notifications activées pour vos rappels mensuels.");
  };

  return (
    <div className="min-h-[100dvh] bg-nsp-bg pb-24 relative overflow-y-auto">
      <header className="bg-nsp-card/90 backdrop-blur-md sticky top-0 z-40 border-b border-nsp-border px-4 py-4 flex items-center gap-4 pt-safe-top">
        <button onClick={onBackToGarage} className="p-2 rounded-full bg-nsp-input text-nsp-sub"><ArrowLeft size={20} /></button>
        <div className="flex-1">
           <h2 className="text-lg font-bold text-white">{car.name}</h2>
           <p className="text-[10px] text-nsp-primary font-black tracking-widest uppercase">{car.plate}</p>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={toggleNotifications} className={`p-2 rounded-lg transition-colors ${notifEnabled ? 'text-green-500 bg-green-500/10' : 'text-gray-500 bg-nsp-input'}`}>
                {notifEnabled ? <Bell size={20} /> : <BellOff size={20} />}
            </button>
        </div>
      </header>

      <main className="p-5 max-w-4xl mx-auto space-y-6 animate-fade-in">
        
        {/* INDICATEURS DE CONFORMITÉ RAPIDE */}
        <div className="grid grid-cols-3 gap-3">
            <div className="bg-nsp-card border border-nsp-border rounded-2xl p-3 flex flex-col items-center text-center">
                <div className={`p-2 rounded-xl mb-2 ${proactiveStatus.alerts.includes('REVISION') ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                    <Wrench size={18}/>
                </div>
                <span className="text-[9px] text-gray-500 font-black uppercase mb-1">Entretien</span>
                <span className={`text-[10px] font-bold ${proactiveStatus.alerts.includes('REVISION') ? 'text-red-500' : 'text-green-500'}`}>
                    {proactiveStatus.alerts.includes('REVISION') ? 'À FAIRE' : 'OK'}
                </span>
            </div>
            <div className="bg-nsp-card border border-nsp-border rounded-2xl p-3 flex flex-col items-center text-center">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl mb-2">
                    <Gauge size={18}/>
                </div>
                <span className="text-[9px] text-gray-500 font-black uppercase mb-1">Pneus</span>
                <span className="text-[10px] font-bold text-white">{specs?.tirePressure || '2.4 bar'}</span>
            </div>
            <div className="bg-nsp-card border border-nsp-border rounded-2xl p-3 flex flex-col items-center text-center">
                <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-xl mb-2">
                    <Droplet size={18}/>
                </div>
                <span className="text-[9px] text-gray-500 font-black uppercase mb-1">Huile</span>
                <span className="text-[10px] font-bold text-white">{specs?.oilType || '5W30'}</span>
            </div>
        </div>

        {/* ANALYSE IA PROACTIVE */}
        <div className={`relative overflow-hidden rounded-3xl border p-6 transition-all shadow-xl ${
          proactiveStatus.status === 'critical' ? 'border-red-600 bg-red-950/20' :
          proactiveStatus.status === 'warning' ? 'border-yellow-500/30 bg-yellow-900/10' : 
          'border-nsp-success/30 bg-green-900/10'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl ${proactiveStatus.status === 'critical' ? 'bg-red-600 text-white animate-pulse' : 'bg-nsp-input text-nsp-primary'}`}>
              <Sparkles size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-white text-[10px] uppercase tracking-widest mb-1">Diagnostic Proactif NSP</h3>
              <p className="text-gray-300 leading-relaxed text-sm font-bold">{proactiveStatus.message}</p>
            </div>
          </div>
          
          {proactiveStatus.pendingTasks.length > 0 && (
            <div className="mt-5 space-y-2">
               {proactiveStatus.pendingTasks.map(task => (
                 <div key={task.id} className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                    <div className={task.severity === 'high' ? 'text-red-500' : 'text-nsp-primary'}>
                       {task.severity === 'high' ? <AlertTriangle size={16}/> : <Info size={16}/>}
                    </div>
                    <span className="text-xs text-white font-bold">{task.label}</span>
                    <ChevronRight size={14} className="ml-auto text-gray-600" />
                 </div>
               ))}
            </div>
          )}
        </div>

        {/* GUIDE TECHNIQUE CONFORMITÉ */}
        {specs && (
          <div className="bg-gradient-to-br from-nsp-card to-black border border-nsp-border rounded-3xl p-6">
            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
               <ShieldCheck size={18} className="text-green-500" /> Guide de Conformité
            </h3>
            <div className="space-y-4">
               {specs.checkPoints.map((point, idx) => (
                 <div key={idx} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-nsp-input border border-nsp-border flex items-center justify-center text-nsp-primary font-black text-xs shrink-0">{idx+1}</div>
                    <p className="text-xs text-gray-300 leading-relaxed font-medium">{point}</p>
                 </div>
               ))}
            </div>
            <div className="mt-6 p-4 bg-nsp-primary/5 rounded-2xl border border-nsp-primary/20">
               <p className="text-[10px] text-nsp-primary font-black uppercase tracking-widest mb-1">L'avis de l'expert NSP</p>
               <p className="text-[11px] text-gray-400 italic">"Vérifier ses niveaux chaque mois et la pression de ses pneus prolonge la durée de vie de votre {car.name} de 30%."</p>
            </div>
          </div>
        )}

        {/* SERVICES GRID */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={onAssistance} className="col-span-2 bg-nsp-primary text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-red-900/20 group">
            <PhoneCall size={20} className="group-hover:scale-110 transition-transform" /> Assistance Expert NSP 24/7
          </button>
          <button className="bg-nsp-card border border-nsp-border p-4 rounded-2xl flex flex-col items-center gap-2">
            <FolderOpen size={24} className="text-yellow-500" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Documents</span>
          </button>
          <button className="bg-nsp-card border border-nsp-border p-4 rounded-2xl flex flex-col items-center gap-2">
            <Wind size={24} className="text-blue-500" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Niveaux / Air</span>
          </button>
        </div>

        {/* HISTORIQUE D'ENTRETIEN */}
        <div className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">Historique Certifié</h3>
            <button onClick={onAddInvoice} className="text-nsp-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-1"><Plus size={14}/> Ajouter</button>
          </div>
          <div className="space-y-2">
            {invoices.length === 0 ? (
                <div className="p-10 border-2 border-dashed border-nsp-border rounded-3xl text-center">
                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Aucune facture scannée</p>
                </div>
            ) : (
                invoices.slice(0, 5).map(inv => (
                    <div key={inv.id} onClick={() => setViewingInvoice(inv)} className="bg-nsp-card p-4 rounded-2xl border border-nsp-border flex items-center justify-between group cursor-pointer hover:border-nsp-primary transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-nsp-input flex items-center justify-center text-nsp-primary"><FileText size={18}/></div>
                            <div>
                                <h4 className="text-white font-bold text-sm uppercase truncate max-w-[150px]">{inv.title}</h4>
                                <p className="text-[10px] text-gray-500 font-mono">{inv.date} • {inv.km.toLocaleString()} KM</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-white font-black text-sm">{inv.price}€</p>
                            <span className="text-[8px] text-nsp-success font-black uppercase flex items-center gap-0.5"><CheckCircle2 size={8}/> Validé</span>
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-6 z-50">
          <button onClick={onAddInvoice} className="w-14 h-14 bg-nsp-primary rounded-full shadow-2xl shadow-red-900/50 flex items-center justify-center text-white active:scale-90 transition-transform">
              <Plus size={32} />
          </button>
      </div>

      {/* MODAL VIEWING INVOICE (Simple Overlay) */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col p-6 animate-fade-in">
           <header className="flex justify-between items-center mb-6">
              <button onClick={() => setViewingInvoice(null)} className="p-2 bg-nsp-input rounded-full text-white"><ArrowLeft size={24}/></button>
              <h3 className="text-white font-bold">Détail Document</h3>
              <button onClick={() => { if(confirm('Supprimer ?')) { onDeleteInvoice(viewingInvoice.id); setViewingInvoice(null); } }} className="p-2 text-red-500"><AlertTriangle size={24}/></button>
           </header>
           <div className="flex-1 overflow-y-auto rounded-3xl bg-white/5 p-4">
              {viewingInvoice.imageUrl ? (
                <img src={viewingInvoice.imageUrl} className="w-full rounded-2xl mb-6 shadow-2xl" alt="Document" />
              ) : (
                <div className="w-full aspect-video bg-nsp-input rounded-2xl flex items-center justify-center mb-6"><FileText size={64} className="text-gray-700"/></div>
              )}
              <div className="space-y-4">
                 <div className="bg-nsp-input p-4 rounded-xl border border-nsp-border">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Désignation</p>
                    <p className="text-white font-bold">{viewingInvoice.title}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-nsp-input p-4 rounded-xl border border-nsp-border">
                       <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Montant</p>
                       <p className="text-white font-bold">{viewingInvoice.price} €</p>
                    </div>
                    <div className="bg-nsp-input p-4 rounded-xl border border-nsp-border">
                       <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Kilométrage</p>
                       <p className="text-white font-bold">{viewingInvoice.km.toLocaleString()} KM</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
