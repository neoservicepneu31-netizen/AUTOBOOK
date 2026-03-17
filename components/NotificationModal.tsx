import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationModalProps {
  isOpen: boolean;
  type: NotificationType;
  title: string;
  message: string;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  type,
  title,
  message,
  onClose
}) => {
  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle2 size={24} className="text-nsp-success" />,
    error: <AlertCircle size={24} className="text-red-500" />,
    info: <Info size={24} className="text-nsp-primary" />
  };

  const bgColors = {
    success: 'bg-nsp-success/10',
    error: 'bg-red-500/10',
    info: 'bg-nsp-primary/10'
  };

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-nsp-card w-full max-w-sm rounded-[2.5rem] border border-white/10 p-8 shadow-2xl animate-slide-up">
        <div className="flex justify-between items-start mb-6">
          <div className={`p-3 rounded-2xl ${bgColors[type]}`}>
            {icons[type]}
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-gray-400 text-sm font-medium leading-relaxed mb-8">
          {message}
        </p>

        <button
          onClick={onClose}
          className="w-full py-4 bg-nsp-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
        >
          OK
        </button>
      </div>
    </div>
  );
};
