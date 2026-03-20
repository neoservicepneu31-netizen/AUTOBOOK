import React from 'react';
import { Bell, X, Info, AlertTriangle, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { AppNotification } from '../types';

interface GarageNotificationsModalProps {
  isOpen: boolean;
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export const GarageNotificationsModal: React.FC<GarageNotificationsModalProps> = ({
  isOpen,
  notifications,
  onClose,
  onMarkAsRead,
  onDelete
}) => {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-green-500" size={20} />;
      case 'error': return <AlertCircle className="text-red-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-orange-500" size={20} />;
      default: return <Info className="text-nsp-primary" size={20} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex flex-col pt-safe-top animate-fade-in">
      <header className="p-6 flex justify-between items-center border-b border-white/5">
        <button onClick={onClose} className="p-3 bg-nsp-input rounded-xl text-white">
          <X size={24} />
        </button>
        <h3 className="text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
          <Bell size={14} className="text-nsp-primary" /> Centre de Notifications
        </h3>
        <div className="w-12"></div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-nsp-input rounded-full flex items-center justify-center text-gray-700">
              <Bell size={32} />
            </div>
            <p className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Aucune notification</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`bg-nsp-card border p-5 rounded-3xl transition-all relative group ${notif.read ? 'border-white/5 opacity-60' : 'border-nsp-primary/30 shadow-lg shadow-nsp-primary/5'}`}
              onClick={() => !notif.read && onMarkAsRead(notif.id)}
            >
              <div className="flex gap-4">
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${notif.read ? 'bg-nsp-input' : 'bg-nsp-primary/10'}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-black text-[10px] uppercase tracking-tight ${notif.read ? 'text-gray-400' : 'text-white'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[7px] text-gray-600 font-black uppercase">
                      {new Date(notif.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${notif.read ? 'text-gray-500' : 'text-gray-300'}`}>
                    {notif.message}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notif.id);
                }}
                className="absolute top-2 right-2 p-2 text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>

              {!notif.read && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-nsp-primary rounded-full group-hover:hidden"></div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-6 pb-safe-bottom bg-black/50 border-t border-white/5">
        <button 
          onClick={onClose}
          className="w-full bg-nsp-input text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};
