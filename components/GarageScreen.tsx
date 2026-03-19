
import React, { useState, useEffect } from 'react';
import { Car, User, NewsArticle, Invoice } from '../types';
import { Plus, Car as CarIcon, Bike, ChevronRight, LogOut, Newspaper, X, ArrowRight, FolderOpen, DownloadCloud, ShieldCheck, Zap, Bell, BellRing, ShieldAlert, RefreshCw, Trash2 } from 'lucide-react';
import { requestNotificationPermission, checkVehicleHealthAndNotify } from '../services/notificationService';
import { calculateMaintenanceStatus } from '../services/mechanicRules';

const NEWS_DATA: NewsArticle[] = [
  {
    id: '1',
    category: 'REGLEMENTATION',
    title: 'Nouveau contrôle technique 2025',
    date: 'Aujourd\'hui',
    summary: 'Les points de contrôle sur les batteries électriques et hybrides se durcissent dès janvier.',
    content: "Dès le 1er janvier 2025, le seuil de déclenchement du malus écologique passe de 118 g/km à 113 g/km. Préparez votre passage au centre agréé pour éviter une contre-visite sur les éléments haute tension.",
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=800', 
    readTime: '2 min'
  },
  {
    id: '2',
    category: 'CONSEIL',
    title: 'Hiver : Pensez à vos pneus',
    date: 'Hier',
    summary: 'La Loi Montagne est active. Vérifiez vos équipements pour éviter l\'amende.',
    content: "La Loi Montagne oblige l'équipement de pneus hiver ou de chaînes dans certaines zones de montagne. Vérifiez vos dimensions de pneus dans votre rapport AutoBook pour commander les bons équipements.",
    imageUrl: 'https://images.unsplash.com/photo-1484136524693-231d5836d905?auto=format&fit=crop&q=80&w=800',
    readTime: '3 min'
  },
  {
    id: '3',
    category: 'ELECTRIQUE',
    title: 'Bornes de recharge : Le guide',
    date: 'Il y a 2 jours',
    summary: 'Trouvez les bornes les moins chères sur votre trajet cet été.',
    content: "Avec l'augmentation des tarifs de l'électricité, choisir le bon réseau de recharge est crucial. Nous comparons les tarifs de Tesla Superchargers, Ionity et Fastned pour vos longs trajets.",
    imageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=800',
    readTime: '4 min'
  },
  {
    id: '4',
    category: 'ECONOMIE',
    title: 'Bonus Éco 2025 : Ce qui change',
    date: 'Il y a 3 jours',
    summary: 'Le montant du bonus pour les véhicules électriques va être raboté.',
    content: "Le gouvernement prévoit une baisse du bonus écologique pour 2025. C'est peut-être le moment d'anticiper votre achat pour bénéficier des conditions actuelles plus avantageuses.",
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800',
    readTime: '3 min'
  },
  {
    id: '5',
    category: 'MARCHÉ',
    title: 'Vendre sa voiture au meilleur prix',
    date: 'Il y a 1 semaine',
    summary: 'Nos astuces pour booster la valeur de revente de votre véhicule.',
    content: "Un carnet d'entretien numérique complet comme AutoBook peut augmenter le prix de revente de votre véhicule de 10% à 15%. La transparence rassure les acheteurs et justifie un prix ferme.",
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800',
    readTime: '5 min'
  },
  {
    id: '6',
    category: 'CONSEIL',
    title: 'Niveau d\'huile : Le reflexe vital',
    date: 'Il y a 10 jours',
    summary: 'Comment vérifier son huile correctement sans passer au garage.',
    content: "Une simple vérification mensuelle peut sauver votre moteur. Attendez que le moteur soit froid, sur un terrain plat, et utilisez la jauge manuelle pour un résultat précis.",
    imageUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719c141?auto=format&fit=crop&q=80&w=800',
    readTime: '2 min'
  }
];

