
import React, { useEffect, useState, useMemo } from 'react';
import { User, Car, Invoice, AIStatus, ManufacturerSpecs, TechnicalSpecs } from '../types';
// Added missing ChevronRight import
import { Plus, FileText, ArrowLeft, Sparkles, Gauge, Droplet, ShieldCheck, PhoneCall, Bell, BellOff, X, Trash2, ZoomIn, Download, Wrench, Cpu, Database, AlertCircle, Share2, Settings, Info, Maximize2, Minimize2, ChevronRight } from 'lucide-react';
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
  const [activeReport, setActiveReport] = useState<'health' | 'tires' | 'fluids' | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const proactiveStatus = calculateMaintenanceStatus(car, invoices);
  const lastMileage = invoices.length > 0 ? Math.max(...invoices.map(i => i.km)) : car.initialKm;

  useEffect(() => {
    const loadSpecs = async () => {
      const data = await getPersonalizedMaintenance(car, lastMileage);
      setSpecs(data);
    };
    loadSpecs();
  }, [car.id, lastMileage]);

  const isPDF = (url?: string) => url?.includes('application/pdf') || (url?.length ? url.substring(0, 30).includes('JVBER') : false);

  return (
    <div className="min-h-[100dvh] bg-nsp-bg pb-24 relative overflow-y-auto">
      <header className="bg-nsp-card/80 backdrop-blur-xl sticky top-0 z-40 border-b border-nsp-border px-5 py-5 flex items-center gap-4 pt-safe-top">
        <button onClick={onBackToGarage} className="p-2.5 rounded-2xl bg-nsp-input text-nsp-sub hover:bg-nsp-primary transition-colors"><ArrowLeft size={20} /></button>
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
            <button 
              onClick={() => setActiveReport('health')}
              className="bg-nsp-card border border-nsp-border rounded-3xl p-5 flex flex-col items-center text-center active:scale-95 transition-transform"
            >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${proactiveStatus.status === 'critical' ? 'bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(230,57,70,0.3)]' : 'bg-green-500/20 text-green-500'}`}>
                    <Wrench size={22}/>
                </div>
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Santé</span>
            </button>
            <button 
              onClick={() => setActiveReport('tires')}
              className="bg-nsp-card border border-nsp-border rounded-3xl p-5 flex flex-col items-center text-center active:scale-95 transition-transform"
            >
                <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-3">
                    <Gauge size={22}/>
                </div>
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Pneus</span>
            </button>
            <button 
              onClick={() => setActiveReport('fluids')}
              className="bg-nsp-card border border-nsp-border rounded-3xl p-5 flex flex-col items-center text-center active:scale-95 transition-transform"
            >
                <div className="w-12 h-12 bg-yellow-500/20 text-yellow-400 rounded-2xl flex items-center justify-center mb-3">
                    <Droplet size={22}/>
                </div>
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Fluides</span>
            </button>
        </div>

        <div className={`relative overflow-hidden rounded-[2.5rem] border p-8 shadow-2xl transition-all duration-500 ${
          proactiveStatus.status === 'critical' ? 'border-red-600 bg-red-950/20' : 'border-nsp-success/30 bg-green-900/10'
        }`}>
          <div className="flex items-start gap-6">
            <div className="p-4 rounded-[1.5rem] bg-nsp-input text-nsp-primary shadow-lg">
              <Sparkles size={28} />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-white text-[11px] uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                Diagnostic IA {car.name.split(' ')[0]}
              </h3>
              <p className="text-gray-300 leading-relaxed text-sm font-bold">
                {proactiveStatus.message}
              </p>
            </div>
          </div>
        </div>

        <button onClick={onAssistance} className="w-full bg-nsp-input border border-white/10 text-white p-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95 transition-transform shadow-lg">
          <PhoneCall size={20} className="text-nsp-primary" /> Assistance 24/7
        </button>

        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
             <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">Derniers documents</h3>
             <button onClick={onAddInvoice} className="text-[10px] text-nsp-primary font-black uppercase underline">Scanner un nouveau</button>
          </div>
          <div className="space-y-3">
            {invoices.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-nsp-border rounded-[2rem] text-center">
                    <p className="text-gray-700 text-[10px] font-black uppercase tracking-widest">Aucun document numérisé</p>
                </div>
            ) : (
                invoices.slice(0, 3).map(inv => (
                    <div key={inv.id} onClick={() => setViewingInvoice(inv)} className="bg-nsp-card p-5 rounded-3xl border border-nsp-border flex items-center justify-between hover:border-nsp-primary transition-all cursor-pointer shadow-lg group active:scale-[0.98]">
                        <div className="flex items-center gap-5 overflow-hidden">
                            <div className="w-12 h-12 rounded-2xl bg-nsp-input flex items-center justify-center text-nsp-primary border border-white/5 shrink-0">
                               {isPDF(inv.imageUrl) ? <FileText size={20} className="text-red-500" /> : <FileText size={20}/>}
                            </div>
                            <div className="overflow-hidden">
                                <h4 className="text-white font-bold text-sm uppercase truncate max-w-[150px]">{inv.title}</h4>
                                <p className="text-[10px] text-gray-500 mt-1">{inv.date}</p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-white font-black text-sm">{inv.price}€</p>
                          <ChevronRight size={14} className="text-gray-700 ml-auto mt-1" />
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>
      </main>

      {/* VISIONNEUSE DOSSIER RAPIDE (Z-INDEX 999) */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-2xl flex flex-col animate-fade-in overflow-hidden">
          <header className="flex justify-between items-center p-6 pt-safe-top bg-black/80 border-b border-white/10 z-[1001]">
            <button 
              onClick={() => { setViewingInvoice(null); setIsFullscreen(false); }} 
              className="p-3 bg-nsp-input rounded-2xl text-white"
            >
              <X size={24}/>
            </button>
            <div className="text-center">
               <h3 className="text-white font-black text-xs uppercase tracking-widest">Visionneuse Document</h3>
               <p className="text-[9px] text-nsp-primary font-black uppercase mt-1 tracking-widest">Certification AUTOBOOK</p>
            </div>
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-3 bg-nsp-input rounded-2xl text-white">
              {isFullscreen ? <Minimize2 size={24}/> : <Maximize2 size={24}/>}
            </button>
          </header>

          <div className={`flex-1 overflow-y-auto p-4 md:p-10 flex flex-col items-center ${isFullscreen ? 'p-0' : ''}`}>
            <div className={`w-full max-w-4xl transition-all duration-300 ${isFullscreen ? 'h-full max-w-none' : 'space-y-8'}`}>
              <div className={`rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0a0a0a] relative group ${isFullscreen ? 'rounded-none border-0 h-full flex items-center justify-center' : 'min-h-[50vh]'}`}>
                {isPDF(viewingInvoice.imageUrl) ? (
                  <div className="w-full h-full min-h-[70vh] flex flex-col items-center justify-center p-10 gap-6">
                    <FileText size={80} className="text-red-500 animate-pulse" />
                    <p className="text-white font-black text-xs uppercase">Document PDF</p>
                    <a 
                      href={safeBase64ToBlobUrl(viewingInvoice.imageUrl || '')} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-white text-black px-10 py-5 rounded-full font-black text-xs uppercase shadow-2xl active:scale-95 transition-all flex items-center gap-3"
                    >
                      <Download size={20} /> Ouvrir PDF
                    </a>
                  </div>
                ) : (
                  <img 
                    src={safeBase64ToBlobUrl(viewingInvoice.imageUrl || '')} 
                    className={`w-full h-auto mx-auto block ${isFullscreen ? 'max-h-full object-contain' : 'max-h-[85vh] object-contain'}`} 
                    alt="Document" 
                  />
                )}
                
                {!isFullscreen && (
                  <div className="absolute top-6 right-6">
                    <div className="bg-nsp-primary/90 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl">
                      <ShieldCheck size={16} /> Certifié IA
                    </div>
                  </div>
                )}
              </div>

              {!isFullscreen && (
                <div className="bg-nsp-card p-8 rounded-[2.5rem] border border-nsp-border shadow-2xl space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Enseigne</p>
                       <p className="text-white font-bold text-lg uppercase truncate">{viewingInvoice.title}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Montant</p>
                       <p className="text-white font-black text-2xl">{viewingInvoice.price}€</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => { if(confirm('Supprimer ?')) { onDeleteInvoice(viewingInvoice.id); setViewingInvoice(null); } }} 
                    className="w-full bg-red-600/10 text-red-500 font-black py-5 rounded-[2rem] text-[10px] uppercase tracking-widest border border-red-500/20 active:scale-95 transition-all"
                  >
                    <Trash2 size={16} className="inline mr-2" /> SUPPRIMER L'ARCHIVE
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RAPPORT DÉTAILLÉ */}
      {activeReport && (
        <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-xl flex items-end animate-fade-in">
           <div className="w-full bg-nsp-card border-t border-nsp-border rounded-t-[3rem] p-8 max-h-[85vh] overflow-y-auto animate-slide-up">
              <div className="flex justify-between items-center mb-8">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-nsp-input rounded-2xl flex items-center justify-center text-nsp-primary border border-white/5">
                       {activeReport === 'health' && <Wrench size={24}/>}
                       {activeReport === 'tires' && <Gauge size={24}/>}
                       {activeReport === 'fluids' && <Droplet size={24}/>}
                    </div>
                    <div>
                       <h3 className="text-white font-black text-lg uppercase tracking-tight">
                         {activeReport === 'health' && 'Bilan de Santé IA'}
                         {activeReport === 'tires' && 'Spécifs Pneumatiques'}
                         {activeReport === 'fluids' && 'Guide des Fluides'}
                       </h3>
                       <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Données {car.name}</p>
                    </div>
                 </div>
                 <button onClick={() => setActiveReport(null)} className="p-3 bg-nsp-input rounded-2xl text-white"><X size={20}/></button>
              </div>

              {specs ? (
                 <div className="space-y-6">
                    {activeReport === 'health' && (
                       <div className="space-y-4">
                          <div className="bg-nsp-input p-6 rounded-3xl border border-white/5">
                             <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-3">Intervalles Maintenance</p>
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-white text-sm font-bold">Révision Standard</span>
                                <span className="text-nsp-primary font-black">{specs.maintenanceIntervalKm.toLocaleString()} KM</span>
                             </div>
                             {specs.timingBeltIntervalKm && specs.timingBeltIntervalKm > 0 && (
                                <div className="flex justify-between items-center">
                                   <span className="text-white text-sm font-bold">Distribution</span>
                                   <span className="text-nsp-primary font-black">{specs.timingBeltIntervalKm.toLocaleString()} KM</span>
                                </div>
                             )}
                          </div>
                          <div className="space-y-2">
                             <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest ml-1">Points de vigilance</p>
                             {specs.checkPoints.map((point, i) => (
                                <div key={i} className="bg-white/5 p-4 rounded-2xl flex items-center gap-3 text-white text-xs font-medium">
                                   <div className="w-2 h-2 rounded-full bg-nsp-primary"></div>
                                   {point}
                                </div>
                             ))}
                          </div>
                       </div>
                    )}

                    {activeReport === 'tires' && (
                       <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                             <div className="bg-nsp-input p-6 rounded-3xl text-center border border-white/5">
                                <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">Avant</p>
                                <p className="text-white font-black text-2xl">{specs.tirePressureFront}</p>
                             </div>
                             <div className="bg-nsp-input p-6 rounded-3xl text-center border border-white/5">
                                <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">Arrière</p>
                                <p className="text-white font-black text-2xl">{specs.tirePressureRear}</p>
                             </div>
                          </div>
                          <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-start gap-4">
                             <Info size={20} className="text-blue-400 shrink-0" />
                             <p className="text-blue-200 text-xs leading-relaxed font-medium">
                                Contrôlez la pression à froid tous les mois. Une sous-pression de 0.5 bar augmente la consommation de 3%.
                             </p>
                          </div>
                       </div>
                    )}

                    {activeReport === 'fluids' && (
                       <div className="space-y-4">
                          <div className="bg-nsp-input p-6 rounded-3xl border border-white/5">
                             <div className="space-y-4">
                                <div>
                                   <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">Huile Moteur Préconisée</p>
                                   <p className="text-white font-bold text-lg">{specs.oilType}</p>
                                </div>
                                <div>
                                   <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">Liquide de Refroidissement</p>
                                   <p className="text-white font-bold text-lg">{specs.coolantType}</p>
                                </div>
                             </div>
                          </div>
                          <p className="text-[10px] text-gray-500 italic text-center px-4">
                            L'utilisation d'une huile non conforme peut annuler la garantie constructeur de votre {car.name.split(' ')[0]}.
                          </p>
                       </div>
                    )}
                 </div>
              ) : (
                 <div className="py-20 flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-t-transparent border-nsp-primary rounded-full animate-spin"></div>
                    <p className="text-white font-bold text-xs uppercase tracking-widest">Analyse de l'ADN véhicule...</p>
                 </div>
              )}
              
              <button 
                onClick={() => setActiveReport(null)}
                className="w-full bg-nsp-primary text-white font-black py-5 rounded-[2rem] text-[10px] uppercase tracking-widest mt-8 shadow-xl active:scale-95 transition-transform"
              >
                Fermer le Rapport
              </button>
           </div>
        </div>
      )}

      <div className="fixed bottom-10 right-8 z-[80]">
          <button onClick={onAddInvoice} className="w-20 h-20 bg-nsp-primary rounded-[2rem] shadow-[0_20px_40px_rgba(230,57,70,0.4)] flex items-center justify-center text-white active:scale-90 transition-transform">
              <Plus size={40} />
          </button>
      </div>
    </div>
  );
};
