
import React, { useState } from 'react';
import { Car, Invoice } from '../types';
import { ArrowLeft, CheckCircle2, Mail, Share2, ShieldCheck, FileText, Image as ImageIcon } from 'lucide-react';

interface SellCarScreenProps {
  car: Car;
  invoices: Invoice[];
  onCancel: () => void;
  onConfirmTransfer: (buyerEmail: string) => void;
}

export const SellCarScreen: React.FC<SellCarScreenProps> = ({ car, invoices, onCancel, onConfirmTransfer }) => {
  const [buyerEmail, setBuyerEmail] = useState('');
  const [step, setStep] = useState<'review' | 'sending' | 'success'>('review');

  const handleTransfer = () => {
    if (!buyerEmail) return;
    setStep('sending');
    
    // Simulate network delay for the transfer
    setTimeout(() => {
      setStep('success');
      // Trigger the parent callback after the success animation plays a bit
      setTimeout(() => {
        onConfirmTransfer(buyerEmail);
      }, 2500);
    }, 2000);
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-nsp-bg flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle2 size={48} className="text-green-500" />
        </div>
        <h2 className="text-3xl font-bold text-white text-center mb-2">Transfert Réussi !</h2>
        <p className="text-nsp-sub text-center mb-8">
          Le dossier numérique complet de la {car.plate} a été envoyé à <span className="text-white font-bold">{buyerEmail}</span>.
        </p>
        <div className="bg-nsp-card p-4 rounded-lg border border-nsp-border w-full max-w-sm">
          <p className="text-xs text-gray-500 text-center">Une copie du certificat de cession a été envoyée sur votre email.</p>
        </div>
      </div>
    );
  }

  if (step === 'sending') {
    return (
      <div className="min-h-screen bg-nsp-bg flex flex-col items-center justify-center p-6">
        <div className="relative w-24 h-24 mb-8">
           <div className="absolute inset-0 border-4 border-nsp-border rounded-full"></div>
           <div className="absolute inset-0 border-4 border-nsp-primary rounded-full border-t-transparent animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
             <Share2 className="text-white animate-pulse" size={32} />
           </div>
        </div>
        <h2 className="text-xl font-bold text-white animate-pulse">Transfert des données sécurisées...</h2>
        <div className="mt-4 space-y-2 w-full max-w-xs">
          <div className="flex items-center justify-between text-xs text-nsp-sub">
            <span>Factures ({invoices.length})</span>
            <span className="text-green-500">OK</span>
          </div>
          <div className="flex items-center justify-between text-xs text-nsp-sub">
            <span>Photos HD</span>
            <span className="text-green-500">OK</span>
          </div>
          <div className="flex items-center justify-between text-xs text-nsp-sub">
            <span>Histovec</span>
            <span className="text-green-500">OK</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nsp-bg flex flex-col">
      {/* Header */}
      <div className="p-6 bg-nsp-card border-b border-nsp-border flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onCancel} className="text-white hover:text-nsp-primary transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">Cession Véhicule</h1>
      </div>

      <div className="flex-1 p-6 overflow-y-auto max-w-md mx-auto w-full">
        
        <div className="mb-8 text-center">
          <div className="inline-block bg-nsp-primary/10 p-4 rounded-full mb-4">
            <Share2 size={40} className="text-nsp-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Transférer le dossier</h2>
          <p className="text-nsp-sub text-sm">
            Vendez votre voiture avec son "Double Numérique". Transférez instantanément l'historique complet au nouveau propriétaire.
          </p>
        </div>

        {/* Car Summary Card */}
        <div className="bg-nsp-card border border-nsp-border rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white text-black px-2 py-1 rounded text-sm font-bold font-mono border-l-4 border-blue-800 border-r-4">
              {car.plate}
            </div>
            <span className="text-xs text-green-500 font-bold uppercase tracking-wide flex items-center gap-1">
              <ShieldCheck size={14} /> Vérifié
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <FileText className="text-nsp-primary" size={18} />
              <span>{invoices.length} Factures d'entretien & Réparations</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <ImageIcon className="text-nsp-primary" size={18} />
              <span>4 Photos certifiées (Angles)</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <ShieldCheck className="text-nsp-primary" size={18} />
              <span>Rapport Histovec Inclus</span>
            </div>
          </div>
        </div>

        {/* Buyer Input */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-white">Email du futur propriétaire</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="text-gray-500" size={20} />
            </div>
            <input
              type="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              className="w-full bg-nsp-input border border-nsp-border focus:border-nsp-primary rounded-lg pl-10 pr-4 py-4 text-white placeholder-gray-600 focus:outline-none transition-colors"
              placeholder="acheteur@email.com"
            />
          </div>
          <p className="text-xs text-gray-500">
            Le destinataire recevra une notification pour accepter le véhicule dans son garage AUTOBOOK.
          </p>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="p-6 bg-nsp-card border-t border-nsp-border">
        <button
          onClick={handleTransfer}
          disabled={!buyerEmail.includes('@')}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            buyerEmail.includes('@')
              ? 'bg-nsp-primary hover:bg-red-600 text-white shadow-lg shadow-red-900/30'
              : 'bg-nsp-input text-gray-500 cursor-not-allowed'
          }`}
        >
          VALIDER LA VENTE
        </button>
      </div>
    </div>
  );
};
