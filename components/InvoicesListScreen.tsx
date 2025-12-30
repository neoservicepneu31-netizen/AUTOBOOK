
import React, { useState, useMemo } from 'react';
import { Car, Invoice } from '../types';
import { ArrowLeft, Plus, Fuel, Wrench, ChevronRight, X, Trash2, Database, Sparkles, ZoomIn, FileText, Download, Eye, ShieldCheck, AlertCircle, Camera, Activity, AlertOctagon, FileBadge } from 'lucide-react';
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
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [viewingInitialDoc, setViewingInitialDoc] = useState<{title: string, url: string, type: string} | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const filteredInvoices = invoices.filter(inv => filter === 'all' || inv.type === filter);
  const totalSpend = invoices.reduce((acc, inv) => acc + inv.price, 0);

  const isPDF = (url?: string) => url?.includes('application/pdf');

  // Génération du dossier initial à partir de l'objet Car
  const initialDocs = useMemo(() => {
    const docs = [];
    if (car.grayCardUrl) {
      docs.push({ title: 'Carte Grise', url: car.grayCardUrl, type: 'OFFICIEL', icon: <FileBadge size={20}/> });
    }
    if (car.photos.front) docs.push({ title: 'Angle Avant', url: car.photos.front, type: 'IDENTITÉ', icon: <Camera size={20}/> });
    if (car.photos.back) docs.push({ title: 'Angle Arrière', url: car.photos.back, type: 'IDENTITÉ', icon: <Camera size={20}/> });
    if (car.photos.left) docs.push({ title: 'Angle Gauche', url: car.photos.left, type: 'IDENTITÉ', icon: <Camera size={20}/> });
    if (car.photos.right) docs.push({ title: 'Angle Droit', url: car.photos.right, type: 'IDENTITÉ', icon: <Camera size={20}/> });
    if (car.photos.engine) docs.push({ title: 'Compartiment Moteur', url: car.photos.engine, type: 'MÉCANIQUE', icon: <Activity size={20}/> });
    
    car.photos.damages.forEach((dmg, idx) => {
      docs.push({ title: `Dommage signalé #${idx + 1}`, url: dmg, type: 'ÉTAT DES LIEUX', icon: <AlertOctagon size={20}/> });
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
              <div className="flex items-center gap-2 mb-2 ml-2">
                <ShieldCheck size={16} className="text-nsp-primary" />
                <h3 className="text-[10px] text-white font-black uppercase tracking-[0.2em]">Identification d'Origine</h3>
              </div>
              {initialDocs.map((doc, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setViewingInitialDoc(doc)}
                  className="bg-nsp-card p-5 rounded-3xl border border-nsp-border flex items-center justify-between group hover:border-nsp-primary transition-all active:scale-[0.98] shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-nsp-input relative shrink-0 flex items-center justify-center">
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
                onClick={() => setViewingInvoice(inv)}
                className="bg-nsp-card p-5 rounded-3xl border border-nsp-border flex items-center justify-between group hover:border-nsp-primary transition-all active:scale-[0.98] shadow-lg"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-nsp-input relative shrink-0 flex items-center justify-center">
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

      {/* VISIONNEUSE COMMUNE POUR INVOICES ET DOSSIER */}
      {(viewingInvoice || viewingInitialDoc) && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-fade-in overflow-y-auto">
          <header className="flex justify-between items-center p-6 pt-safe-top bg-black/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
            <button onClick={() => { setViewingInvoice(null); setViewingInitialDoc(null); setIsFullscreen(false); }} className="p-3 bg-nsp-input rounded-2xl text-white"><X size={24}/></button>
            <div className="text-center">
               <h3 className="text-white font-black text-xs uppercase tracking-widest">
                {viewingInitialDoc ? 'DOSSIER VÉHICULE' : 'EXAMEN DOCUMENT'}
               </h3>
               <p className="text-[9px] text-nsp-primary font-black uppercase mt-1">Archive Certifiée NSP</p>
            </div>
            <div className="w-12"></div>
          </header>

          <div className="max-w-2xl mx-auto w-full p-6 space-y-8 pb-32">
            <div className="space-y-4">
              <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-2">
                <Eye size={14} /> {viewingInitialDoc ? viewingInitialDoc.title : viewingInvoice?.title}
              </h4>
              <div className="rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-nsp-input relative">
                {viewingInvoice && isPDF(viewingInvoice.imageUrl) ? (
                  <div className="w-full">
                    <iframe 
                      src={viewingInvoice.imageUrl} 
                      className="w-full h-[60vh] border-0 rounded-t-[2.5rem]" 
                      title="PDF Preview"
                    />
                    <div className="p-8 bg-black/40 text-center gap-6 flex flex-col items-center">
                       <a 
                        href={viewingInvoice.imageUrl} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white text-black px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-2xl active:scale-95 transition-all"
                      >
                        <Download size={18} /> Voir Plein Écran
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <img 
                      src={safeBase64ToBlobUrl(viewingInitialDoc ? viewingInitialDoc.url : viewingInvoice?.imageUrl || '')} 
                      className="w-full h-auto max-h-[80vh] object-contain mx-auto block" 
                      alt="Archive" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800?text=Erreur+Affichage';
                      }}
                    />
                    <div className="absolute top-4 right-4">
                      <div className="bg-nsp-primary/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl">
                        <ShieldCheck size={14} /> {viewingInitialDoc ? 'Identification' : 'Certifié IA'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {viewingInvoice && (
              <div className="space-y-4">
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
                    {viewingInvoice.type === 'maintenance' && (
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Intervention</span>
                        <span className="text-sm text-white font-bold uppercase truncate max-w-[200px] text-right">{viewingInvoice.title}</span>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => { if(confirm('Supprimer définitivement ce document ?')) { onDelete(viewingInvoice.id); setViewingInvoice(null); } }} 
                    className="w-full bg-red-600/10 text-red-500 font-black py-5 rounded-[2rem] text-[10px] uppercase tracking-widest border border-red-600/20 flex items-center justify-center gap-3"
                  >
                    <Trash2 size={16} /> SUPPRIMER L'ARCHIVE
                  </button>
                </div>
              </div>
            )}

            {viewingInitialDoc && (
               <div className="bg-nsp-card p-8 rounded-[2.5rem] border border-nsp-border shadow-2xl text-center space-y-4">
                  <div className="w-12 h-12 bg-nsp-primary/10 rounded-2xl flex items-center justify-center text-nsp-primary mx-auto">
                    {viewingInitialDoc.icon}
                  </div>
                  <h4 className="text-white font-black text-sm uppercase tracking-widest">{viewingInitialDoc.title}</h4>
                  <p className="text-gray-500 text-[10px] font-bold uppercase leading-relaxed">
                    Ce document fait partie du dossier d'identité scellé lors de l'enregistrement du véhicule.
                  </p>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
