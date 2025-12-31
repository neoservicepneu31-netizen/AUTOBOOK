
import React, { useEffect, useState, useMemo } from 'react';
import { User, Car, Invoice, AIStatus, ManufacturerSpecs, TechnicalSpecs } from '../types';
import { 
  Plus, FileText, ArrowLeft, Sparkles, Gauge, Droplet, PhoneCall, X, 
  Wrench, AlertCircle, Share2, ShieldCheck, ChevronRight, Activity, Info, Eye, Download, Maximize2, Loader2, Trash2, Layers, Search, History, CheckCircle2, AlertTriangle, ListChecks, Calendar, Scale
} from 'lucide-react';
import { getPersonalizedMaintenance, safeBase64ToBlobUrl, base64ToRealBlobUrl } from '../services/geminiService';
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
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);
  const [activeReport, setActiveReport] = useState<'health' | 'tires' | 'fluids' | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const proactiveStatus = calculateMaintenanceStatus(car, invoices);
  const lastMileage = invoices.length > 0 ? Math.max(...invoices.map(i => i.km)) : car.initialKm;

  useEffect(() => {
    const loadSpecs = async () => {
      setIsLoadingSpecs(true);
      try {
        const data = await getPersonalizedMaintenance(car, lastMileage);
        setSpecs(data);
      } finally {
        setIsLoadingSpecs(false);
      }
    };
    loadSpecs();
  }, [car.id, lastMileage]);

  const isPDF = (url?: string) => {
    if (!url) return false;
    return url.includes('application/pdf') || url.substring(0, 30).includes('JVBER');
  };

  const technicalHistory = useMemo(() => {
    return invoices
      .filter(inv => inv.detectedSpecs)
      .map(inv => ({
        date: inv.date,
        km: inv.km,
        title: inv.title,
        specs: inv.detectedSpecs!
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices]);

  const handleDelete = async () => {
    if (!viewingInvoice) return;
    if (confirm('Voulez-vous supprimer ce document de votre coffre-fort ?')) {
      const idToDelete = viewingInvoice.id;
      setViewingInvoice(null);
      onDeleteInvoice(idToDelete);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-nsp-bg w-full pb-32 overflow-y-auto relative">
      <header className="bg-nsp-card/90 backdrop-blur-md sticky top-0 z-[100] border-b border-nsp-border px-5 py-5 pt-safe-top flex items-center gap-4">
        <button onClick={onBackToGarage} className="p-3 rounded-xl bg-nsp-input text-nsp-sub"><ArrowLeft size={20} /></button>
        <div className="flex-1 overflow-hidden">
           <h2 className="text-lg font-black text-white leading-none truncate uppercase tracking-tight">{car.name}</h2>
           <p className="text-[10px] text-nsp-primary font-black mt-1 tracking-widest">{car.plate}</p>
        </div>
        <button onClick={onSellCar} className="p-3 rounded-xl bg-nsp-input text-white border border-white/5 shadow-lg">
           <Share2 size={20} />
        </button>
      </header>

      <main className="p-6 space-y-8 animate-fade-in flex-1">
        <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'health', icon: <Wrench size={22}/>, label: 'Santé', color: proactiveStatus.status === 'critical' ? 'text-red-500 bg-red-500/10' : 'text-green-500 bg-green-500/10' },
              { id: 'tires', icon: <Gauge size={22}/>, label: 'Pneus', color: 'text-blue-400 bg-blue-400/10' },
              { id: 'fluids', icon: <Droplet size={22}/>, label: 'Fluides', color: 'text-yellow-400 bg-yellow-400/10' }
            ].map(item => (
              <button key={item.id} onClick={() => setActiveReport(item.id as any)} className="bg-nsp-card border border-nsp-border rounded-[2rem] p-5 flex flex-col items-center text-center shadow-xl active:scale-95 transition-all relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${item.color}`}>{item.icon}</div>
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
        </div>

        <div className={`relative overflow-hidden rounded-[2.5rem] border p-8 shadow-2xl ${proactiveStatus.status === 'critical' ? 'border-red-600 bg-red-900/10' : 'border-nsp-success/30 bg-green-900/10'}`}>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-nsp-input text-nsp-primary"><Sparkles size={24} /></div>
            <div className="flex-1">
              <h3 className="font-black text-white text-[10px] uppercase tracking-[0.2em] mb-2">Diagnostic IA</h3>
              <p className="text-gray-300 text-sm font-medium leading-relaxed">{proactiveStatus.message}</p>
            </div>
          </div>
        </div>

        <button onClick={onAssistance} className="w-full bg-nsp-input border border-white/5 text-white p-6 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 shadow-xl active:scale-95">
          <PhoneCall size={20} className="text-nsp-primary" /> Assistance Expert 24/7
        </button>

        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
             <h3 className="text-white font-black text-xs uppercase tracking-widest">Dossier Numérique</h3>
             <button onClick={onAddInvoice} className="text-[10px] text-nsp-primary font-black uppercase underline underline-offset-4">Ajouter</button>
          </div>
          <div className="space-y-3">
            {invoices.length === 0 ? (
                <div className="p-10 border-2 border-dashed border-nsp-border rounded-[2rem] text-center text-[10px] text-gray-600 font-black uppercase tracking-widest">Historique Vide</div>
            ) : (
                invoices.slice(0, 5).map(inv => (
                    <div key={inv.id} onClick={() => setViewingInvoice(inv)} className="bg-nsp-card p-5 rounded-3xl border border-nsp-border flex items-center justify-between shadow-md active:scale-95 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-nsp-input flex items-center justify-center text-nsp-primary border border-white/5 group-hover:bg-nsp-primary group-hover:text-white transition-colors">
                               {isPDF(inv.imageUrl) ? <FileText size={20}/> : <Activity size={20}/>}
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm uppercase truncate max-w-[150px]">{inv.title}</h4>
                                <p className="text-[9px] text-gray-500 font-bold tracking-widest">{inv.date} • {inv.km.toLocaleString()} KM</p>
                            </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-black text-sm">{inv.price}€</p>
                          <ChevronRight size={14} className="text-gray-700 ml-auto mt-1" />
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>
      </main>

      {/* --- MODAL RAPPORT TECHNIQUE ENRICHI --- */}
      {activeReport && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-xl flex items-end animate-fade-in p-4">
          <div className="w-full bg-nsp-card rounded-[3rem] border border-white/10 p-8 pb-12 animate-slide-up max-h-[90vh] overflow-y-auto shadow-2xl no-scrollbar">
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-nsp-card/95 backdrop-blur-md z-10 py-2">
               <div className="flex items-center gap-4">
                 <div className="p-4 bg-nsp-input rounded-[1.5rem] text-nsp-primary shadow-inner">
                    {activeReport === 'health' ? <Wrench size={28}/> : activeReport === 'tires' ? <Gauge size={28}/> : <Droplet size={28}/>}
                 </div>
                 <div>
                    <h2 className="text-white font-black text-xl uppercase tracking-tighter">
                        Rapport {activeReport === 'health' ? 'Santé' : activeReport === 'tires' ? 'Pneus' : 'Fluides'}
                    </h2>
                    <p className="text-nsp-primary text-[8px] font-black uppercase tracking-[0.2em]">Analyses Factures & Constructeur</p>
                 </div>
               </div>
               <button onClick={() => setActiveReport(null)} className="p-3 bg-white/5 rounded-full text-white hover:bg-nsp-primary transition-colors"><X size={24}/></button>
            </div>

            <div className="space-y-10">
               {/* 1. SECTION PRECONISATIONS CONSTRUCTEUR */}
               <section className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <ShieldCheck size={14} className="text-nsp-primary" /> Données Constructeur
                     </h3>
                  </div>
                  
                  {isLoadingSpecs ? (
                    <div className="flex items-center gap-3 bg-nsp-input p-6 rounded-3xl animate-pulse">
                       <Loader2 className="animate-spin text-nsp-primary" size={20} />
                       <span className="text-xs text-gray-500 font-bold uppercase">Récupération des specs...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {activeReport === 'tires' && (
                          <>
                            <div className="bg-nsp-input p-5 rounded-3xl border border-white/5 text-center">
                               <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Pression AV</p>
                               <p className="text-white font-black text-xl">{specs?.tirePressureFront || '2.3 bar'}</p>
                            </div>
                            <div className="bg-nsp-input p-5 rounded-3xl border border-white/5 text-center">
                               <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Pression AR</p>
                               <p className="text-white font-black text-xl">{specs?.tirePressureRear || '2.1 bar'}</p>
                            </div>
                          </>
                        )}
                        {activeReport === 'fluids' && (
                          <div className="col-span-2 bg-nsp-input p-5 rounded-3xl border border-white/5 flex items-center gap-4">
                             <Droplet size={24} className="text-yellow-500" />
                             <div>
                                <p className="text-white font-black text-sm uppercase">{specs?.oilType || '5W30 C3'}</p>
                                <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Spécification Huile Recommandée</p>
                             </div>
                          </div>
                        )}
                        {activeReport === 'health' && (
                          <>
                            <div className="bg-nsp-input p-5 rounded-3xl border border-white/5 text-center">
                               <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Entretien</p>
                               <p className="text-white font-black text-lg">{specs?.maintenanceIntervalKm?.toLocaleString() || '20 000'} KM</p>
                            </div>
                            <div className="bg-nsp-input p-5 rounded-3xl border border-white/5 text-center">
                               <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Distribution</p>
                               <p className="text-white font-black text-lg">{specs?.timingBeltIntervalKm ? `${specs.timingBeltIntervalKm.toLocaleString()} KM` : 'N/A'}</p>
                            </div>
                          </>
                        )}
                    </div>
                  )}
               </section>

               {/* 2. SECTION HISTORIQUE IA DÉTAILLÉ */}
               <section className="space-y-5">
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <History size={14} className="text-nsp-primary" /> Analyse des Interventions
                     </h3>
                  </div>

                  <div className="space-y-4">
                    {technicalHistory.filter(item => {
                       if (activeReport === 'tires') return !!item.specs.tireDimensions;
                       if (activeReport === 'fluids') return !!item.specs.oilViscosity || (item.specs.filterRefs && item.specs.filterRefs.some(f => f.toLowerCase().includes('huile')));
                       if (activeReport === 'health') return (item.specs.mechanicalParts && item.specs.mechanicalParts.length > 0) || (item.specs.filterRefs && item.specs.filterRefs.length > 0) || !!item.specs.batteryRef;
                       return false;
                    }).length === 0 ? (
                      <div className="bg-white/5 border border-dashed border-white/10 p-12 rounded-[2.5rem] text-center">
                         <Search size={32} className="text-gray-800 mx-auto mb-4" />
                         <p className="text-gray-600 font-black text-[10px] uppercase tracking-widest leading-relaxed">
                            Aucune donnée technique détectée.<br/>Scannez vos factures pour extraire les pièces.
                         </p>
                      </div>
                    ) : (
                      technicalHistory.filter(item => {
                         if (activeReport === 'tires') return !!item.specs.tireDimensions;
                         if (activeReport === 'fluids') return !!item.specs.oilViscosity || (item.specs.filterRefs && item.specs.filterRefs.some(f => f.toLowerCase().includes('huile')));
                         if (activeReport === 'health') return (item.specs.mechanicalParts && item.specs.mechanicalParts.length > 0) || (item.specs.filterRefs && item.specs.filterRefs.length > 0) || !!item.specs.batteryRef;
                         return false;
                      }).map((item, idx) => (
                        <div key={idx} className="bg-nsp-card border border-nsp-border rounded-[2.5rem] overflow-hidden shadow-xl animate-fade-in" style={{animationDelay: `${idx * 0.1}s`}}>
                           <div className="bg-nsp-input px-6 py-4 flex justify-between items-center border-b border-white/5">
                              <div className="flex items-center gap-2 overflow-hidden">
                                 <Calendar size={12} className="text-nsp-primary" />
                                 <span className="text-white font-black text-[9px] uppercase tracking-tight truncate">{item.title}</span>
                              </div>
                              <span className="text-gray-500 font-bold text-[8px] whitespace-nowrap">{item.date} • {item.km.toLocaleString()} KM</span>
                           </div>
                           <div className="p-6 space-y-5">
                              {/* RAPPORTS SPÉCIFIQUES DÉTAILLÉS */}
                              {activeReport === 'tires' && item.specs.tireDimensions && (
                                <div className="flex items-start gap-4 bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10">
                                   <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0"><Layers size={20}/></div>
                                   <div>
                                      <p className="text-[8px] text-blue-400 uppercase font-black tracking-widest mb-1">Dimensions Identifiées :</p>
                                      <p className="text-white font-black text-base">{item.specs.tireDimensions}</p>
                                   </div>
                                </div>
                              )}

                              {activeReport === 'fluids' && (
                                <div className="space-y-4">
                                   {item.specs.oilViscosity && (
                                      <div className="flex items-start gap-4 bg-yellow-500/5 p-4 rounded-2xl border border-yellow-500/10">
                                         <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 shrink-0"><Droplet size={20}/></div>
                                         <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                               <p className="text-[8px] text-yellow-500 uppercase font-black tracking-widest mb-1">Huile Relevée :</p>
                                               {item.specs.oilQuantity && <span className="text-[10px] text-white font-black bg-yellow-500/20 px-2 py-0.5 rounded-md">{item.specs.oilQuantity}</span>}
                                            </div>
                                            <p className="text-white font-black text-base">{item.specs.oilViscosity}</p>
                                         </div>
                                      </div>
                                   )}
                                   {item.specs.filterRefs && item.specs.filterRefs.some(f => f.toLowerCase().includes('huile')) && (
                                     <div className="flex items-center gap-4 px-2">
                                        <div className="w-8 h-8 rounded-lg bg-nsp-input flex items-center justify-center text-gray-500"><ListChecks size={14}/></div>
                                        <div className="flex-1">
                                           <p className="text-[8px] text-gray-500 uppercase font-black mb-1">Filtre à Huile :</p>
                                           <p className="text-white font-bold text-xs">{item.specs.filterRefs.find(f => f.toLowerCase().includes('huile'))}</p>
                                        </div>
                                     </div>
                                   )}
                                </div>
                              )}

                              {activeReport === 'health' && (
                                <div className="space-y-5">
                                   {item.specs.mechanicalParts && item.specs.mechanicalParts.length > 0 && (
                                      <div className="space-y-3">
                                         <p className="text-[8px] text-nsp-primary font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Wrench size={10} /> Organes Mécaniques :
                                         </p>
                                         <div className="flex flex-wrap gap-2">
                                            {item.specs.mechanicalParts.map((part, i) => (
                                              <span key={i} className="bg-white/5 px-3 py-1.5 rounded-xl text-white font-bold text-[10px] border border-white/10 shadow-sm">{part}</span>
                                            ))}
                                         </div>
                                      </div>
                                   )}
                                   {item.specs.filterRefs && item.specs.filterRefs.length > 0 && (
                                      <div className="space-y-3">
                                         <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <ListChecks size={10} /> Filtres & Consommables :
                                         </p>
                                         <div className="flex flex-wrap gap-2">
                                            {item.specs.filterRefs.map((filter, i) => (
                                              <span key={i} className="bg-nsp-input px-3 py-1.5 rounded-xl text-nsp-primary font-black text-[10px] border border-nsp-primary/20 shadow-inner">{filter}</span>
                                            ))}
                                         </div>
                                      </div>
                                   )}
                                   {item.specs.batteryRef && (
                                      <div className="bg-nsp-input p-4 rounded-2xl border border-white/5">
                                         <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Batterie Installée :</p>
                                         <p className="text-white font-black text-xs">{item.specs.batteryRef}</p>
                                      </div>
                                   )}
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                 <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-nsp-success"></div>
                                    <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest">Origine Certifiée IA</span>
                                 </div>
                                 <button className="text-nsp-primary font-black text-[8px] uppercase tracking-widest flex items-center gap-1 hover:translate-x-1 transition-transform">
                                    Recommander ces pièces <ChevronRight size={10}/>
                                 </button>
                              </div>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
               </section>
            </div>

            <button 
              onClick={() => setActiveReport(null)}
              className="w-full bg-nsp-primary text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest mt-12 shadow-xl active:scale-95 transition-all"
            >
               Fermer l'Analyse Technique
            </button>
          </div>
        </div>
      )}

      {/* --- VISIONNEUSE DE DOCUMENTS --- */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-[2000] bg-black/98 flex flex-col pt-safe-top animate-fade-in overflow-hidden">
          <header className="p-6 flex justify-between items-center bg-black/50 border-b border-white/10 z-[2001]">
             <button onClick={() => setViewingInvoice(null)} className="p-3 bg-nsp-input rounded-xl text-white hover:bg-nsp-primary transition-colors"><X size={24}/></button>
             <div className="text-center">
                <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] truncate max-w-[150px]">{viewingInvoice.title}</h3>
                <p className="text-[9px] text-nsp-primary font-black uppercase mt-1 tracking-widest">Coffre-fort Numérique</p>
             </div>
             <div className="flex gap-2">
               <button onClick={() => window.open(base64ToRealBlobUrl(viewingInvoice.imageUrl || '', isPDF(viewingInvoice.imageUrl) ? 'application/pdf' : 'image/jpeg'), '_blank')} className="p-3 bg-nsp-input rounded-xl text-white"><Maximize2 size={24}/></button>
             </div>
          </header>
          
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-full h-full max-w-4xl bg-nsp-card rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative">
              {isPDF(viewingInvoice.imageUrl) ? (
                <div className="w-full h-full bg-black overflow-hidden relative">
                   <iframe 
                      src={base64ToRealBlobUrl(viewingInvoice.imageUrl || '', 'application/pdf') + '#toolbar=0&navpanes=0'} 
                      className="w-full h-full border-0"
                      title="PDF Viewer"
                   />
                   <div className="absolute inset-0 flex items-center justify-center bg-black pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                      <div className="text-center p-10">
                         <AlertTriangle className="text-nsp-primary mx-auto mb-4" size={48} />
                         <p className="text-white font-bold text-sm mb-4 uppercase">Impossible d'afficher l'aperçu PDF</p>
                         <button onClick={() => window.open(base64ToRealBlobUrl(viewingInvoice.imageUrl || '', 'application/pdf'), '_blank')} className="bg-nsp-primary text-white px-8 py-3 rounded-full text-[10px] font-black uppercase pointer-events-auto">Ouvrir dans le navigateur</button>
                      </div>
                   </div>
                </div>
              ) : (
                <img src={safeBase64ToBlobUrl(viewingInvoice.imageUrl || '')} className="w-full h-full object-contain bg-[#050505]" alt="Facture" />
              )}
            </div>
          </div>

          <div className="p-8 bg-nsp-card/80 backdrop-blur-xl border-t border-white/10 space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-nsp-input p-5 rounded-2xl border border-white/5">
                   <p className="text-[9px] text-gray-500 font-black uppercase mb-1">Montant Payé</p>
                   <p className="text-white font-black text-2xl tracking-tighter">{viewingInvoice.price} €</p>
                </div>
                <div className="bg-nsp-input p-5 rounded-2xl border border-white/5">
                   <p className="text-[9px] text-gray-500 font-black uppercase mb-1">Relevé KM</p>
                   <p className="text-white font-black text-2xl tracking-tighter">{viewingInvoice.km.toLocaleString()}</p>
                </div>
             </div>
             <div className="flex gap-4">
                <button onClick={handleDelete} className="flex-1 bg-red-600/10 text-red-500 font-black py-5 rounded-[2rem] text-[10px] uppercase border border-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Trash2 size={18} /> Supprimer
                </button>
                <button onClick={() => setViewingInvoice(null)} className="flex-1 bg-white/10 text-white font-black py-5 rounded-[2rem] text-[10px] uppercase border border-white/10 active:scale-95 transition-all"> Fermer </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
