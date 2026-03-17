import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isDanger = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-nsp-card w-full max-w-sm rounded-[2.5rem] border border-white/10 p-8 shadow-2xl animate-slide-up">
        <div className="flex justify-between items-start mb-6">
          <div className={`p-3 rounded-2xl ${isDanger ? 'bg-red-500/10 text-red-500' : 'bg-nsp-primary/10 text-nsp-primary'}`}>
            <AlertTriangle size={24} />
          </div>
          <button onClick={onCancel} className="p-2 text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-gray-400 text-sm font-medium leading-relaxed mb-8">
          {message}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all ${
              isDanger ? 'bg-red-600 text-white' : 'bg-nsp-primary text-white'
            }`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-all"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