interface GarageScreenProps {
  user: User;
  cars: Car[];
  invoices: Invoice[];
  onSelectCar: (id: string) => void;
  onViewInvoices: (id: string) => void;
  onAddCar: () => void;
  onLogout: () => void;
  onBuyCar: () => void;
  onRefresh: () => void;
  onDeleteCar: (id: string) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const GarageScreen: React.FC<GarageScreenProps> = ({ user, cars, invoices, onSelectCar, onAddCar, onLogout, onBuyCar, onRefresh, onDeleteCar, onNotify }) => {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [showNotifyPrompt, setShowNotifyPrompt] = useState(false);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      setShowNotifyPrompt(true);
    }
    cars.forEach(car => {
      const carInvoices = invoices.filter(i => i.carId === car.id);
      checkVehicleHealthAndNotify(car, carInvoices, user.email);
    });
  }, [cars, invoices, user.email]);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setShowNotifyPrompt(false);
      onNotify('success', 'Notifications', "✅ Alertes activées ! Vous recevrez désormais vos rappels de révision et contrôle technique.");
    }
  };

  return (
    <div className="min-h-full bg-nsp-bg flex flex-col pb-20">
      <div className="p-6 bg-nsp-card border-b border-nsp-border sticky top-0 z-20 shadow-md">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">Mon <span className="text-nsp-primary">Garage</span></h1>
            <p className="text-nsp-sub text-[10px] font-black uppercase tracking-widest">{user.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {user.role === 'admin' && (
              <button 
                onClick={() => onSelectCar('admin_dashboard')} 
                className="p-3 bg-nsp-primary/20 rounded-2xl text-nsp-primary hover:bg-nsp-primary hover:text-white border border-nsp-primary/30 transition-all font-black text-[10px] uppercase px-4"
                title="Administration"
              >
                Admin
              </button>
            )}
            <button onClick={onRefresh} className="p-3 bg-nsp-input rounded-2xl text-nsp-success hover:text-white border border-white/5 transition-colors" title="Synchroniser">
              <RefreshCw size={20} />
            </button>
            <button onClick={onLogout} className="p-3 bg-nsp-input rounded-2xl text-nsp-sub hover:text-white border border-white/5 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <div className="flex gap-3">
           <button onClick={onAddCar} className="flex-1 bg-nsp-primary text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-[0_10px_20px_rgba(230,57,70,0.3)] flex items-center justify-center gap-2 active:scale-95 transition-all">
             <Plus size={18} strokeWidth={3}/> Nouveau véhicule
           </button>
           <button onClick={onBuyCar} className="flex-none aspect-square bg-white/5 border border-white/10 text-white p-4 rounded-2xl flex items-center justify-center active:scale-95 transition-all">
             <DownloadCloud size={20}/>
           </button>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-10 overflow-y-auto">
        {showNotifyPrompt && (
          <div className="bg-nsp-primary/10 border border-nsp-primary/30 p-5 rounded-[2.5rem] flex items-center gap-4 animate-bounce-subtle">
             <div className="p-3 bg-nsp-primary rounded-2xl text-white">
                <BellRing size={24} />
             </div>
             <div className="flex-1">
                <h4 className="text-white font-black text-[10px] uppercase tracking-widest">Activer les alertes ?</h4>
                <p className="text-gray-500 text-[9px] font-medium leading-tight mt-1">Ne ratez plus vos contrôles techniques et révisions constructeur.</p>
             </div>
             <button onClick={handleEnableNotifications} className="bg-white text-black px-4 py-2.5 rounded-xl font-black text-[9px] uppercase shadow-lg active:scale-95">ACTIVER</button>
          </div>
        )}

        {/* News Feed */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
             <h2 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">
               <Zap size={14} className="text-nsp-primary" /> Le Journal AutoBook
             </h2>
             <span className="bg-nsp-primary/20 text-nsp-primary text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Nouveau</span>
           </div>
           
           <div className="flex gap-5 overflow-x-auto no-scrollbar pb-6 -mx-2 px-2 scroll-smooth">
              {NEWS_DATA.map(article => (
                <div 
                  key={article.id} 
                  onClick={() => setSelectedArticle(article)}
                  className="flex-none w-[300px] bg-nsp-card rounded-[3rem] border border-nsp-border overflow-hidden shadow-2xl active:scale-[0.98] transition-all relative group"
                >
                  <div className="h-36 w-full relative overflow-hidden">
                    <img src={article.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" alt={article.title} referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-nsp-card via-transparent to-transparent"></div>
                    <div className="absolute top-4 left-4 bg-nsp-primary text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg">
                       {article.category}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-white font-black text-sm leading-tight mb-3 line-clamp-2 uppercase tracking-tight">{article.title}</h3>
                    <p className="text-gray-500 text-[10px] leading-relaxed line-clamp-2 font-medium">{article.summary}</p>
                    <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
                       <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest">{article.date}</span>
                       <span className="text-[9px] text-nsp-primary font-black uppercase flex items-center gap-1 group-hover:translate-x-1 transition-transform">Consulter <ArrowRight size={12}/></span>
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Car Section */}
        <div className="space-y-5">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Mes Véhicules</h2>
            <p className="text-[10px] text-gray-700 font-black uppercase">{cars.length} Véhicules</p>
          </div>
          {cars.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-nsp-card/30 rounded-[3rem] border-2 border-dashed border-nsp-border">
              <div className="w-20 h-20 bg-nsp-input rounded-[2rem] flex items-center justify-center text-gray-700">
                <CarIcon size={40} />
              </div>
              <p className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Votre garage est vide</p>
              <button onClick={onAddCar} className="text-nsp-primary font-black text-xs uppercase underline underline-offset-4">Ajouter maintenant</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {cars.map((car) => {
                const carInvoices = invoices.filter(i => i.carId === car.id);
                const health = calculateMaintenanceStatus(car, carInvoices);
                const alertCount = health.pendingTasks.length + health.upcomingDeadlines.length;

                return (
                  <div key={car.id} className="bg-nsp-card rounded-[3rem] border border-nsp-border overflow-hidden shadow-2xl relative group active:scale-[0.98] transition-all" onClick={() => onSelectCar(car.id)}>
                    <div className="h-52 w-full bg-nsp-input relative">
                      {car.photos.front ? (
                        <img src={car.photos.front} alt={car.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                          {car.type === 'motorcycle' ? <Bike size={48} className="text-gray-800"/> : <CarIcon size={48} className="text-gray-800"/>}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-nsp-card via-transparent to-transparent"></div>
                      <div className="absolute top-5 left-5 bg-[#003399] text-white px-4 py-2 rounded-xl text-xs font-black tracking-widest shadow-2xl border border-white/10">
                        {car.plate}
                      </div>
                      
                      {/* BADGE DE NOTIFICATION GARAGE */}
                      {alertCount > 0 && (
                        <div className="absolute top-5 right-5 z-20 bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-nsp-card shadow-lg animate-pulse">
                          {alertCount}
                        </div>
                      )}

                      <div className={`absolute top-5 ${alertCount > 0 ? 'right-14' : 'right-5'} bg-nsp-success text-white px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-2xl backdrop-blur-md`}>
                         <ShieldCheck size={12} /> Certifié IA
                      </div>
                    </div>

                    <div className="p-7 pt-2 flex items-center justify-between">
                      <div className="flex-1" onClick={() => onSelectCar(car.id)}>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{car.name}</h3>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-nsp-primary font-black uppercase tracking-widest">{car.fuelType}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-800"></span>
                          <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{car.initialKm.toLocaleString()} KM</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCar(car.id);
                          }}
                          className="w-12 h-12 bg-red-600/10 text-red-500 rounded-[1.2rem] flex items-center justify-center hover:bg-red-600 hover:text-white transition-all border border-red-500/20"
                          title="Supprimer le véhicule"
                        >
                          <Trash2 size={20} />
                        </button>
                        <div className="w-14 h-14 bg-nsp-primary rounded-[1.5rem] flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform" onClick={() => onSelectCar(car.id)}>
                          <ChevronRight size={28} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col pt-safe-top animate-fade-in overflow-hidden">
           <header className="p-6 flex justify-between items-center border-b border-white/10 bg-black/50 backdrop-blur-md">
              <button onClick={() => setSelectedArticle(null)} className="p-3 bg-nsp-input rounded-xl text-white"><X size={24}/></button>
              <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">{selectedArticle.category}</h3>
              <div className="w-12"></div>
           </header>
           <div className="flex-1 overflow-y-auto">
              <img src={selectedArticle.imageUrl} className="w-full aspect-video object-cover" alt={selectedArticle.title} referrerPolicy="no-referrer" />
              <div className="p-8 space-y-6">
                 <h2 className="text-4xl font-black text-white tracking-tighter leading-tight uppercase">{selectedArticle.title}</h2>
                 <div className="flex items-center gap-4 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                    <span className="bg-nsp-input px-3 py-1 rounded-full text-nsp-primary">{selectedArticle.date}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-800"></span>
                    <span>{selectedArticle.readTime} de lecture</span>
                 </div>
                 <p className="text-gray-300 text-lg font-medium leading-relaxed">{selectedArticle.summary}</p>
                 <div className="h-px bg-white/5 w-full"></div>
                 <p className="text-gray-400 leading-relaxed font-medium">{selectedArticle.content}</p>
                 <div className="bg-nsp-input p-6 rounded-[2rem] border border-white/5 mt-10">
                   <p className="text-gray-400 leading-relaxed italic text-sm">Information certifiée pour les membres AUTOBOOK. Restez informés des changements de réglementation pour éviter les amendes et optimiser la revente de votre véhicule.</p>
                 </div>
              </div>
           </div>
           <div className="p-6 pb-safe-bottom bg-black/80 backdrop-blur-md border-t border-white/10">
              <button onClick={() => setSelectedArticle(null)} className="w-full bg-nsp-primary text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
                J'ai compris
              </button>
           </div>
        </div>
      )}
    </div>
  );
};
