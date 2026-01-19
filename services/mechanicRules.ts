
import { Invoice, Car } from '../types';

const BASE_RULES = {
  REVISION_KM: 20000,
  REVISION_MONTHS: 12,
  CHECK_FLUIDS_DAYS: 30,
  CHECK_TIRES_DAYS: 30,
  CHECK_OIL_DAYS: 90,
  CT_INTERVAL_YEARS: 2,
};

interface MaintenanceStatus {
  status: 'success' | 'warning' | 'critical' | 'neutral';
  message: string;
  nextDeadline: string;
  alerts: string[];
  pendingTasks: {id: string, label: string, severity: 'low' | 'high', basis?: string} [];
}

export const calculateMaintenanceStatus = (car: Car, invoices: Invoice[]): MaintenanceStatus => {
  const currentKm = invoices.length > 0 ? Math.max(...invoices.map(i => i.km)) : car.initialKm;
  const today = new Date();
  const alerts: string[] = [];
  const pendingTasks: {id: string, label: string, severity: 'low' | 'high', basis?: string}[] = [];

  const lastDocDate = invoices.length > 0 
    ? new Date(Math.max(...invoices.map(i => new Date(i.date).getTime())))
    : new Date(car.firstRegistrationDate);

  const daysSinceLastCheck = Math.floor((today.getTime() - lastDocDate.getTime()) / (1000 * 60 * 60 * 24));

  // --- ANALYSE MARQUE & MODÈLE ---
  const make = car.name.split(' ')[0].toUpperCase();
  let maintenanceIntervalKm = BASE_RULES.REVISION_KM;
  
  if (['RENAULT', 'PEUGEOT', 'CITROEN'].includes(make)) maintenanceIntervalKm = 20000;
  if (['BMW', 'AUDI', 'MERCEDES', 'PORSCHE'].includes(make)) maintenanceIntervalKm = 30000;
  if (car.fuelType === 'electrique') maintenanceIntervalKm = 30000;

  // 1. ANALYSE RÉVISION BASÉE SUR LES FACTURES SCANNÉES
  const lastRevision = invoices
    .filter(i => /révision|vidange|entretien|revision/i.test(i.title.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (lastRevision) {
    const revDate = new Date(lastRevision.date);
    const nextRevisionDate = new Date(revDate);
    nextRevisionDate.setFullYear(nextRevisionDate.getFullYear() + 1); // 1 an d'intervalle par défaut
    
    const kmSinceRevision = currentKm - lastRevision.km;
    const isOverdueByTime = today > nextRevisionDate;
    const isOverdueByKm = kmSinceRevision >= maintenanceIntervalKm;

    if (isOverdueByTime || isOverdueByKm) {
      alerts.push("REVISION_DUE");
      pendingTasks.push({
        id: 'rev_due', 
        label: `Révision ${make} à effectuer`, 
        severity: 'high',
        basis: `Dernière faite le ${revDate.toLocaleDateString()} (${kmSinceRevision.toLocaleString()} km parcourus)`
      });
    }
  } else {
    // Si aucune facture de révision n'est scannée, on base sur la date d'achat ou 1ère immat
    const firstReg = new Date(car.firstRegistrationDate);
    const monthsSinceReg = (today.getFullYear() - firstReg.getFullYear()) * 12 + (today.getMonth() - firstReg.getMonth());
    if (monthsSinceReg > 12 && invoices.length === 0) {
      pendingTasks.push({id: 'rev_unknown', label: 'Historique Révision Inconnu', severity: 'high', basis: 'Aucune facture de vidange scannée'});
    }
  }

  // 2. CONTRÔLE TECHNIQUE BASÉ SUR LES FACTURES
  const nextCTDate = calculateNextCT(car.firstRegistrationDate, invoices);
  const diffTimeCT = nextCTDate.getTime() - today.getTime();
  const diffDaysCT = Math.ceil(diffTimeCT / (1000 * 60 * 60 * 24));

  if (diffDaysCT < 0) {
    alerts.push("CT_EXPIRED");
    pendingTasks.push({id: 'ct_crit', label: 'Contrôle Technique PÉRIMÉ', severity: 'high', basis: `Date limite : ${nextCTDate.toLocaleDateString()}`});
  } else if (diffDaysCT < 45) {
    alerts.push("CT_SOON");
    pendingTasks.push({id: 'ct_warn', label: 'Réserver Contrôle Technique', severity: 'high', basis: `Échéance dans ${diffDaysCT} jours`});
  }

  // 3. ENTRETIENS COURANTS (PNEUS / HUILE)
  if (daysSinceLastCheck >= BASE_RULES.CHECK_TIRES_DAYS) {
    pendingTasks.push({id: 'tires', label: 'Vérifier Pression Pneus', severity: 'low', basis: `${daysSinceLastCheck} jours sans contrôle`});
  }
  
  if (daysSinceLastCheck >= BASE_RULES.CHECK_OIL_DAYS) {
    pendingTasks.push({id: 'oil_check', label: 'Vérifier Niveau Huile', severity: 'high', basis: 'Contrôle visuel trimestriel requis'});
  }

  // Détermination du statut global
  let status: MaintenanceStatus['status'] = 'success';
  let message = `Toutes les échéances de votre ${car.name} sont à jour selon vos factures.`;

  if (pendingTasks.some(t => t.severity === 'high')) {
    status = 'critical';
    message = `ALERTE : Votre historique de factures indique que des entretiens sont en retard sur votre ${car.name}.`;
  } else if (pendingTasks.length > 0) {
    status = 'warning';
    message = `VIGILANCE : Quelques vérifications de routine sont nécessaires pour votre ${car.name}.`;
  }

  return { 
    status, 
    message, 
    nextDeadline: nextCTDate.toLocaleDateString(), 
    alerts,
    pendingTasks
  };
};

const calculateNextCT = (firstRegDateStr: string, invoices: Invoice[]): Date => {
  const firstReg = new Date(firstRegDateStr);
  const lastCT = invoices
    .filter(i => /contr[oô]le technique|ct\b|visite technique/i.test(i.title.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (lastCT) {
    const next = new Date(lastCT.date);
    next.setFullYear(next.getFullYear() + 2);
    return next;
  }

  // Si pas de CT scanné, on calcule selon l'âge du véhicule (4 ans après 1ere immat)
  const firstCT = new Date(firstReg);
  firstCT.setFullYear(firstCT.getFullYear() + 4);
  
  // Si le véhicule a plus de 4 ans, le CT est requis tous les 2 ans
  const today = new Date();
  if (today > firstCT) {
      // On simule une échéance glissante si on n'a pas la facture
      let estimatedNext = new Date(firstCT);
      while(estimatedNext < today) {
          estimatedNext.setFullYear(estimatedNext.getFullYear() + 2);
      }
      return estimatedNext;
  }

  return firstCT;
};
