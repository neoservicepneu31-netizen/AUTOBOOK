
import { Invoice, Car } from '../types';

const BASE_RULES = {
  REVISION_KM: 20000,
  REVISION_MONTHS: 12,
  CHECK_FLUIDS_DAYS: 30,
  CHECK_TIRES_DAYS: 30,
  CHECK_OIL_DAYS: 90,
};

interface MaintenanceStatus {
  status: 'success' | 'warning' | 'critical' | 'neutral';
  message: string;
  nextDeadline: string;
  alerts: string[];
  pendingTasks: {id: string, label: string, severity: 'low' | 'high'} [];
}

export const calculateMaintenanceStatus = (car: Car, invoices: Invoice[]): MaintenanceStatus => {
  const currentKm = invoices.length > 0 ? Math.max(...invoices.map(i => i.km)) : car.initialKm;
  const today = new Date();
  const alerts: string[] = [];
  const pendingTasks: {id: string, label: string, severity: 'low' | 'high'}[] = [];

  const lastDocDate = invoices.length > 0 
    ? new Date(Math.max(...invoices.map(i => new Date(i.date).getTime())))
    : new Date();

  const daysSinceLastCheck = Math.floor((today.getTime() - lastDocDate.getTime()) / (1000 * 60 * 60 * 24));

  // --- ANALYSE MARQUE & MODÈLE ---
  const make = car.name.split(' ')[0].toUpperCase();
  let maintenanceInterval = BASE_RULES.REVISION_KM;
  
  // Personnalisation par marque (Exemples constructeurs)
  if (['RENAULT', 'PEUGEOT', 'CITROEN'].includes(make)) maintenanceInterval = 20000;
  if (['BMW', 'AUDI', 'MERCEDES'].includes(make)) maintenanceInterval = 30000;
  if (car.fuelType === 'electrique') maintenanceInterval = 30000;

  // 1. ANALYSE RÉVISION
  const lastRevision = invoices
    .filter(i => /révision|vidange|entretien/i.test(i.title))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (lastRevision) {
    const nextRevisionDate = new Date(lastRevision.date);
    nextRevisionDate.setFullYear(nextRevisionDate.getFullYear() + 1);
    const kmSinceRevision = currentKm - lastRevision.km;
    
    if (kmSinceRevision >= maintenanceInterval || today > nextRevisionDate) {
      alerts.push("REVISION");
      pendingTasks.push({id: 'rev', label: `Révision Constructeur ${make} préconisée`, severity: 'high'});
    }
  }

  // 2. CONTRÔLE TECHNIQUE
  const nextCTDate = calculateNextCT(car.firstRegistrationDate, invoices);
  const diffTimeCT = nextCTDate.getTime() - today.getTime();
  const diffDaysCT = Math.ceil(diffTimeCT / (1000 * 60 * 60 * 24));

  if (diffDaysCT < 0) {
    alerts.push("CT_EXPIRED");
    pendingTasks.push({id: 'ct_crit', label: 'Contrôle Technique PÉRIMÉ', severity: 'high'});
  } else if (diffDaysCT < 60) {
    alerts.push("CT_SOON");
    pendingTasks.push({id: 'ct_warn', label: 'RDV Contrôle Technique à prévoir', severity: 'high'});
  }

  // 3. RAPPELS PNEUS & FLUIDES (Basé sur la dernière action)
  if (daysSinceLastCheck >= BASE_RULES.CHECK_TIRES_DAYS) {
    pendingTasks.push({id: 'tires', label: `Vérification Pression Pneus ${make}`, severity: 'low'});
  }
  
  if (daysSinceLastCheck >= BASE_RULES.CHECK_OIL_DAYS) {
    pendingTasks.push({id: 'oil_check', label: 'Niveau Huile Moteur (Visuel)', severity: 'high'});
  }

  // Détermination du statut global
  let status: MaintenanceStatus['status'] = 'success';
  let message = `Votre ${car.name} est en parfaite conformité. L'IA surveille vos prochains rendez-vous.`;

  if (pendingTasks.some(t => t.severity === 'high')) {
    status = 'critical';
    message = `ALERTE SÉCURITÉ : Plusieurs points de conformité critique sur votre ${car.name.split(' ')[0]} nécessitent votre attention.`;
  } else if (pendingTasks.length > 0) {
    status = 'warning';
    message = `ENTRETIEN COURANT : Quelques vérifications constructeur sont à prévoir ce mois-ci sur votre ${car.name.split(' ')[0]}.`;
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
    .filter(i => /contr[oô]le technique|ct\b|visite technique/i.test(i.title))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (lastCT) {
    const next = new Date(lastCT.date);
    next.setFullYear(next.getFullYear() + 2);
    return next;
  }

  const firstCT = new Date(firstReg);
  firstCT.setFullYear(firstCT.getFullYear() + 4);
  return firstCT;
};
