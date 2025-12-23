
import { Invoice, Car } from '../types';

// Règles d'entretien proactif NSP
const RULES = {
  REVISION_KM: 20000,
  REVISION_MONTHS: 12,
  DISTRIBUTION_KM: 150000,
  DISTRIBUTION_YEARS: 6,
  CT_YEARS: 2,
  CT_FIRST_YEARS: 4,
  CHECK_FLUIDS_DAYS: 30, // Tous les mois : Lave-glace, Refroidissement
  CHECK_TIRES_DAYS: 30,  // Tous les mois : Pression
  CHECK_OIL_DAYS: 90,    // Tous les 3 mois : Niveau huile
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

  // Date de référence (Dernière facture ou création du véhicule)
  const lastDocDate = invoices.length > 0 
    ? new Date(Math.max(...invoices.map(i => new Date(i.date).getTime())))
    : new Date(); // Si pas de doc, on part d'aujourd'hui pour le premier cycle

  const daysSinceLastCheck = Math.floor((today.getTime() - lastDocDate.getTime()) / (1000 * 60 * 60 * 24));

  // 1. ANALYSE RÉVISION (ANNIUELLE / 20k KM)
  const lastRevision = invoices
    .filter(i => /révision|vidange|entretien/i.test(i.title))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (lastRevision) {
    const nextRevisionDate = new Date(lastRevision.date);
    nextRevisionDate.setFullYear(nextRevisionDate.getFullYear() + 1);
    const kmSinceRevision = currentKm - lastRevision.km;
    
    if (kmSinceRevision >= RULES.REVISION_KM || today > nextRevisionDate) {
      alerts.push("REVISION");
      pendingTasks.push({id: 'rev', label: 'Révision Complète Immédiate', severity: 'high'});
    }
  } else if (invoices.length > 0) {
    pendingTasks.push({id: 'rev_warn', label: 'Planifier Révision Annuelle', severity: 'low'});
  }

  // 2. CONTRÔLE TECHNIQUE
  const nextCTDate = calculateNextCT(car.firstRegistrationDate, invoices);
  const diffTimeCT = nextCTDate.getTime() - today.getTime();
  const diffDaysCT = Math.ceil(diffTimeCT / (1000 * 60 * 60 * 24));

  if (diffDaysCT < 0) {
    alerts.push("CT_EXPIRED");
    pendingTasks.push({id: 'ct_crit', label: 'Contrôle Technique PÉRIMÉ', severity: 'high'});
  } else if (diffDaysCT < 30) {
    alerts.push("CT_SOON");
    pendingTasks.push({id: 'ct_warn', label: 'RDV Contrôle Technique', severity: 'high'});
  }

  // 3. RAPPELS PROACTIFS (MENSUELS)
  if (daysSinceLastCheck >= RULES.CHECK_FLUIDS_DAYS) {
    pendingTasks.push({id: 'coolant', label: 'Niveau Liquide Refroidissement', severity: 'low'});
    pendingTasks.push({id: 'washer', label: 'Niveau Lave-Glace', severity: 'low'});
    pendingTasks.push({id: 'tires', label: 'Pression des Pneus (Gonflage)', severity: 'low'});
  }

  // 4. NIVEAU HUILE (TRIMESTRIEL)
  if (daysSinceLastCheck >= RULES.CHECK_OIL_DAYS) {
    pendingTasks.push({id: 'oil_check', label: 'Contrôle Niveau Huile Moteur', severity: 'high'});
  }

  // Détermination du statut global
  let status: MaintenanceStatus['status'] = 'success';
  let message = "Votre véhicule est parfaitement suivi. L'IA NSP assure la conformité.";

  if (pendingTasks.some(t => t.severity === 'high')) {
    status = 'critical';
    message = "ALERTE SÉCURITÉ : Plusieurs points de conformité critique nécessitent votre attention.";
  } else if (pendingTasks.length > 0) {
    status = 'warning';
    message = "ENTRETIEN COURANT : Quelques vérifications de routine sont à prévoir ce mois-ci.";
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
