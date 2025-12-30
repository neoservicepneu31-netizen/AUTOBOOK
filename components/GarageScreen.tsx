
import React, { useState } from 'react';
import { Car, User, NewsArticle, Invoice } from '../types';
import { Plus, Car as CarIcon, Bike, ChevronRight, LogOut, AlertCircle, CheckCircle2, Newspaper, X, Calendar, Clock, ArrowRight, FolderOpen, Files } from 'lucide-react';

interface GarageScreenProps {
  user: User;
  cars: Car[];
  invoices: Invoice[];
  onSelectCar: (carId: string) => void;
  onViewInvoices: (carId: string) => void;
  onAddCar: () => void;
  onLogout: () => void;
}

const NEWS_DATA: NewsArticle[] = [
  {
    id: '1',
    category: 'REGLEMENTATION',
    title: 'Malus 2025 : Nouveau barème',
    date: '02/12/2024',
    summary: 'Le seuil du malus CO2 s\'abaisse encore au 1er janvier. Les hybrides dans le viseur.',
    content: "Dès le 1er janvier 2025, le seuil de déclenchement du malus écologique passe de 118 g/km à 113 g/km. Le malus au poids est également revu à la baisse (1,6 tonne). De nombreux véhicules, y compris des hybrides simples, pourraient voir leur prix augmenter.",
    imageUrl: 'https://images.unsplash.com/photo-1532939163844-547f958e91b4?auto=format&fit=crop&q=80&w=800', 
    readTime: '2 min'
  },
  {
    id: '2',
    category: 'CONSEIL',
    title: 'Loi Montagne : Êtes-vous équipé ?',
    date: '01/11/2024',
    summary: 'Depuis le 1er novembre, les équipements hivernaux sont obligatoires dans 34 départements.',
    content: "Jusqu'au 31 mars, il est obligatoire de circuler avec 4 pneus hiver (ou 4 saisons homologués 3PMSF) ou de détenir des chaînes/chaussettes dans le coffre dans les zones de montagne.",
    imageUrl: 'https://images.unsplash.com/photo-1483304528321-0674f0040030?auto=format&fit=crop&q=80&w=800', 
    readTime: '3 min'
  }
];

export const GarageScreen: React.FC<GarageScreenProps> = ({ user, cars, invoices, onSelectCar, onViewInvoices, onAddCar, onLogout }) => {
  const [showNews, setShowNews] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.style.display = 'none';
    const parent = e.currentTarget.parentElement;
    if (parent) {
       parent.classList.add('bg-nsp-input', 'flex', 'items-center', 'justify-center');
       const fallback = document.createElement('div');
       fallback.className = 'flex flex-col items-center justify-center text-gray-500';
       fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H12c-.7 0-1.3.3-1.8.7-.9.9-2.2 2.3-2.2 2.3s-2.7.6-4.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/><path d="M15 17h-6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 11h2"/><path d="M17 11h2"/></svg>';
       parent.appendChild(fallback);
    }
  };

  const getInvoicesCount = (carId: string) => {
    return invoices.filter(inv => inv.carId === carId).length;
  };

  const renderNewsModal = () => (
    <div className="fixed inset-0 z-50 bg-nsp-bg flex flex-col animate-slide-up">
      <div className="p-4 bg-nsp-card border-b border-nsp-border flex items-center justify-between pt-safe-top">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Newspaper size={24} className="text-nsp-primary" /> 
          Le Journal Auto
        </h2>
        <button onClick={() => { setShowNews(false); setSelectedArticle(null); }} className="p-2 bg-white/10 rounded-full text-white">
          <X size={24} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full pb-safe-bottom">
        {selectedArticle ? (
          <div className="animate-fade-in space-y-6">
            <button onClick={() => setSelectedArticle(null)} className="text-sm text-gray-400 hover:text-white flex items-center gap-1 mb-4">
               <ArrowRight className="rotate-180" size={16} /> Retour
            </button>
            <div className="rounded-2xl overflow-hidden h-64 w-full relative bg-nsp-input">
               <img src={selectedArticle.imageUrl} className="w-full h-full object-cover" onError={handleImageError} alt={selectedArticle.title} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{selectedArticle.title}</h1>
              <p className="text-gray-300 leading-relaxed text-lg">{selectedArticle.content}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
             {NEWS_DATA.map((article) => (
               <div key={article.id} onClick={() => setSelectedArticle(article)} className="bg-nsp-card border border-nsp-border rounded-xl overflow-hidden cursor-pointer shadow-lg">
                  <div className="h-40 relative bg-nsp-input">
                     <img src={article.imageUrl} className="w-full h-full object-cover" onError={handleImageError} alt={article.title} />
                  </div>
                  <div className="p-4">
                     <h3 className="text-white font-bold text-lg">{article.title}</h3>
                     <p className="text-sm text-gray-400 line-clamp-2">{article.summary}</p>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-nsp-bg flex flex-col">
      <div className="p-6 bg-nsp-card border-b border-nsp-border sticky top-0 z-20 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">Mon <span className="text-nsp-primary">Garage</span></h1>
            <p className="text-nsp-sub text-[10px] font-black uppercase tracking-widest">{user.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNews(true)} className="p-3 bg-nsp-input rounded-2xl text-white relative">
              <Newspaper size={20} />
              <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-nsp-card animate-pulse"></div>
            </button>
            <button onClick={onLogout} className="p-3 bg-nsp-input rounded-2xl text-nsp-sub hover:text-white">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {cars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-24 h-24 bg-nsp-input rounded-[2rem] flex items-center justify-center border-4 border-dashed border-nsp-border">
              <CarIcon size={48} className="text-gray-700" />
            </div>
            <button onClick={onAddCar} className="bg-nsp-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl">
              AJOUTER UN VÉHICULE
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {cars.map((car) => {
              const count = getInvoicesCount(car.id);
              return (
                <div 
                  key={car.id} 
                  className="bg-nsp-card rounded-[2.5rem] border border-nsp-border overflow-hidden shadow-2xl group transition-all relative"
                >
                  <div className="h-40 w-full bg-nsp-input relative" onClick={() => onSelectCar(car.id)}>
                    {car.photos.front ? (
                      <img src={car.photos.front} alt={car.name} className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        {car.type === 'motorcycle' ? <Bike size={48} className="text-gray-800"/> : <CarIcon size={48} className="text-gray-800"/>}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-nsp-card to-transparent"></div>
                    <div className="absolute top-4 left-4 bg-[#003399] text-white px-3 py-1.5 rounded-lg text-xs font-black tracking-widest shadow-xl">
                      {car.plate}
                    </div>
                  </div>

                  <div className="p-6 flex items-center justify-between" onClick={() => onSelectCar(car.id)}>
                    <div>
                      <h3 className="text-xl font-black text-white group-hover:text-nsp-primary transition-colors">{car.name}</h3>
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
                      <span className="text-[10px] font-black uppercase tracking-widest">Documents ({count})</span>
                    </button>
                    
                    <div className="bg-nsp-input border border-nsp-border px-4 py-3 rounded-2xl flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${car.initialState.body === 'bad' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                       <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Santé</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-10 right-8 z-30">
        <button onClick={onAddCar} className="bg-nsp-primary text-white h-20 w-20 rounded-[2rem] shadow-[0_20px_40px_rgba(230,57,70,0.4)] flex items-center justify-center active:scale-90 transition-transform">
          <Plus size={36} />
        </button>
      </div>

      {showNews && renderNewsModal()}
    </div>
  );
};
