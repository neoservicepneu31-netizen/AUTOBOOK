
import React, { useState } from 'react';
import { Car, User, NewsArticle, Invoice } from '../types';
import { Plus, Car as CarIcon, Bike, ChevronRight, LogOut, Newspaper, X, ArrowRight, FolderOpen, DownloadCloud, ShieldCheck } from 'lucide-react';

interface GarageScreenProps {
  user: User;
  cars: Car[];
  invoices: Invoice[];
  onSelectCar: (carId: string) => void;
  onViewInvoices: (carId: string) => void;
  onAddCar: () => void;
  onLogout: () => void;
  onBuyCar: () => void;
}

const NEWS_DATA: NewsArticle[] = [
  {
    id: '1',
    category: 'REGLEMENTATION',
    title: 'Malus 2025 : Nouveau barème',
    date: '02/12/2024',
    summary: 'Le seuil du malus CO2 s\'abaisse encore au 1er janvier. Les hybrides dans le viseur.',
    content: "Dès le 1er janvier 2025, le seuil de déclenchement du malus écologique passe de 118 g/km à 113 g/km. Le malus au poids est également revu à la baisse (1,6 tonne).",
    imageUrl: 'https://images.unsplash.com/photo-1532939163844-547f958e91b4?auto=format&fit=crop&q=80&w=800', 
    readTime: '2 min'
  }
];

export const GarageScreen: React.FC<GarageScreenProps> = ({ user, cars, invoices, onSelectCar, onViewInvoices, onAddCar, onLogout, onBuyCar }) => {
  const [showNews, setShowNews] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const getInvoicesCount = (carId: string) => {
    return invoices.filter(inv => inv.carId === carId).length;
  };

  return (
    <div className="min-h-full bg-nsp-bg flex flex-col">
      <div className="p-6 bg-nsp-card border-b border-nsp-border sticky top-0 z-20 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">Mon <span className="text-nsp-primary">Garage</span></h1>
            <p className="text-nsp-sub text-[10px] font-black uppercase tracking-widest">{user.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNews(true)} className="p-3 bg-nsp-input rounded-2xl text-white">
              <Newspaper size={20} />
            </button>
            <button onClick={onLogout} className="p-3 bg-nsp-input rounded-2xl text-nsp-sub hover:text-white">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
           <button onClick={onAddCar} className="flex-1 bg-nsp-primary text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
             <Plus size={16}/> Nouveau
           </button>
           <button onClick={onBuyCar} className="flex-1 bg-white/5 border border-white/10 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
             <DownloadCloud size={16}/> Importer
           </button>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto pb-32">
        {cars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-24 h-24 bg-nsp-input rounded-[2rem] flex items-center justify-center border-4 border-dashed border-nsp-border text-gray-700">
              <CarIcon size={48} />
            </div>
            <p className="text-gray-500 font-bold uppercase text-xs">Votre garage est vide</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {cars.map((car) => {
              const count = getInvoicesCount(car.id);
              return (
                <div key={car.id} className="bg-nsp-card rounded-[2.5rem] border border-nsp-border overflow-hidden shadow-2xl relative group">
                  <div className="h-44 w-full bg-nsp-input relative" onClick={() => onSelectCar(car.id)}>
                    {car.photos.front ? (
                      <img src={car.photos.front} alt={car.name} className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        {car.type === 'motorcycle' ? <Bike size={48} className="text-gray-800"/> : <CarIcon size={48} className="text-gray-800"/>}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-nsp-card via-transparent to-transparent"></div>
                    <div className="absolute top-4 left-4 bg-[#003399] text-white px-3 py-1.5 rounded-lg text-xs font-black tracking-widest shadow-xl">
                      {car.plate}
                    </div>
                  </div>

                  <div className="p-6 flex items-center justify-between" onClick={() => onSelectCar(car.id)}>
                    <div>
                      <h3 className="text-xl font-black text-white">{car.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{car.fuelType}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{car.initialKm.toLocaleString()} KM</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-nsp-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <ChevronRight size={24} />
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2 flex items-center gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onViewInvoices(car.id); }}
                      className="flex-1 bg-white/5 border border-white/10 hover:bg-nsp-primary hover:border-nsp-primary transition-all py-3 rounded-2xl flex items-center justify-center gap-3 text-white"
                    >
                      <FolderOpen size={18} className="text-nsp-primary group-hover:text-white" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Carnet de santé ({count})</span>
                    </button>
                    <div className="bg-nsp-input border border-nsp-border px-4 py-3 rounded-2xl flex items-center gap-2">
                       <ShieldCheck size={14} className="text-green-500" />
                       <span className="text-[9px] text-white font-black uppercase tracking-widest">Certifié</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNews && (
        <div className="fixed inset-0 z-50 bg-nsp-bg flex flex-col animate-slide-up">
           <div className="p-4 bg-nsp-card border-b border-nsp-border flex items-center justify-between pt-safe-top">
             <h2 className="text-xl font-bold text-white flex items-center gap-2"><Newspaper size={24} className="text-nsp-primary" /> Journal</h2>
             <button onClick={() => setShowNews(false)} className="p-2 bg-white/10 rounded-full text-white"><X size={24} /></button>
           </div>
           <div className="flex-1 overflow-y-auto p-4">
              {NEWS_DATA.map(article => (
                <div key={article.id} className="bg-nsp-card border border-nsp-border rounded-xl p-4 mb-4">
                  <h3 className="text-white font-bold mb-2">{article.title}</h3>
                  <p className="text-gray-400 text-sm">{article.summary}</p>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};
