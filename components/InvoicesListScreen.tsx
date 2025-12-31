
import React, { useState, useMemo } from 'react';
import { Car, Invoice } from '../types';
import { ArrowLeft, Plus, Fuel, Wrench, ChevronRight, X, Trash2, Database, Sparkles, ZoomIn, FileText, Download, Eye, ShieldCheck, AlertCircle, Camera, Activity, AlertOctagon, FileBadge, Maximize2, Minimize2 } from 'lucide-react';
import { safeBase64ToBlobUrl } from '../services/geminiService';

interface InvoicesListScreenProps {
  car: Car;
  invoices: Invoice[];
  onBack: () => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export const InvoicesListScreen: React.FC<InvoicesListScreenProps> = ({ car, invoices, onBack, onAdd, onDelete }) => {
  const [filter, setFilter] = useState<'all' | 'maintenance' | 'fuel' | 'dossier'>('all');
  const [viewingItem, setViewingItem] = useState<{title: string, url: string, type?: string, price?: number, km?: number, date?: string, id?: string} | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const filteredInvoices = invoices.filter(inv => filter === 'all' || inv.type === filter);
  const totalSpend = invoices.reduce((acc, inv) => acc + inv.price, 0);

  const isPDF = (url?: string) => url?.includes('application/pdf') || (url?.length ? url.substring(0, 30).includes('JVBER') : false);

  const initialDocs = useMemo(() => {
    const docs = [];
    if (car.grayCardUrl) {
      docs.push({ title: 'Carte Grise', url: car.grayCardUrl, type: 'OFFICIEL' });
    }
    if (car.photos.front) docs.push({ title: 'Angle Avant', url: car.photos.front, type: 'IDENTITÉ' });
    if (car.photos.back) docs.push({ title: 'Angle Arrière', url: car.photos.back, type: 'IDENTITÉ' });
    if (car.photos.left) docs.push({ title: 'Angle Gauche', url: car.photos.left, type: 'IDENTITÉ' });
    if (car.photos.right) docs.push({ title: 'Angle Droit', url: car.photos.right, type: 'IDENTITÉ' });
    if (car.photos.engine) docs.push({ title: 'Compartiment Moteur', url: car.photos.engine, type: 'MÉCANIQUE' });
    
    car.photos.damages.forEach((dmg, idx) => {
      docs.push({ title: `Dommage signalé #${idx + 1}`, url: dmg, type: 'ÉTAT DES LIEUX' });
    });
    
    return docs;
  }, [car]);

  return (
    <div className="h-[100dvh] bg-nsp-bg flex flex-col w-full relative overflow-hidden">
      <header className="bg-nsp-card border-b border-nsp-border p-6 pt-safe-top sticky top-0 z-40">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-3 bg-nsp-input rounded-2xl text-nsp-sub"><ArrowLeft size={20}/></button>
          <div className="text-center">
            <h2 className="text-lg font-black text-white uppercase tracking-widest leading-none">DOCUMENTS</h2>
            <p className="text-[9px] text-nsp-primary font-black uppercase mt-1">{car.name}</p>
          </div>
          <button onClick={onAdd} className="p-3 bg-nsp-primary rounded-2xl text-white shadow-lg"><Plus size={20}/></button>
        </div>

        <div className="flex bg-nsp-input p-1 rounded-2xl overflow-x-auto no-scrollbar">
          {(['all', 'maintenance', 'fuel', 'dossier'] as const).map(type => (
            <button 
              key={type}
              onClick={() => setFilter(type)}
              className={`flex-1 py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === type ? 'bg-nsp-primary text-white shadow-md' : 'text-gray-500'}`}
            >
              {type === 'all' ? 'Tout' : type === 'maintenance' ? 'Entretien' : type === 'fuel' ? 'Carburant' : 'Dossier'}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-6">
        {filter !== 'dossier' && (
          <div className="bg-gradient-to-br from-nsp-primary/20 to-nsp-card p-8 rounded-[2.5rem] border border-nsp-primary/20 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Dépenses Cumulées ({filteredInvoices.length} docs)</p>
              <h3 className="text-4xl font-black text-white tracking-tighter">{totalSpend.toLocaleString()}€</h3>
              <div className="mt-4 flex items-center gap-2">
                <Sparkles size={14} className="text-nsp-primary animate-pulse" />
                <span className="text-[9px] text-nsp-sub font-bold uppercase tracking-widest">Archive Numérique Certifiée</span>
              </div>
            </div>
            <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-nsp-primary/20 blur-[50px] rounded-full"></div>
          </div>
        )}

        <div className="space-y-3">
          {filter === 'dossier' ? (
            <div className="grid grid-cols-1 gap-4">
              {initialDocs.map((doc, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setViewingItem({ title: doc.title, url: doc.url, type: doc.type })}
                  className="bg-nsp-card p-5 rounded-3xl border border-nsp-border flex items-center justify-between group hover:border-nsp-primary transition-all active:scale-[0.98] shadow-lg cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-nsp-input relative shrink-0 flex items-center justify-center border border-white/5">
                      <img src={safeBase64ToBlobUrl(doc.url)} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt={doc.title} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm uppercase">{doc.title}</h4>
                      <p className="text-[9px] text-nsp-primary font-black uppercase mt-1 tracking-widest">{doc.type}</p>
                    </div>
                  </div>
                  <div className="bg-nsp-input p-2.5 rounded-xl text-gray-600 group-hover:text-white transition-colors">
                    <ChevronRight size={18} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-nsp-border rounded-[2.5rem]">
              <Database size={40} className="mx-auto text-gray-800 mb-4" />
              <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Aucun document classé</p>
            </div>
          ) : (
            filteredInvoices.map(inv => (
              <div 
                key={inv.id} 
                onClick={() => setViewingItem({ 
                  id: inv.id,
                  title: inv.title, 
                  url: inv.imageUrl || '', 
                  price: inv.price, 
                  km: inv.km, 
                  date: inv.date 
                })}
                className="bg-nsp-card p-5 rounded-3xl border border-nsp-border flex items-center justify-between group hover:border-nsp-primary transition-all active:scale-[0.98] shadow-lg cursor-pointer"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-nsp-input relative shrink-0 flex items-center justify-center border border-white/5">
                    {inv.imageUrl ? (
                      isPDF(inv.imageUrl) ? (
                        <FileText size={24} className="text-red-500" />
                      ) : (
                        <img src={safeBase64ToBlobUrl(inv.imageUrl)} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Scan" />
                      )
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${inv.type === 'fuel' ? 'text-blue-400' : 'text-nsp-primary'}`}>
                        {inv.type === 'fuel' ? <Fuel size={20}/> : <Wrench size={20}/>}
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-white font-bold text-sm uppercase truncate">{inv.title}</h4>
                    <p className="text-[10px] text-gray-500 mt-1">{inv.date} • {inv.km.toLocaleString()} KM</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white font-black text-sm">{inv.price}€</p>
                  <ChevronRight size={16} className="text-gray-700 ml-auto mt-1" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* VISIONNEUSE UNIFIÉE ULTRA-ROBUSTE (Z-INDEX 999) */}
      {viewingItem && (
        <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-2xl flex flex-col animate-fade-in overflow-hidden">
          <header className="flex justify-between items-center p-6 pt-safe-top bg-black/80 border-b border-white/10 z-[1001]">
            <button 
              onClick={() => { setViewingItem(null); setIsFullscreen(false); }} 
              className="p-3 bg-nsp-input rounded-2xl text-white hover:bg-nsp-primary transition-colors"
            >
              <X size={24}/>
            </button>
            <div className="text-center">
               <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">{viewingItem.title}</h3>
               <p className="text-[9px] text-nsp-primary font-black uppercase mt-1 tracking-widest">Archive Numérique Certifiée</p>
            </div>
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)} 
              className="p-3 bg-nsp-input rounded-2xl text-white"
            >
              {isFullscreen ? <Minimize2 size={24}/> : <Maximize2 size={24}/>}
            </button>
          </header>

          <div className={`flex-1 overflow-y-auto p-4 md:p-10 flex flex-col items-center ${isFullscreen ? 'p-0' : ''}`}>
            <div className={`w-full max-w-4xl transition-all duration-300 ${isFullscreen ? 'h-full max-w-none' : 'space-y-8'}`}>
              
              <div className={`rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0a0a0a] relative group ${isFullscreen ? 'rounded-none border-0 h-full flex items-center justify-center' : 'min-h-[50vh]'}`}>
                {isPDF(viewingItem.url) ? (
                  <div className="w-full h-full min-h-[70vh] flex flex-col items-center justify-center p-10 gap-6">
                    <FileText size={80} className="text-red-500 animate-pulse" />
                    <p className="text-white font-black text-xs uppercase tracking-widest">Document PDF</p>
                    <a 
                      href={safeBase64ToBlobUrl(viewingItem.url)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-white text-black px-10 py-5 rounded-full font-black text-xs uppercase shadow-2xl active:scale-95 transition-all flex items-center gap-3"
                    >
                      <Download size={20} /> Ouvrir en Plein Écran
                    </a>
                  </div>
                ) : (
                  <img 
                    src={safeBase64ToBlobUrl(viewingItem.url)} 
                    className={`w-full h-auto mx-auto block transition-transform ${isFullscreen ? 'max-h-full object-contain' : 'max-h-[85vh] object-contain'}`} 
                    alt="Document" 
                  />
                )}
                
                {!isFullscreen && (
                  <div className="absolute top-6 right-6">
                    <div className="bg-nsp-primary/90 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl border border-white/10">
                      <ShieldCheck size={16} /> Authentifié
                    </div>
                  </div>
                )}
              </div>

              {!isFullscreen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                  {viewingItem.price !== undefined && (
                    <div className="bg-nsp-card p-8 rounded-[2.5rem] border border-nsp-border shadow-2xl flex flex-col gap-2">
                       <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Montant de la dépense</span>
                       <span className="text-3xl text-white font-black tracking-tighter">{viewingItem.price.toLocaleString()}€</span>
                    </div>
                  )}
                  {viewingItem.km !== undefined && (
                    <div className="bg-nsp-card p-8 rounded-[2.5rem] border border-nsp-border shadow-2xl flex flex-col gap-2">
                       <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Relevé Kilométrique</span>
                       <span className="text-3xl text-white font-black tracking-tighter">{viewingItem.km.toLocaleString()} KM</span>
                    </div>
                  )}
                  
                  <div className="bg-nsp-card p-8 rounded-[2.5rem] border border-nsp-border shadow-2xl md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                       <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Date d'archivage</span>
                       <span className="text-sm text-white font-bold">{viewingItem.date || 'Non spécifiée'}</span>
                    </div>
                    <div className="flex gap-4">
                      <a 
                        href={safeBase64ToBlobUrl(viewingItem.url)} 
                        download={`AUTOBOOK_${viewingItem.title.replace(/\s+/g, '_')}.jpg`}
                        className="flex-1 bg-white/10 text-white p-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest border border-white/5 flex items-center justify-center gap-3 active:scale-95 transition-all"
                      >
                        <Download size={18} /> Télécharger
                      </a>
                      {viewingItem.id && (
                        <button 
                          onClick={() => { if(confirm('Supprimer définitivement ce document ?')) { onDelete(viewingItem.id!); setViewingItem(null); } }} 
                          className="bg-red-600/10 text-red-500 p-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest border border-red-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
