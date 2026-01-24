
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
  upcomingDeadlines: {id: string, label: string, date: string, type: 'CT' | 'REVISION'} [];
}

export const calculateMaintenanceStatus = (car: Car, invoices: Invoice[]): MaintenanceStatus => {
  const currentKm = invoices.length > 0 ? Math.max(...invoices.map(i => i.km)) : car.initialKm;
  const today = new Date();
  const alerts: string[] = [];
  const pendingTasks: {id: string, label: string, severity: 'low' | 'high', basis?: string}[] = [];
  const upcomingDeadlines: MaintenanceStatus['upcomingDeadlines'] = [];

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

  // 1. ANALYSE RÉVISION
  const lastRevision = invoices
    .filter(i => /révision|vidange|entretien|revision/i.test(i.title.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (lastRevision) {
    const revDate = new Date(lastRevision.date);
    const nextRevisionDate = new Date(revDate);
    nextRevisionDate.setFullYear(nextRevisionDate.getFullYear() + 1); 
    
    const kmSinceRevision = currentKm - lastRevision.km;
    const timeToNextRev = nextRevisionDate.getTime() - today.getTime();
    const daysToNextRev = Math.ceil(timeToNextRev / (1000 * 60 * 60 * 24));

    if (daysToNextRev <= 0 || kmSinceRevision >= maintenanceIntervalKm) {
      alerts.push("REVISION_DUE");
      pendingTasks.push({
        id: 'rev_due', 
        label: `Révision ${make} à effectuer`, 
        severity: 'high',
        basis: `Dernière faite le ${revDate.toLocaleDateString()} (${kmSinceRevision.toLocaleString()} km parcourus)`
      });
    } else if (daysToNextRev <= 30) {
      upcomingDeadlines.push({
        id: 'rev_soon',
        label: `Révision prévue dans ${daysToNextRev} jours`,
        date: nextRevisionDate.toLocaleDateString(),
        type: 'REVISION'
      });
    }
  }

  // 2. CONTRÔLE TECHNIQUE
  const nextCTDate = calculateNextCT(car.firstRegistrationDate, invoices);
  const diffTimeCT = nextCTDate.getTime() - today.getTime();
  const diffDaysCT = Math.ceil(diffTimeCT / (1000 * 60 * 60 * 24));

  if (diffDaysCT < 0) {
    alerts.push("CT_EXPIRED");
    pendingTasks.push({id: 'ct_crit', label: 'Contrôle Technique PÉRIMÉ', severity: 'high', basis: `Date limite : ${nextCTDate.toLocaleDateString()}`});
  } else if (diffDaysCT <= 30) {
    upcomingDeadlines.push({
      id: 'ct_soon',
      label: `Contrôle technique dans ${diffDaysCT} jours`,
      date: nextCTDate.toLocaleDateString(),
      type: 'CT'
    });
    if (diffDaysCT < 45) {
      pendingTasks.push({id: 'ct_warn', label: 'Réserver Contrôle Technique', severity: 'high', basis: `Échéance proche : ${nextCTDate.toLocaleDateString()}`});
    }
  }

  // 3. ENTRETIENS COURANTS
  if (daysSinceLastCheck >= BASE_RULES.CHECK_TIRES_DAYS) {
    pendingTasks.push({id: 'tires', label: 'Vérifier Pression Pneus', severity: 'low', basis: `${daysSinceLastCheck} jours sans contrôle`});
  }
  
  if (daysSinceLastCheck >= BASE_RULES.CHECK_OIL_DAYS) {
    pendingTasks.push({id: 'oil_check', label: 'Vérifier Niveau Huile', severity: 'high', basis: 'Contrôle visuel requis'});
  }

  // Détermination du statut global
  let status: MaintenanceStatus['status'] = 'success';
  let message = `Toutes les échéances de votre ${car.name} sont à jour.`;

  if (pendingTasks.some(t => t.severity === 'high')) {
    status = 'critical';
    message = `ALERTE : Votre historique indique des entretiens en retard ou imminents.`;
  } else if (pendingTasks.length > 0 || upcomingDeadlines.length > 0) {
    status = 'warning';
    message = `VIGILANCE : Des vérifications ou échéances approchent pour votre ${car.name}.`;
  }

  return { 
    status, 
    message, 
    nextDeadline: nextCTDate.toLocaleDateString(), 
    alerts,
    pendingTasks,
    upcomingDeadlines
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

  const firstCT = new Date(firstReg);
  firstCT.setFullYear(firstCT.getFullYear() + 4);
  
  const today = new Date();
  if (today > firstCT) {
      let estimatedNext = new Date(firstCT);
      while(estimatedNext < today) {
          estimatedNext.setFullYear(estimatedNext.getFullYear() + 2);
      }
      // On recule d'un cycle si l'estimé est trop loin dans le futur sans preuve
      return estimatedNext;
  }

  return firstCT;
};
