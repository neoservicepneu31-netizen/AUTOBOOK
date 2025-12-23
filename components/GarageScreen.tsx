
import React, { useState } from 'react';
import { Car, User, NewsArticle } from '../types';
import { Plus, Car as CarIcon, Bike, ChevronRight, LogOut, AlertCircle, CheckCircle2, Newspaper, X, Calendar, Clock, ArrowRight, ImageOff } from 'lucide-react';

interface GarageScreenProps {
  user: User;
  cars: Car[];
  onSelectCar: (carId: string) => void;
  onAddCar: () => void;
  onLogout: () => void;
}

// Données Mockées pour le Journal (Actualisées < 6 mois)
const NEWS_DATA: NewsArticle[] = [
  {
    id: '1',
    category: 'REGLEMENTATION',
    title: 'Malus 2025 : Nouveau barème',
    date: '02/12/2024',
    summary: 'Le seuil du malus CO2 s\'abaisse encore au 1er janvier. Les hybrides dans le viseur.',
    content: "Dès le 1er janvier 2025, le seuil de déclenchement du malus écologique passe de 118 g/km à 113 g/km. Le malus au poids est également revu à la baisse (1,6 tonne). De nombreux véhicules, y compris des hybrides simples, pourraient voir leur prix augmenter. Pensez à immatriculer votre véhicule avant la fin de l'année si possible.",
    imageUrl: 'https://images.unsplash.com/photo-1532939163844-547f958e91b4?auto=format&fit=crop&q=80&w=800', 
    readTime: '2 min'
  },
  {
    id: '2',
    category: 'CONSEIL',
    title: 'Loi Montagne : Êtes-vous équipé ?',
    date: '01/11/2024',
    summary: 'Depuis le 1er novembre, les équipements hivernaux sont obligatoires dans 34 départements.',
    content: "Jusqu'au 31 mars, il est obligatoire de circuler avec 4 pneus hiver (ou 4 saisons homologués 3PMSF) ou de détenir des chaînes/chaussettes dans le coffre dans les zones de montagne (Alpes, Pyrénées, Massif Central, Jura, Vosges). En cas d'absence d'équipement, l'amende est de 135€ et l'immobilisation possible.",
    imageUrl: 'https://images.unsplash.com/photo-1483304528321-0674f0040030?auto=format&fit=crop&q=80&w=800', 
    readTime: '3 min'
  },
  {
    id: '3',
    category: 'NOUVEAUTE',
    title: 'Le Permis Numérique généralisé',
    date: '15/10/2024',
    summary: 'Fini le permis oublié : vous pouvez désormais le présenter officiellement sur votre smartphone.',
    content: "L'application France Identité permet d'importer votre permis de conduire (format rose ou carte). Ce permis numérique a la même valeur légale que le physique lors d'un contrôle routier en France. Il permet aussi de générer des justificatifs de droits à conduire pour les loueurs.",
    imageUrl: 'https://images.unsplash.com/photo-1556656793-02715d8dd660?auto=format&fit=crop&q=80&w=800', 
    readTime: '1 min'
  },
  {
    id: '4',
    category: 'ALERT',
    title: 'Rappel Constructeurs : Airbags',
    date: '28/11/2024',
    summary: 'La campagne de rappel Takata s\'étend. Vérifiez si votre véhicule est concerné.',
    content: "Plusieurs constructeurs (Citroën, DS, Opel, mais aussi BMW et Audi sur certains anciens modèles) continuent de rappeler des véhicules équipés d'airbags Takata potentiellement dangereux en milieu chaud et humide. Vérifiez votre numéro de série (VIN) sur le site du constructeur. L'intervention est 100% prise en charge.",
    imageUrl: 'https://images.unsplash.com/photo-1632823471565-1ec2a1ad4015?auto=format&fit=crop&q=80&w=800', 
    readTime: 'Urgent'
  }
];

