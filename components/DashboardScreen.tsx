
import React, { useEffect, useState, useMemo } from 'react';
import { User, Car, Invoice, AIStatus, ManufacturerSpecs, TechnicalSpecs } from '../types';
import { 
  Plus, FileText, ArrowLeft, Sparkles, Gauge, Droplet, PhoneCall, X, 
  Wrench, AlertCircle, Share2, ShieldCheck, ChevronRight, Activity, Info, Eye, Download, Maximize2, Loader2, Trash2, Layers, Search, History, CheckCircle2, AlertTriangle, ListChecks, Calendar, Scale, Image as ImageIcon, BellRing, Clock, ShieldAlert, CircleAlert, Shield, SearchCode, PackageSearch, TrendingUp, TrendingDown, Wallet, Medal, Target
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
  const [activeReport, setActiveReport] = useState<'health' | 'tires' | 'fluids' | 'ct' | 'insurance' | 'parts' | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{title: string, url: string} | null>(null);

  const proactiveStatus = calculateMaintenanceStatus(car, invoices);
  const lastMileage = invoices.length > 0 ? Math.max(...invoices.map(i => i.km)) : car.initialKm;
  
  const alertCount = proactiveStatus.pendingTasks.length + proactiveStatus.upcomingDeadlines.length;

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

  const handleDelete = async () => {
    if (!viewingInvoice) return;
    if (confirm('Voulez-vous supprimer ce document ?')) {
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
        
        {/* COMMAND CENTER OPTIMISÉ VISUELLEMENT */}
        <div className="bg-nsp-card border border-nsp-border rounded-[3.5rem] p-6 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-48 h-48 bg-nsp-primary/5 blur-[60px] rounded-full"></div>
           
           <div className="flex flex-col gap-8 relative z-10">
              {/* Header du bloc */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-nsp-primary/20 rounded-lg">
                    <Sparkles size={14} className="text-nsp-primary animate-pulse" />
                  </div>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Diagnostic IA Pro</span>
                </div>
                <div className="bg-nsp-success/10 px-3 py-1 rounded-full border border-nsp-success/20 flex items-center gap-2">
                   <ShieldCheck size={12} className="text-nsp-success" />
                   <span className="text-[8px] text-nsp-success font-black uppercase tracking-widest">Certifié Cloud</span>
                </div>
              </div>

              {/* Jauge Centrale & Score */}
              <div className="flex items-center gap-8">
                 <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                       <circle
                          cx="64"
                          cy="64"
                          r="54"
                          stroke="currentColor"
                          strokeWidth="10"
                          fill="transparent"
                          className="text-white/5"
                       />
                       <circle
                          cx="64"
                          cy="64"
                          r="54"
                          stroke="currentColor"
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 54}
                          strokeDashoffset={2 * Math.PI * 54 * (1 - proactiveStatus.healthScore / 100)}
                          strokeLinecap="round"
                          className={`transition-all duration-1000 ${proactiveStatus.healthScore > 80 ? 'text-nsp-success' : proactiveStatus.healthScore > 50 ? 'text-orange-500' : 'text-nsp-primary'}`}
                       />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className={`text-4xl font-black tracking-tighter leading-none ${proactiveStatus.healthScore > 80 ? 'text-nsp-success' : proactiveStatus.healthScore > 50 ? 'text-orange-500' : 'text-nsp-primary'}`}>
                          {proactiveStatus.healthScore}
                       </span>
                       <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">%</span>
                    </div>
                 </div>

                 <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-white font-black text-base uppercase tracking-tight leading-none mb-2">Etat du Véhicule</h4>
                      <div className="flex flex-wrap gap-2">
                        <div className="bg-white/5 px-2 py-1 rounded-md flex items-center gap-2 border border-white/5">
                           <TrendingUp size={10} className="text-nsp-success" />
                           <span className="text-[7px] text-white font-black uppercase">Moteur Opti</span>
                        </div>
                        <div className="bg-white/5 px-2 py-1 rounded-md flex items-center gap-2 border border-white/5">
                           <Target size={10} className="text-nsp-primary" />
                           <span className="text-[7px] text-white font-black uppercase">Révision OK</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-px bg-white/5 w-full"></div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                      Basé sur {invoices.length} factures et {car.initialKm.toLocaleString()} km initiaux.
                    </p>
                 </div>
              </div>

              {/* Stats Grid - Cartes du bas */}
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-nsp-input/40 backdrop-blur-md p-5 rounded-[2rem] border border-white/10 shadow-lg group hover:border-nsp-primary/30 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                       <Wallet size={14} className="text-nsp-primary" />
                       <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Valeur Argus</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white tracking-tighter">{proactiveStatus.estimatedValue.toLocaleString()}</span>
                      <span className="text-xs font-black text-nsp-primary">€</span>
                    </div>
                 </div>

                 <div className="bg-nsp-input/40 backdrop-blur-md p-5 rounded-[2rem] border border-white/10 shadow-lg group hover:border-nsp-primary/30 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                       <Calendar size={14} className="text-nsp-primary" />
                       <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Age du Parc</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white tracking-tighter">
                        {Math.floor((new Date().getTime() - new Date(car.firstRegistrationDate).getTime()) / (1000 * 60 * 60 * 24 * 365))}
                      </span>
                      <span className="text-xs font-black text-nsp-primary uppercase">Ans</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Grille de Navigation Quick-Access 2x3 */}
        <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'health', icon: <Wrench size={20}/>, label: 'Santé', color: 'text-green-500 bg-green-500/10', badge: alertCount },
              { id: 'tires', icon: <Gauge size={20}/>, label: 'Pneus', color: 'text-blue-400 bg-blue-400/10' },
              { id: 'fluids', icon: <Droplet size={20}/>, label: 'Fluides', color: 'text-yellow-400 bg-yellow-400/10' },
              { id: 'ct', icon: <ShieldCheck size={20}/>, label: 'C.T', color: 'text-orange-400 bg-orange-400/10' },
              { id: 'insurance', icon: <Shield size={20}/>, label: 'Assurance', color: 'text-purple-400 bg-purple-400/10' },
              { id: 'parts', icon: <PackageSearch size={20}/>, label: 'Pièces', color: 'text-gray-200 bg-gray-200/10' },
            ].map(item => (
              <button key={item.id} onClick={() => setActiveReport(item.id as any)} className="bg-nsp-card border border-nsp-border rounded-2xl p-4 flex flex-col items-center text-center shadow-lg active:scale-95 transition-all relative">
                {item.badge ? (
                   <div className="absolute top-2 right-2 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border border-nsp-card animate-pulse z-10">
                     {item.badge}
                   </div>
                ) : null}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${item.color}`}>{item.icon}</div>
                <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
        </div>

        {/* Diagnostic Banner */}
        <div className={`relative overflow-hidden rounded-[2.5rem] border p-8 shadow-2xl ${proactiveStatus.status === 'critical' ? 'border-red-600 bg-red-900/10' : 'border-nsp-success/30 bg-green-900/10'}`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl bg-nsp-input ${proactiveStatus.status === 'critical' ? 'text-red-500' : 'text-nsp-primary'}`}><BellRing size={24} /></div>
            <div className="flex-1">
              <h3 className="font-black text-white text-[10px] uppercase tracking-[0.2em] mb-2">Conformité IA</h3>
              <p className="text-gray-200 text-sm font-bold leading-relaxed">{proactiveStatus.message}</p>
            </div>
          </div>
        </div>

        {/* SECTION DOSSIER OFFICIEL */}
        <div className="bg-nsp-card border border-nsp-border rounded-[2.5rem] p-6 space-y-5 shadow-xl">
           <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldCheck size={14} className="text-green-500" /> Dossier Certifié & Photos
           </h3>

           <div className="grid grid-cols-4 gap-2">
              <button 
                onClick={() => car.grayCardUrl && setViewingDoc({ title: 'Carte Grise', url: car.grayCardUrl })}
                className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 overflow-hidden relative ${car.grayCardUrl ? 'border-nsp-primary/30' : 'border-dashed border-white/5 opacity-30'}`}
              >
                {car.grayCardUrl ? <img src={safeBase64ToBlobUrl(car.grayCardUrl)} className="absolute inset-0 w-full h-full object-cover opacity-50" /> : <FileText size={18} className="text-gray-700" />}
                <span className="text-[7px] text-white font-black uppercase relative z-10">C. Grise</span>
              </button>

              <button 
                onClick={() => car.insurance?.greenCardUrl && setViewingDoc({ title: 'Carte Verte', url: car.insurance.greenCardUrl })}
                className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 overflow-hidden relative ${car.insurance?.greenCardUrl ? 'border-nsp-primary/30' : 'border-dashed border-white/5 opacity-30'}`}
              >
                {car.insurance?.greenCardUrl ? <img src={safeBase64ToBlobUrl(car.insurance.greenCardUrl)} className="absolute inset-0 w-full h-full object-cover opacity-50" /> : <Shield size={18} className="text-gray-700" />}
                <span className="text-[7px] text-white font-black uppercase relative z-10">Assurance</span>
              </button>

              {['front', 'back'].map(angle => (
                <button 
                  key={angle}
                  onClick={() => car.photos[angle as keyof typeof car.photos] && setViewingDoc({ title: angle.toUpperCase(), url: car.photos[angle as keyof typeof car.photos] as string })}
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 overflow-hidden relative ${car.photos[angle as keyof typeof car.photos] ? 'border-nsp-primary/30' : 'border-dashed border-white/5 opacity-30'}`}
                >
                  {car.photos[angle as keyof typeof car.photos] ? <img src={safeBase64ToBlobUrl(car.photos[angle as keyof typeof car.photos] as string)} className="absolute inset-0 w-full h-full object-cover opacity-50" /> : <ImageIcon size={18} className="text-gray-700" />}
                  <span className="text-[7px] text-white font-black uppercase relative z-10">{angle}</span>
                </button>
              ))}
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

      {/* RAPPORT TECHNIQUE ENRICHI AVEC CT & PIÈCES */}
      {activeReport && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-xl flex items-end animate-fade-in p-4">
          <div className="w-full bg-nsp-card rounded-[3rem] border border-white/10 p-8 pb-12 animate-slide-up max-h-[90vh] overflow-y-auto shadow-2xl no-scrollbar">
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-nsp-card/95 backdrop-blur-md z-10 py-2">
               <div className="flex items-center gap-4">
                 <div className="p-4 bg-nsp-input rounded-[1.5rem] text-nsp-primary shadow-inner">
                    {activeReport === 'health' && <Wrench size={28}/>}
                    {activeReport === 'tires' && <Gauge size={28}/>}
                    {activeReport === 'fluids' && <Droplet size={28}/>}
                    {activeReport === 'ct' && <ShieldCheck size={28}/>}
                    {activeReport === 'insurance' && <Shield size={28}/>}
                    {activeReport === 'parts' && <PackageSearch size={28}/>}
                 </div>
                 <div>
                    <h2 className="text-white font-black text-xl uppercase tracking-tighter">
                        {activeReport === 'ct' ? 'Contrôle Technique' : activeReport === 'insurance' ? 'Assurance' : activeReport === 'parts' ? 'Catalogue Pièces' : 'Rapport IA'}
                    </h2>
                    <p className="text-nsp-primary text-[8px] font-black uppercase tracking-[0.2em]">Analyses Automatiques {alertCount > 0 && `(${alertCount} ALERTES)`}</p>
                 </div>
               </div>
               <button onClick={() => setActiveReport(null)} className="p-3 bg-white/5 rounded-full text-white"><X size={24}/></button>
            </div>

            <div className="space-y-10">
               {/* SECTION SANTE DETAILLEE */}
               {activeReport === 'health' && (
                 <div className="space-y-6">
                    <div className="flex items-center gap-2 px-2">
                       <AlertCircle size={16} className="text-nsp-primary" />
                       <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Détail des vérifications IA</h4>
                    </div>
                    {proactiveStatus.pendingTasks.length === 0 && proactiveStatus.upcomingDeadlines.length === 0 ? (
                      <div className="p-6 bg-nsp-success/10 border border-nsp-success/20 rounded-2xl flex items-center gap-4">
                        <CheckCircle2 className="text-nsp-success" size={24} />
                        <p className="text-white font-bold text-xs">Aucune action immédiate requise. Votre véhicule est en parfaite santé.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {proactiveStatus.pendingTasks.map(task => (
                           <div key={task.id} className={`p-5 rounded-2xl border flex items-start gap-4 ${task.severity === 'high' ? 'bg-red-900/10 border-red-500/20' : 'bg-nsp-input border-white/5'}`}>
                              <div className={`p-2 rounded-xl ${task.severity === 'high' ? 'bg-red-500 text-white' : 'bg-nsp-primary text-white'}`}>
                                 <AlertTriangle size={16} />
                              </div>
                              <div className="flex-1">
                                 <p className="text-white font-black text-xs uppercase">{task.label}</p>
                                 <p className="text-[10px] text-gray-500 font-medium mt-1">{task.basis}</p>
                              </div>
                           </div>
                        ))}
                        {proactiveStatus.upcomingDeadlines.map(deadline => (
                           <div key={deadline.id} className="p-5 rounded-2xl border border-white/5 bg-nsp-input flex items-start gap-4">
                              <div className="p-2 rounded-xl bg-nsp-primary text-white">
                                 <Clock size={16} />
                              </div>
                              <div className="flex-1">
                                 <p className="text-white font-black text-xs uppercase">{deadline.label}</p>
                                 <p className="text-[10px] text-gray-500 font-medium mt-1">Échéance : {deadline.date}</p>
                              </div>
                           </div>
                        ))}
                      </div>
                    )}
                 </div>
               )}

               {/* SECTION CONTROLE TECHNIQUE */}
               {activeReport === 'ct' && (
                 <div className="space-y-6">
                    <div className="bg-nsp-input/50 p-6 rounded-[2rem] border border-white/5">
                       <p className="text-[9px] text-gray-500 font-black uppercase mb-1">Dernière visite</p>
                       <p className="text-white font-black text-xl">{proactiveStatus.lastCTInvoice?.date || 'Non trouvée'}</p>
                       <div className="mt-4 p-4 bg-nsp-primary/10 rounded-xl border border-nsp-primary/20">
                          <p className="text-nsp-primary font-black text-[9px] uppercase mb-1">Prochaine Échéance</p>
                          <p className="text-white font-black text-lg">{proactiveStatus.nextDeadline}</p>
                       </div>
                    </div>
                    {proactiveStatus.lastCTInvoice && (
                      <button 
                        onClick={() => setViewingInvoice(proactiveStatus.lastCTInvoice!)}
                        className="w-full bg-nsp-primary text-white py-5 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3 shadow-xl"
                      >
                        <FileText size={18} /> Voir le dernier rapport
                      </button>
                    )}
                 </div>
               )}

               {/* SECTION ASSURANCE */}
               {activeReport === 'insurance' && (
                 <div className="space-y-6">
                    <div className="bg-nsp-input/50 p-6 rounded-[2rem] border border-white/5 space-y-4">
                       <div>
                          <p className="text-[9px] text-gray-500 font-black uppercase mb-1">Contrat N°</p>
                          <p className="text-white font-black text-lg">{car.insurance?.contractNumber || 'Non renseigné'}</p>
                       </div>
                       <div>
                          <p className="text-[9px] text-gray-500 font-black uppercase mb-1">Assistance</p>
                          <p className="text-white font-black text-lg">{car.insurance?.assistancePhone || '0800...'}</p>
                       </div>
                    </div>
                    {car.insurance?.greenCardUrl && (
                      <button 
                        onClick={() => setViewingDoc({title: 'Carte Verte', url: car.insurance!.greenCardUrl!})}
                        className="w-full bg-nsp-success text-white py-5 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3 shadow-xl"
                      >
                        <Shield size={18} /> Voir Carte Verte
                      </button>
                    )}
                 </div>
               )}

               {/* SECTION CATALOGUE PIÈCES IA */}
               {activeReport === 'parts' && (
                 <div className="space-y-6">
                    <div className="flex items-center gap-2 px-2">
                       <SearchCode size={16} className="text-nsp-primary" />
                       <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Composants Identifiés</h4>
                    </div>
                    {proactiveStatus.allDetectedParts.length === 0 ? (
                       <div className="p-10 text-center border-2 border-dashed border-nsp-border rounded-3xl">
                          <p className="text-gray-600 font-black text-[10px] uppercase">Aucune pièce détectée par l'IA dans vos factures.</p>
                       </div>
                    ) : (
                      <div className="space-y-3">
                        {proactiveStatus.allDetectedParts.map((part, idx) => (
                          <div key={idx} className="bg-nsp-input p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                             <div>
                                <p className="text-white font-black text-sm uppercase">{part.name}</p>
                                {part.ref && <p className="text-nsp-primary font-black text-[10px] mt-1">REF: {part.ref}</p>}
                                <p className="text-[8px] text-gray-500 font-bold uppercase mt-1">Dernière pose : {part.date} ({part.km.toLocaleString()} KM)</p>
                             </div>
                             <div className="w-8 h-8 rounded-full bg-nsp-success/10 flex items-center justify-center text-nsp-success">
                                <CheckCircle2 size={16} />
                             </div>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
               )}

               {/* ANCIENS RAPPORTS (CONSTRUCTEUR) */}
               {['health', 'tires', 'fluids'].includes(activeReport!) && (
                 <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                          <ShieldCheck size={14} className="text-nsp-primary" /> Données Techniques
                       </h3>
                    </div>
                    {isLoadingSpecs ? <Loader2 className="animate-spin text-nsp-primary mx-auto" /> : (
                      <div className="grid grid-cols-2 gap-4">
                          {activeReport === 'fluids' && (
                            <div className="col-span-2 bg-nsp-input p-5 rounded-3xl border border-white/5 flex items-center gap-4">
                               <Droplet size={24} className="text-yellow-500" />
                               <div>
                                  <p className="text-white font-black text-sm uppercase">{specs?.oilType || '5W30'}</p>
                                  <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Spécification Recommandée</p>
                               </div>
                            </div>
                          )}
                          {activeReport === 'tires' && (
                             <>
                               <div className="bg-nsp-input p-5 rounded-3xl border border-white/5 text-center">
                                  <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Usure Estimée</p>
                                  <p className="text-white font-black text-xl">{proactiveStatus.tireHealth?.wearPercentage}%</p>
                               </div>
                               <div className="bg-nsp-input p-5 rounded-3xl border border-white/5 text-center">
                                  <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Pression AV/AR</p>
                                  <p className="text-white font-black text-lg">{specs?.tirePressureFront} / {specs?.tirePressureRear}</p>
                               </div>
                             </>
                          )}
                      </div>
                    )}
                 </section>
               )}
            </div>

            <button onClick={() => setActiveReport(null)} className="w-full bg-nsp-primary text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest mt-12">Fermer</button>
          </div>
        </div>
      )}

      {/* VISIONNEUSE DE DOCUMENTS */}
      {(viewingInvoice || viewingDoc) && (
        <div className="fixed inset-0 z-[2000] bg-black/98 flex flex-col pt-safe-top animate-fade-in">
          <header className="p-6 flex justify-between items-center bg-black/50 border-b border-white/10">
             <button onClick={() => {setViewingInvoice(null); setViewingDoc(null);}} className="p-3 bg-nsp-input rounded-xl text-white"><X size={24}/></button>
             <div className="text-center">
                <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">{viewingInvoice?.title || viewingDoc?.title}</h3>
                <p className="text-[9px] text-nsp-primary font-black uppercase mt-1">Coffre-fort Numérique</p>
             </div>
             <button onClick={() => window.open(base64ToRealBlobUrl((viewingInvoice?.imageUrl || viewingDoc?.url || ''), isPDF(viewingInvoice?.imageUrl || viewingDoc?.url) ? 'application/pdf' : 'image/jpeg'), '_blank')} className="p-3 bg-nsp-input rounded-xl text-white"><Maximize2 size={24}/></button>
          </header>
          
          <div className="flex-1 flex items-center justify-center p-4">
              {isPDF(viewingInvoice?.imageUrl || viewingDoc?.url) ? (
                <iframe src={base64ToRealBlobUrl((viewingInvoice?.imageUrl || viewingDoc?.url || ''), 'application/pdf')} className="w-full h-full rounded-2xl" />
              ) : (
                <img src={safeBase64ToBlobUrl(viewingInvoice?.imageUrl || viewingDoc?.url || '')} className="max-w-full max-h-full object-contain rounded-2xl" alt="Document" />
              )}
          </div>
        </div>
      )}
    </div>
  );
};
