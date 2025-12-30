
import React, { useState } from 'react';
import { Car, Invoice } from '../types';
import { ArrowLeft, Plus, Fuel, Wrench, ChevronRight, X, Trash2, Database, Sparkles, ZoomIn, FileText, Download, Eye, ShieldCheck, AlertCircle } from 'lucide-react';

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

  const isPDF = (url?: string) => url?.includes('application/pdf');

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
              <span className="text-[9px] text-nsp-sub font-bold uppercase tracking-widest">Données Archivées par IA</span>
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
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-nsp-input relative shrink-0 flex items-center justify-center">
                    {inv.imageUrl ? (
                      isPDF(inv.imageUrl) ? (
                        <FileText size={24} className="text-red-500" />
                      ) : (
                        <img src={inv.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Scan" />
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

      {/* VISIONNEUSE AMÉLIORÉE */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-fade-in overflow-y-auto">
          <header className="flex justify-between items-center p-6 pt-safe-top bg-black/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
            <button onClick={() => { setViewingInvoice(null); setIsFullscreen(false); }} className="p-3 bg-nsp-input rounded-2xl text-white"><X size={24}/></button>
            <div className="text-center">
               <h3 className="text-white font-black text-xs uppercase tracking-widest">EXAMEN DU DOCUMENT</h3>
               <p className="text-[9px] text-nsp-primary font-black uppercase mt-1">Analyse & Extraction Certifiée</p>
            </div>
            <div className="w-12"></div>
          </header>

          <div className="max-w-2xl mx-auto w-full p-6 space-y-8 pb-32">
            {/* DOCUMENT ORIGINAL */}
            <div className="space-y-4">
              <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-2">
                <Eye size={14} /> Document Original
              </h4>
              <div className="rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-nsp-input relative">
                {isPDF(viewingInvoice.imageUrl) ? (
                  <div className="aspect-[3/4] flex flex-col items-center justify-center p-10 text-center gap-6">
                    <div className="w-24 h-24 bg-red-600/10 rounded-full flex items-center justify-center text-red-500 border border-red-500/20">
                      <FileText size={56} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-white font-black text-lg uppercase leading-none">DOCUMENT PDF</p>
                      <p className="text-gray-500 text-[10px] font-bold uppercase max-w-[200px]">Ce fichier est stocké en haute définition.</p>
                    </div>
                    <a 
                      href={viewingInvoice.imageUrl} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white text-black px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-2xl active:scale-95 transition-all"
                    >
                      <Download size={18} /> Télécharger / Voir le PDF
                    </a>
                  </div>
                ) : viewingInvoice.imageUrl ? (
                  <div className="relative">
                    <img 
                      src={viewingInvoice.imageUrl} 
                      className="w-full h-auto max-h-[80vh] object-contain mx-auto block" 
                      alt="Facture Originale" 
                    />
                    <div className="absolute top-4 right-4">
                      <div className="bg-nsp-primary/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl">
                        <ShieldCheck size={14} /> Certifié IA
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[3/4] flex flex-col items-center justify-center text-gray-700 gap-4">
                    <AlertCircle size={48} />
                    <p className="text-[10px] font-black uppercase">Visuel indisponible</p>
                  </div>
                )}
              </div>
            </div>

            {/* DONNÉES EXTRAITES (DOC CORRIGÉ) */}
            <div className="space-y-4">
              <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={14} className="text-nsp-primary" /> Rapport d'Expertise IA
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-nsp-card p-6 rounded-[2rem] border border-nsp-border shadow-xl">
                  <p className="text-[9px] text-gray-500 uppercase font-black mb-1">Montant Payé</p>
                  <p className="text-white font-black text-2xl">{viewingInvoice.price.toLocaleString()}€</p>
                </div>
                <div className="bg-nsp-card p-6 rounded-[2rem] border border-nsp-border shadow-xl">
                  <p className="text-[9px] text-gray-500 uppercase font-black mb-1">Kilométrage</p>
                  <p className="text-white font-black text-2xl">{viewingInvoice.km.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-nsp-card p-8 rounded-[2.5rem] border border-nsp-border space-y-6 shadow-2xl relative overflow-hidden">
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Date Document</span>
                    <span className="text-sm text-white font-bold">{new Date(viewingInvoice.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Garage / Enseigne</span>
                    <span className="text-sm text-white font-bold uppercase truncate max-w-[200px] text-right">{viewingInvoice.title}</span>
                  </div>
                  
                  {viewingInvoice.detectedSpecs && Object.entries(viewingInvoice.detectedSpecs).map(([key, val]) => val && (
                    <div key={key} className="flex justify-between items-center border-b border-white/5 pb-3">
                      <span className="text-[10px] text-nsp-primary/60 font-black uppercase tracking-widest">{key.replace(/Ref|Dimensions|Viscosity/g, '')}</span>
                      <span className="text-sm text-nsp-primary font-black uppercase">{val}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                   <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Synthèse validée par le moteur de diagnostic NSP</p>
                </div>
              </div>

              <button 
                onClick={() => { if(confirm('Supprimer définitivement ce document ?')) { onDelete(viewingInvoice.id); setViewingInvoice(null); } }} 
                className="w-full bg-red-600/10 text-red-500 font-black py-5 rounded-[2rem] text-[10px] uppercase tracking-widest border border-red-600/20 flex items-center justify-center gap-3 active:bg-red-600/20 transition-all shadow-xl"
              >
                <Trash2 size={16} /> SUPPRIMER L'ARCHIVE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