export const GarageScreen: React.FC<GarageScreenProps> = ({ user, cars, onSelectCar, onAddCar, onLogout }) => {
  const [showNews, setShowNews] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  // Fallback image handler
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null; // Prevent infinite loop
    e.currentTarget.style.display = 'none'; // Hide the broken image
    // Show fallback via CSS sibling or parent state if needed, but simple hide works with bg color
    const parent = e.currentTarget.parentElement;
    if (parent) {
       parent.classList.add('bg-nsp-input', 'flex', 'items-center', 'justify-center');
       // Inset a fallback icon via innerHTML if necessary, or just rely on background
       // For React, better to have state, but for simplicity in map:
       const fallback = document.createElement('div');
       fallback.className = 'flex flex-col items-center justify-center text-gray-500';
       fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H12c-.7 0-1.3.3-1.8.7-.9.9-2.2 2.3-2.2 2.3s-2.7.6-4.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/><path d="M15 17h-6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 11h2"/><path d="M17 11h2"/></svg><span class="text-xs mt-2">Image non disponible</span>';
       parent.appendChild(fallback);
    }
  };

  const renderNewsModal = () => (
    <div className="fixed inset-0 z-50 bg-nsp-bg flex flex-col animate-slide-up">
      {/* Header Modal */}
      <div className="p-4 bg-nsp-card border-b border-nsp-border flex items-center justify-between pt-safe-top">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Newspaper size={24} className="text-nsp-primary" /> 
          Le Journal Auto
        </h2>
        <button 
          onClick={() => { setShowNews(false); setSelectedArticle(null); }} 
          className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full pb-safe-bottom">
        {selectedArticle ? (
          // VUE ARTICLE DÉTAILLÉ
          <div className="animate-fade-in space-y-6">
            <button onClick={() => setSelectedArticle(null)} className="text-sm text-gray-400 hover:text-white flex items-center gap-1 mb-4">
               <ArrowRight className="rotate-180" size={16} /> Retour au flux
            </button>
            <div className="rounded-2xl overflow-hidden h-64 w-full relative bg-nsp-input">
               <img 
                 src={selectedArticle.imageUrl} 
                 className="w-full h-full object-cover" 
                 onError={handleImageError}
                 alt={selectedArticle.title}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
               <div className="absolute bottom-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-lg ${
                    selectedArticle.category === 'REGLEMENTATION' ? 'bg-blue-600 text-white' : 
                    selectedArticle.category === 'ALERT' ? 'bg-red-600 text-white' :
                    selectedArticle.category === 'NOUVEAUTE' ? 'bg-purple-600 text-white' : 'bg-green-600 text-white'
                  }`}>
                    {selectedArticle.category}
                  </span>
               </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{selectedArticle.title}</h1>
              <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
                 <span className="flex items-center gap-1"><Calendar size={12}/> {selectedArticle.date}</span>
                 <span className="flex items-center gap-1"><Clock size={12}/> {selectedArticle.readTime}</span>
              </div>
              <p className="text-gray-300 leading-relaxed text-lg">
                {selectedArticle.content}
              </p>
              <div className="mt-8 p-4 bg-nsp-input rounded-xl border-l-4 border-nsp-primary">
                 <p className="text-sm text-gray-400 italic">
                   L'équipe AutoBook met à jour ces informations régulièrement. Pensez à vérifier les sources officielles.
                 </p>
              </div>
            </div>
          </div>
        ) : (
          // VUE LISTE ARTICLES
          <div className="space-y-6">
             <div className="bg-nsp-primary/10 p-4 rounded-xl border border-nsp-primary/30 mb-6">
                <h3 className="text-white font-bold mb-1">Dernières Actualités</h3>
                <p className="text-sm text-nsp-sub">Restez informé des changements réglementaires et des nouveautés qui impactent votre conduite.</p>
             </div>

             <div className="space-y-4">
                {NEWS_DATA.map((article) => (
                  <div 
                    key={article.id} 
                    onClick={() => setSelectedArticle(article)}
                    className="bg-nsp-card border border-nsp-border rounded-xl overflow-hidden cursor-pointer hover:border-nsp-primary transition-all group shadow-lg"
                  >
                     <div className="h-40 relative overflow-hidden bg-nsp-input">
                        <img 
                          src={article.imageUrl} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          onError={handleImageError}
                          alt={article.title}
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors pointer-events-none"></div>
                        <div className="absolute top-3 left-3">
                           <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase shadow-sm ${
                              article.category === 'REGLEMENTATION' ? 'bg-blue-600 text-white' : 
                              article.category === 'ALERT' ? 'bg-red-600 text-white' :
                              article.category === 'NOUVEAUTE' ? 'bg-purple-600 text-white' : 'bg-green-600 text-white'
                           }`}>
                             {article.category}
                           </span>
                        </div>
                     </div>
                     <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                           <h3 className="text-white font-bold text-lg leading-tight group-hover:text-nsp-primary transition-colors">{article.title}</h3>
                           <ArrowRight size={20} className="text-gray-600 group-hover:text-white -rotate-45 group-hover:rotate-0 transition-all" />
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{article.summary}</p>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500">
                           <span className="flex items-center gap-1"><Calendar size={10}/> {article.date}</span>
                           <span className="flex items-center gap-1"><Clock size={10}/> {article.readTime}</span>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-nsp-bg flex flex-col">
      {/* Header */}
      <div className="p-6 bg-nsp-card border-b border-nsp-border sticky top-0 z-20 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Mon Garage</h1>
            <p className="text-nsp-sub text-sm">Bienvenue, {user.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* BOUTON JOURNAL AVEC NOTIFICATION */}
            <button 
              onClick={() => setShowNews(true)}
              className="p-2 bg-nsp-input rounded-full text-white hover:bg-nsp-primary hover:text-white transition-colors relative"
              title="Journal des Nouveautés"
            >
              <Newspaper size={20} />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-nsp-card animate-pulse"></div>
            </button>

            <button 
              onClick={onLogout}
              className="p-2 bg-nsp-input rounded-full text-nsp-sub hover:text-white hover:bg-red-500/20 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
        
        {/* Stats Rapides */}
        <div className="flex gap-4">
          <div className="bg-nsp-input/50 px-3 py-1.5 rounded-lg border border-nsp-border text-xs text-gray-400 flex items-center gap-2">
            <CarIcon size={14} /> {cars.filter(c => c.type === 'car').length} Voitures
          </div>
          <div className="bg-nsp-input/50 px-3 py-1.5 rounded-lg border border-nsp-border text-xs text-gray-400 flex items-center gap-2">
            <Bike size={14} /> {cars.filter(c => c.type === 'motorcycle').length} Motos
          </div>
        </div>
      </div>

      {/* Liste des Véhicules */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto min-h-[60vh]">
        {cars.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-6 opacity-90">
            <div className="w-24 h-24 bg-nsp-input rounded-full flex items-center justify-center border-4 border-dashed border-nsp-sub animate-pulse">
              <CarIcon size={48} className="text-nsp-sub" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Votre Garage est Vide</h3>
              <p className="text-sm text-nsp-sub max-w-xs mx-auto">
                Ajoutez votre premier véhicule pour commencer à suivre son entretien et activer l'IA.
              </p>
            </div>
            
            <button 
              onClick={onAddCar}
              className="bg-nsp-primary hover:bg-red-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-red-900/30 flex items-center gap-3 transition-transform hover:scale-105 active:scale-95"
            >
              <Plus size={24} /> AJOUTER UN VÉHICULE
            </button>
          </div>
        ) : (
          <>
            {cars.map((car) => (
              <button
                key={car.id}
                onClick={() => onSelectCar(car.id)}
                className="w-full bg-nsp-card rounded-2xl border border-nsp-border overflow-hidden hover:border-nsp-primary transition-all transform hover:scale-[1.02] group text-left relative shadow-lg"
              >
                {/* Image de fond (Frontale ou placeholder) */}
                <div className="h-32 w-full bg-nsp-input relative">
                  {car.photos.front ? (
                    <img src={car.photos.front} alt={car.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                      {car.type === 'motorcycle' ? <Bike size={48} className="text-gray-700"/> : <CarIcon size={48} className="text-gray-700"/>}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-nsp-card to-transparent"></div>
                  
                  {/* Badge Plaque */}
                  <div className="absolute top-3 left-3 bg-[#003399]/90 backdrop-blur-md text-white px-2 py-1 rounded text-xs font-bold font-mono border border-white/20 shadow-md">
                    {car.plate}
                  </div>
                </div>

                {/* Infos */}
                <div className="p-4 flex justify-between items-center relative z-10 -mt-6">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-nsp-primary transition-colors">{car.name}</h3>
                    <p className="text-xs text-nsp-sub capitalize">{car.fuelType} • {car.initialKm.toLocaleString()} km initiaux</p>
                  </div>
                  <div className="bg-nsp-primary rounded-full p-2 text-white shadow-lg shadow-red-900/50">
                     <ChevronRight size={20} />
                  </div>
                </div>
                
                {/* Indicateur état */}
                <div className="px-4 pb-4 flex items-center gap-2">
                   {car.initialState.body === 'bad' || car.initialState.engine === 'bad' ? (
                      <span className="flex items-center gap-1 text-[10px] text-orange-400 bg-orange-900/20 px-2 py-0.5 rounded-full border border-orange-500/30">
                        <AlertCircle size={10} /> Vigilance requise
                      </span>
                   ) : (
                      <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-900/20 px-2 py-0.5 rounded-full border border-green-500/30">
                        <CheckCircle2 size={10} /> Véhicule sain
                      </span>
                   )}
                </div>
              </button>
            ))}
            <div className="h-20"></div> {/* Spacer pour le bouton flottant */}
          </>
        )}
      </div>

      {/* Bouton Flottant Ajout */}
      {cars.length > 0 && (
        <div className="fixed bottom-8 right-8 z-30">
          <button 
            onClick={onAddCar}
            className="bg-nsp-primary hover:bg-red-600 text-white h-14 px-6 rounded-full shadow-lg shadow-red-900/40 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 font-bold"
          >
            <Plus size={24} /> AJOUTER
          </button>
        </div>
      )}

      {/* MODALE NEWS */}
      {showNews && renderNewsModal()}
    </div>
  );
};
