
import React, { useState, useMemo } from 'react';
import { Car, Invoice } from '../types';
import { 
  ArrowLeft, Plus, Fuel, Wrench, ChevronRight, X, Trash2, Database, 
  Sparkles, FileText, Download, ShieldCheck, Maximize2, Minimize2, Loader2, Eye
} from 'lucide-react';
import { safeBase64ToBlobUrl, base64ToRealBlobUrl } from '../services/geminiService';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const filteredInvoices = useMemo(() => {
    const filtered = invoices.filter(inv => filter === 'all' || inv.type === filter);
    // Ensure uniqueness by ID just in case
    const unique = Array.from(new Map(filtered.map(i => [i.id, i])).values());
    return unique;
  }, [invoices, filter]);
  const totalSpend = invoices.reduce((acc, inv) => acc + inv.price, 0);

  const isPDF = (url?: string) => {
    if (!url) return false;
    return url.includes('application/pdf') || url.substring(0, 30).includes('JVBER');
  };

  const initialDocs = useMemo(() => {
    const docs = [];
    if (car.grayCardUrl) docs.push({ title: 'Carte Grise', url: car.grayCardUrl, type: 'OFFICIEL' });
    if (car.photos.front) docs.push({ title: 'Angle Avant', url: car.photos.front, type: 'IDENTITÉ' });
    if (car.photos.back) docs.push({ title: 'Angle Arrière', url: car.photos.back, type: 'IDENTITÉ' });
    if (car.photos.left) docs.push({ title: 'Angle Gauche', url: car.photos.left, type: 'IDENTITÉ' });
    if (car.photos.right) docs.push({ title: 'Angle Droit', url: car.photos.right, type: 'IDENTITÉ' });
    if (car.photos.engine) docs.push({ title: 'Compartiment Moteur', url: car.photos.engine, type: 'MÉCANIQUE' });
    car.photos.damages.forEach((dmg, idx) => {
      docs.push({ title: `Dommage #${idx + 1}`, url: dmg, type: 'ÉTAT' });
    });
    return docs;
  }, [car]);

  const handleDelete = async () => {
    if (!viewingItem?.id) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!viewingItem?.id) return;
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    try {
      await onDelete(viewingItem.id);
      setViewingItem(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-nsp-bg flex flex-col w-full relative overflow-hidden">
      <header className="bg-nsp-card border-b border-nsp-border p-6 pt-safe-top sticky top-0 z-40">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-3 bg-nsp-input rounded-2xl text-nsp-sub"><ArrowLeft size={20}/></button>
          <div className="text-center">
            <h2 className="text-lg font-black text-white uppercase tracking-widest leading-none">BIBLIOTHÈQUE</h2>
            <p className="text-[9px] text-nsp-primary font-black uppercase mt-1 tracking-widest">{car.name}</p>
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
                <Sparkles size={14} className="text-nsp-primary" />
                <span className="text-[9px] text-nsp-sub font-bold uppercase tracking-widest">Valeur certifiée du véhicule</span>
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
                      <img src={safeBase64ToBlobUrl(doc.url)} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt={doc.title} referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm uppercase tracking-tight">{doc.title}</h4>
                      <p className="text-[9px] text-nsp-primary font-black uppercase mt-1 tracking-widest">{doc.type}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-700 group-hover:text-white transition-colors" />
                </div>
              ))}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-nsp-border rounded-[2.5rem] bg-nsp-card/30">
              <Database size={40} className="mx-auto text-gray-800 mb-4" />
              <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Aucune pièce archivée</p>
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
                        <img src={safeBase64ToBlobUrl(inv.imageUrl)} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Scan" referrerPolicy="no-referrer" />
                      )
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${inv.type === 'fuel' ? 'text-blue-400' : 'text-nsp-primary'}`}>
                        {inv.type === 'fuel' ? <Fuel size={20}/> : <Wrench size={20}/>}
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-white font-bold text-sm uppercase truncate tracking-tight">{inv.title}</h4>
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

      {/* --- UNIFIED VIEWER (PDF RENDERING ENABLED) --- */}
      {viewingItem && (
        <div className="fixed inset-0 z-[1000] bg-black/98 flex flex-col animate-fade-in overflow-hidden pt-safe-top">
          <header className="flex justify-between items-center p-6 bg-black/80 border-b border-white/10 z-[1001]">
            <button 
              onClick={() => { setViewingItem(null); setIsZoomed(false); }} 
              className="p-3 bg-nsp-input rounded-2xl text-white hover:bg-nsp-primary transition-colors shadow-lg"
            >
              <X size={24}/>
            </button>
            <div className="text-center">
               <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] truncate max-w-[150px]">{viewingItem.title}</h3>
               <p className="text-[9px] text-nsp-primary font-black uppercase mt-1 tracking-widest">Archive Certifiée</p>
            </div>
            <div className="flex gap-2">
              {!isPDF(viewingItem.url) && (
                <button 
                  onClick={() => setIsZoomed(!isZoomed)} 
                  className={`p-3 rounded-2xl transition-all shadow-lg ${isZoomed ? 'bg-nsp-primary text-white' : 'bg-nsp-input text-white'}`}
                >
                  {isZoomed ? <Minimize2 size={24}/> : <Maximize2 size={24}/>}
                </button>
              )}
              <button 
                onClick={() => window.open(base64ToRealBlobUrl(viewingItem.url, isPDF(viewingItem.url) ? 'application/pdf' : 'image/png'), '_blank')}
                className="p-3 bg-nsp-input rounded-2xl text-white shadow-lg"
              >
                <Eye size={24}/>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden flex flex-col items-center justify-center bg-[#050505] p-4">
            <div className={`w-full h-full max-w-4xl bg-nsp-card rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden transition-all duration-300 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
                 onClick={() => !isPDF(viewingItem.url) && setIsZoomed(!isZoomed)}>
              {isPDF(viewingItem.url) ? (
                 <div className="w-full h-full bg-black relative">
                    <iframe 
                      src={base64ToRealBlobUrl(viewingItem.url, 'application/pdf') + '#toolbar=0&navpanes=0'} 
                      className="w-full h-full border-0"
                      title="PDF Doc"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(base64ToRealBlobUrl(viewingItem.url, 'application/pdf'), '_blank');
                        }}
                        className="bg-nsp-primary text-white px-8 py-3 rounded-full text-[10px] font-black uppercase flex items-center gap-2 shadow-2xl active:scale-95 transition-all"
                      >
                        <Eye size={16} /> Plein Écran PDF
                      </button>
                    </div>
                 </div>
              ) : (
                <img 
                  src={safeBase64ToBlobUrl(viewingItem.url)} 
                  className={`w-full h-full ${isZoomed ? 'object-cover' : 'object-contain'}`} 
                  alt="Document" 
                  referrerPolicy="no-referrer"
                />
              )}
              
              {!isZoomed && (
                <div className="absolute top-6 right-6">
                  <div className="bg-nsp-primary/90 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl border border-white/10 backdrop-blur-md">
                    <ShieldCheck size={16} /> Certifié IA
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-8 bg-nsp-card/90 backdrop-blur-xl border-t border-white/10 space-y-6 pb-safe-bottom">
               <div className="grid grid-cols-2 gap-4">
                  {viewingItem.price !== undefined && (
                    <div className="bg-nsp-input p-5 rounded-[1.5rem] border border-white/5">
                       <p className="text-[9px] text-gray-500 font-black uppercase mb-1 tracking-widest">Coût Entretien</p>
                       <p className="text-white font-black text-2xl tracking-tighter">{viewingItem.price.toLocaleString()} €</p>
                    </div>
                  )}
                  {viewingItem.km !== undefined && (
                    <div className="bg-nsp-input p-5 rounded-[1.5rem] border border-white/5">
                       <p className="text-[9px] text-gray-500 font-black uppercase mb-1 tracking-widest">Relevé KM</p>
                       <p className="text-white font-black text-2xl tracking-tighter">{viewingItem.km.toLocaleString()} KM</p>
                    </div>
                  )}
               </div>
               <div className="flex gap-4">
                  {viewingItem.id ? (
                    <button 
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 bg-red-600/10 text-red-500 p-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest border border-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      Supprimer
                    </button>
                  ) : null}
                  <button onClick={() => setViewingItem(null)} className="flex-1 bg-white/10 text-white p-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest border border-white/10 active:scale-95 transition-all">
                    Fermer
                  </button>
               </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-nsp-card w-full max-w-sm rounded-[2.5rem] border border-white/10 p-8 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-500">
                <Trash2 size={32} />
              </div>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 text-center">Supprimer l'archivage ?</h3>
            <p className="text-gray-400 text-sm font-medium leading-relaxed mb-8 text-center">
              Voulez-vous vraiment supprimer cet archivage ? Cette action est irréversible.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDelete} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Supprimer</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-500 hover:text-white">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
