
import React, { useState } from 'react';
import { Car, Invoice } from '../types';
import { ArrowLeft, Plus, FileText, Search, Filter, Fuel, Wrench, ChevronRight, X, Calendar, Gauge, Trash2, Database, Sparkles, ZoomIn } from 'lucide-react';

interface InvoicesListScreenProps {
  car: Car;
  invoices: Invoice[];
  onBack: () => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export const InvoicesListScreen: React.FC<InvoicesListScreenProps> = ({ car, invoices, onBack, onAdd, onDelete }) => {
  const [filter, setFilter] = useState<'all' | 'maintenance' | 'fuel'>('all');
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const filteredInvoices = invoices.filter(inv => filter === 'all' || inv.type === filter);
  const totalSpend = filteredInvoices.reduce((acc, inv) => acc + inv.price, 0);

  return (
    <div className="h-[100dvh] bg-nsp-bg flex flex-col w-full relative overflow-hidden">
      <header className="bg-nsp-card border-b border-nsp-border p-6 pt-safe-top sticky top-0 z-40">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-3 bg-nsp-input rounded-2xl text-nsp-sub"><ArrowLeft size={20}/></button>
          <div className="text-center">
            <h2 className="text-lg font-black text-white uppercase tracking-widest leading-none">BIBLIOTHÈQUE</h2>
            <p className="text-[9px] text-nsp-primary font-black uppercase mt-1">{car.name}</p>
          </div>
          <button onClick={onAdd} className="p-3 bg-nsp-primary rounded-2xl text-white shadow-lg"><Plus size={20}/></button>
        </div>

        <div className="flex bg-nsp-input p-1 rounded-2xl">
          {(['all', 'maintenance', 'fuel'] as const).map(type => (
            <button 
              key={type}
              onClick={() => setFilter(type)}
              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === type ? 'bg-nsp-primary text-white shadow-md' : 'text-gray-500'}`}
            >
              {type === 'all' ? 'Tout' : type === 'maintenance' ? 'Entretien' : 'Carburant'}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-6">
        <div className="bg-gradient-to-br from-nsp-primary/20 to-nsp-card p-8 rounded-[2.5rem] border border-nsp-primary/20 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Dépenses Cumulées ({filteredInvoices.length} docs)</p>
            <h3 className="text-4xl font-black text-white tracking-tighter">{totalSpend.toLocaleString()}€</h3>
            <div className="mt-4 flex items-center gap-2">
              <Sparkles size={14} className="text-nsp-primary animate-pulse" />
              <span className="text-[9px] text-nsp-sub font-bold uppercase tracking-widest">Géré par Intelligence Artificielle</span>
            </div>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-nsp-primary/20 blur-[50px] rounded-full"></div>
        </div>

        <div className="space-y-3">
          {filteredInvoices.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-nsp-border rounded-[2.5rem]">
              <Database size={40} className="mx-auto text-gray-800 mb-4" />
              <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Aucun document classé</p>
            </div>
          ) : (
            filteredInvoices.map(inv => (
              <div 
                key={inv.id} 
                onClick={() => setViewingInvoice(inv)}
                className="bg-nsp-card p-5 rounded-3xl border border-nsp-border flex items-center justify-between group hover:border-nsp-primary transition-all active:scale-[0.98] shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-nsp-input relative shrink-0">
                    {inv.imageUrl ? (
                      <img src={inv.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Scan" />
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

      {viewingInvoice && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col animate-fade-in overflow-y-auto">
          <header className="flex justify-between items-center p-6 pt-safe-top bg-black/40 border-b border-white/5 sticky top-0 z-50">
            <button onClick={() => { setViewingInvoice(null); setIsFullscreen(false); }} className="p-3 bg-nsp-input rounded-2xl text-white"><X size={24}/></button>
            <div className="text-center">
               <h3 className="text-white font-black text-xs uppercase tracking-widest">EXAMEN DU DOCUMENT</h3>
               <p className="text-[9px] text-nsp-primary font-black uppercase mt-1">Archive Numérique Certifiée</p>
            </div>
            <div className="w-12"></div>
          </header>

          <div className="max-w-md mx-auto w-full p-6 space-y-8 pb-10">
            {viewingInvoice.imageUrl && (
              <div 
                className={`rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative transition-all duration-500 cursor-zoom-in ${isFullscreen ? 'fixed inset-4 z-[110] bg-black m-0 rounded-3xl' : ''}`}
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                <img 
                  src={viewingInvoice.imageUrl} 
                  className={`w-full transition-all duration-500 ${isFullscreen ? 'h-full object-contain' : 'h-auto max-h-[50vh] object-contain'}`} 
                  alt="Facture Originale" 
                />
                {!isFullscreen && (
                  <div className="absolute bottom-4 right-4 bg-black/60 p-3 rounded-full text-white backdrop-blur-md">
                    <ZoomIn size={20} />
                  </div>
                )}
                {isFullscreen && (
                  <button className="absolute top-4 right-4 bg-nsp-primary text-white p-3 rounded-full shadow-2xl">
                    <X size={24} />
                  </button>
                )}
              </div>
            )}

            {!isFullscreen && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-nsp-card p-6 rounded-[2rem] border border-nsp-border shadow-xl">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Dépense</p>
                    <p className="text-white font-black text-2xl">{viewingInvoice.price}€</p>
                  </div>
                  <div className="bg-nsp-card p-6 rounded-[2rem] border border-nsp-border shadow-xl">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Index KM</p>
                    <p className="text-white font-black text-2xl">{viewingInvoice.km.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-nsp-card p-6 rounded-[2.5rem] border border-nsp-border space-y-5 shadow-2xl">
                  <div className="flex items-center gap-3">
                      <Sparkles size={16} className="text-nsp-primary" />
                      <h5 className="text-[10px] text-white font-black uppercase tracking-widest">RAPPORT D'ANALYSE IA</h5>
                  </div>
                  
                  <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Date d'opération</span>
                        <span className="text-sm text-white font-bold">{viewingInvoice.date}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Établissement</span>
                        <span className="text-sm text-white font-bold uppercase truncate max-w-[180px] text-right">{viewingInvoice.title}</span>
                      </div>
                      
                      {viewingInvoice.detectedSpecs && Object.entries(viewingInvoice.detectedSpecs).map(([key, val]) => val && (
                        <div key={key} className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{key.replace(/Ref|Dimensions|Viscosity/g, '')}</span>
                          <span className="text-sm text-nsp-primary font-black uppercase">{val}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <button 
                  onClick={() => { if(confirm('Voulez-vous supprimer définitivement ce document de votre garage numérique ?')) { onDelete(viewingInvoice.id); setViewingInvoice(null); } }} 
                  className="w-full bg-red-600/10 text-red-500 font-black py-5 rounded-[2rem] text-[10px] uppercase tracking-widest border border-red-600/20 flex items-center justify-center gap-3 active:bg-red-600/20 transition-colors"
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
