
import React, { useEffect, useState, useMemo } from 'react';
import { User, Car, Invoice, AIStatus, ManufacturerSpecs, TechnicalSpecs } from '../types';
import { Plus, FileText, ArrowLeft, Sparkles, Gauge, Droplet, ShieldCheck, PhoneCall, Bell, BellOff, X, Trash2, ZoomIn, Download, Wrench, Cpu, Database, AlertCircle, Share2, Settings } from 'lucide-react';
import { getPersonalizedMaintenance, safeBase64ToBlobUrl } from '../services/geminiService';
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
  user, car, invoices, onBackToGarage, onAddInvoice, onAssistance, onDeleteInvoice, onSellCar
}) => {
  const [specs, setSpecs] = useState<ManufacturerSpecs | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const proactiveStatus = calculateMaintenanceStatus(car, invoices);
  const lastMileage = invoices.length > 0 ? Math.max(...invoices.map(i => i.km)) : car.initialKm;

  useEffect(() => {
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
    } else {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotifEnabled(true);
        sendLocalNotification("✅ AUTOBOOK CONNECTÉ", "Alertes actives.");
      }
    }
  };

  return (
    <div className="min-h-[100dvh] bg-nsp-bg pb-24 relative overflow-y-auto">
      <header className="bg-nsp-card/80 backdrop-blur-xl sticky top-0 z-40 border-b border-nsp-border px-5 py-5 flex items-center gap-4 pt-safe-top">
        <button onClick={onBackToGarage} className="p-2.5 rounded-2xl bg-nsp-input text-nsp-sub"><ArrowLeft size={20} /></button>
        <div className="flex-1">
           <h2 className="text-lg font-black text-white leading-none tracking-tight">{car.name}</h2>
           <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-nsp-primary font-black tracking-widest uppercase">{car.plate}</span>
           </div>
        </div>
        <button onClick={onSellCar} className="p-2.5 rounded-2xl bg-nsp-input text-white border border-white/10">
           <Share2 size={20} />
        </button>
      </header>

      <main className="p-6 space-y-8 animate-fade-in">
        <div className="grid grid-cols-3 gap-3">
            <div className="bg-nsp-card border border-nsp-border rounded-3xl p-5 flex flex-col items-center text-center">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${proactiveStatus.status === 'critical' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                    <Wrench size={22}/>
                </div>
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Santé</span>
            </div>
            <div className="bg-nsp-card border border-nsp-border rounded-3xl p-5 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-3">
                    <Gauge size={22}/>
                </div>
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Pneus</span>
            </div>
            <div className="bg-nsp-card border border-nsp-border rounded-3xl p-5 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-yellow-500/20 text-yellow-400 rounded-2xl flex items-center justify-center mb-3">
                    <Droplet size={22}/>
                </div>
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Fluides</span>
            </div>
        </div>

        <div className={`relative overflow-hidden rounded-[2.5rem] border p-8 shadow-2xl ${
          proactiveStatus.status === 'critical' ? 'border-red-600 bg-red-950/20' : 'border-nsp-success/30 bg-green-900/10'
        }`}>
          <div className="flex items-start gap-6">
            <div className="p-4 rounded-[1.5rem] bg-nsp-input text-nsp-primary">
              <Sparkles size={28} />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-white text-[11px] uppercase tracking-[0.3em] mb-2">Diagnostic IA</h3>
              <p className="text-gray-300 leading-relaxed text-sm font-bold">{proactiveStatus.message}</p>
            </div>
          </div>
        </div>

        <div className="bg-nsp-card border border-nsp-border rounded-[2.5rem] p-8 shadow-2xl">
           <h3 className="text-white font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
             <Share2 size={16} className="text-nsp-primary" /> Cession du véhicule
           </h3>
           <p className="text-gray-400 text-xs mb-6 leading-relaxed">
             Vous vendez votre véhicule ? Transférez instantanément tout son carnet d'entretien numérique au nouveau propriétaire pour valoriser votre vente.
           </p>
           <button onClick={onSellCar} className="w-full bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl">
             VENDRE MON VÉHICULE
           </button>
        </div>

        <button onClick={onAssistance} className="w-full bg-nsp-input border border-white/10 text-white p-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4">
          <PhoneCall size={20} /> Assistance 24/7
        </button>

        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
             <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">Derniers documents</h3>
             <button className="text-[10px] text-gray-500 font-black uppercase underline">Voir Tout</button>
          </div>
          <div className="space-y-3">
            {invoices.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-nsp-border rounded-[2rem] text-center">
                    <p className="text-gray-700 text-[10px] font-black uppercase tracking-widest">Aucun document numérisé</p>
                </div>
            ) : (
                invoices.slice(0, 3).map(inv => (
                    <div key={inv.id} onClick={() => setViewingInvoice(inv)} className="bg-nsp-card p-5 rounded-3xl border border-nsp-border flex items-center justify-between hover:border-nsp-primary transition-all cursor-pointer shadow-lg group">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-nsp-input flex items-center justify-center text-nsp-primary">
                               <FileText size={20}/>
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm uppercase truncate max-w-[150px]">{inv.title}</h4>
                                <p className="text-[10px] text-gray-500 mt-1">{inv.date}</p>
                            </div>
                        </div>
                        <p className="text-white font-black text-sm">{inv.price}€</p>
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
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in overflow-y-auto">
          <header className="flex justify-between items-center p-6 pt-safe-top bg-black/40 border-b border-white/5 sticky top-0 z-50">
            <button onClick={() => setViewingInvoice(null)} className="p-3 bg-nsp-input rounded-2xl text-white"><X size={24}/></button>
            <div className="text-center">
               <h3 className="text-white font-black text-xs uppercase tracking-widest">Document Archivé</h3>
               <p className="text-[9px] text-nsp-primary font-black uppercase mt-1">Copie Numérique Certifiée</p>
            </div>
            <div className="w-12"></div>
          </header>

          <div className="p-6 flex-1 flex flex-col items-center">
            <div className="w-full bg-nsp-card border border-nsp-border rounded-[2.5rem] overflow-hidden shadow-2xl mb-8">
              {viewingInvoice.imageUrl ? (
                <img src={safeBase64ToBlobUrl(viewingInvoice.imageUrl)} className="w-full h-auto max-h-[70vh] object-contain" alt="Scan" />
              ) : (
                <div className="p-20 text-center text-gray-500">Pas d'image disponible</div>
              )}
            </div>
            <div className="w-full grid grid-cols-2 gap-4 mb-8">
               <div className="bg-nsp-card p-6 rounded-[2rem] border border-nsp-border shadow-xl">
                  <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Montant</p>
                  <p className="text-white font-black text-2xl">{viewingInvoice.price}€</p>
               </div>
               <div className="bg-nsp-card p-6 rounded-[2rem] border border-nsp-border shadow-xl">
                  <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Kilométrage</p>
                  <p className="text-white font-black text-2xl">{viewingInvoice.km.toLocaleString()}</p>
               </div>
            </div>
            <button onClick={() => { if(confirm('Supprimer ?')) { onDeleteInvoice(viewingInvoice.id); setViewingInvoice(null); } }} className="w-full bg-red-600/10 text-red-500 font-black py-5 rounded-[2rem] text-[10px] uppercase tracking-widest border border-red-600/20">
               SUPPRIMER LE DOCUMENT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
