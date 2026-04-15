
import { Invoice, Car, AppNotification } from '../types';

const BASE_RULES = {
  REVISION_KM: 20000,
  REVISION_MONTHS: 12,
  CHECK_FLUIDS_DAYS: 30,
  CHECK_TIRES_DAYS: 30,
  CHECK_OIL_DAYS: 90,
  CT_INTERVAL_YEARS: 2,
  TIRE_LIFESPAN_KM: 45000, 
  TIRE_AGE_YEARS: 5,
  TIMING_BELT_KM: 100000,
  TIMING_BELT_YEARS: 6,
  SPARK_PLUGS_KM: 60000,
};

interface MaintenanceStatus {
  status: 'success' | 'warning' | 'critical' | 'neutral';
  message: string;
  nextDeadline: string;
  alerts: string[];
  pendingTasks: {id: string, label: string, severity: 'low' | 'high', basis?: string} [];
  upcomingDeadlines: {id: string, label: string, date: string, type: 'CT' | 'REVISION'} [];
  tireHealth?: {
    mileageSinceChange: number;
    wearPercentage: number;
    lastChangeDate?: string;
    recommendation: string;
  };
  lastCTInvoice?: Invoice;
  allDetectedParts: {name: string, date: string, km: number, ref?: string}[];
  healthScore: number; // Nouveau: Coefficient de santé (0-100)
  estimatedValue: number; // Nouveau: Estimation de la cote
}

export const calculateMaintenanceStatus = (car: Car, invoices: Invoice[], notifications: AppNotification[] = []): MaintenanceStatus => {
  const currentKm = invoices.length > 0 ? Math.max(...invoices.map(i => i.km)) : car.initialKm;
  const today = new Date();
  const alerts: string[] = [];
  const pendingTasks: {id: string, label: string, severity: 'low' | 'high', basis?: string}[] = [];
  const upcomingDeadlines: MaintenanceStatus['upcomingDeadlines'] = [];

  const lastDocDate = invoices.length > 0 
    ? new Date(Math.max(...invoices.map(i => new Date(i.date).getTime())))
    : new Date(car.firstRegistrationDate);

  const daysSinceLastCheck = Math.floor((today.getTime() - lastDocDate.getTime()) / (1000 * 60 * 60 * 24));

  // --- 0. CONTRÔLES PÉRIODIQUES (SÉCURITÉ) ---
  if (daysSinceLastCheck >= BASE_RULES.CHECK_TIRES_DAYS) {
    pendingTasks.push({
      id: 'check_tires',
      label: 'Vérifier la pression des pneus',
      severity: 'high',
      basis: `Dernier contrôle il y a ${daysSinceLastCheck} jours (Recommandé tous les 30 jours)`
    });
  }

  if (daysSinceLastCheck >= BASE_RULES.CHECK_FLUIDS_DAYS) {
    pendingTasks.push({
      id: 'check_fluids',
      label: 'Vérifier les niveaux (Lave-glace, Refroidissement)',
      severity: 'low',
      basis: `Dernier contrôle il y a ${daysSinceLastCheck} jours`
    });
  }

  if (daysSinceLastCheck >= BASE_RULES.CHECK_OIL_DAYS) {
    pendingTasks.push({
      id: 'check_oil',
      label: 'Vérifier le niveau d\'huile moteur',
      severity: 'high',
      basis: `Dernier contrôle il y a ${daysSinceLastCheck} jours`
    });
  }

  const make = car.name.split(' ')[0].toUpperCase();
  let maintenanceIntervalKm = BASE_RULES.REVISION_KM;
  
  if (['RENAULT', 'PEUGEOT', 'CITROEN'].includes(make)) maintenanceIntervalKm = 20000;
  if (['BMW', 'AUDI', 'MERCEDES', 'PORSCHE'].includes(make)) maintenanceIntervalKm = 30000;
  if (car.fuelType === 'electrique') maintenanceIntervalKm = 30000;

  // --- 1. CALCUL DU SCORE DE SANTÉ (COEFFICIENT IA) ---
  let healthScore = 100;

  // Impact de l'âge (pénalité de base 2% par an)
  const carAgeYears = (today.getTime() - new Date(car.firstRegistrationDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
  healthScore -= Math.min(20, carAgeYears * 2);

  // Impact du kilométrage élevé
  if (currentKm > 100000) healthScore -= 5;
  if (currentKm > 200000) healthScore -= 10;

  // Impact entretien (Révision)
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
      healthScore -= 15;
      alerts.push("REVISION_DUE");
      pendingTasks.push({
        id: 'rev_due', 
        label: `Révision ${make} à effectuer`, 
        severity: 'high',
        basis: `Dernière faite le ${revDate.toLocaleDateString()} (${kmSinceRevision.toLocaleString()} km parcourus)`
      });
    } else {
      // Bonus pour entretien à jour
      healthScore += 5;
    }
  } else {
    healthScore -= 20; // Aucune révision trouvée = gros risque
  }

  // Impact Pneus
  const lastTireChange = invoices
    .filter(i => /pneu|pneumatique|tire|montage/i.test(i.title.toLowerCase()) && i.price > 100)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  let wearPercentage = 0;
  let mileageSinceChange = lastTireChange ? currentKm - lastTireChange.km : currentKm;
  wearPercentage = Math.min(100, Math.round((mileageSinceChange / BASE_RULES.TIRE_LIFESPAN_KM) * 100));

  if (wearPercentage > 80) healthScore -= 10;

  // Impact Contrôle Technique
  const lastCT = invoices
    .filter(i => /contr[oô]le technique|ct\b|visite technique/i.test(i.title.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const nextCTDate = calculateNextCT(car.firstRegistrationDate, invoices);
  const diffTimeCT = nextCTDate.getTime() - today.getTime();
  const diffDaysCT = Math.ceil(diffTimeCT / (1000 * 60 * 60 * 24));

  if (diffDaysCT < 0) {
    healthScore -= 30;
    alerts.push("CT_EXPIRED");
    pendingTasks.push({id: 'ct_crit', label: 'Contrôle Technique PÉRIMÉ', severity: 'high', basis: `Date limite : ${nextCTDate.toLocaleDateString()}`});
  } else if (diffDaysCT < 30) {
    upcomingDeadlines.push({id: 'ct_soon', label: 'Contrôle Technique', date: nextCTDate.toLocaleDateString(), type: 'CT'});
  }

  // Impact Courroie de Distribution
  const lastTimingBelt = invoices
    .filter(i => /courroie|distribution|timing belt/i.test(i.title.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const timingBeltIntervalKm = car.specs?.timingBeltIntervalKm || BASE_RULES.TIMING_BELT_KM;
  const timingBeltIntervalYears = car.specs?.timingBeltIntervalYears || BASE_RULES.TIMING_BELT_YEARS;

  if (lastTimingBelt) {
    const kmSinceBelt = currentKm - lastTimingBelt.km;
    const yearsSinceBelt = (today.getTime() - new Date(lastTimingBelt.date).getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    if (kmSinceBelt >= timingBeltIntervalKm || yearsSinceBelt >= timingBeltIntervalYears) {
      healthScore -= 25;
      pendingTasks.push({
        id: 'belt_due',
        label: 'Remplacement Courroie de Distribution',
        severity: 'high',
        basis: `Dernier remplacement : ${kmSinceBelt.toLocaleString()} km / ${Math.round(yearsSinceBelt)} ans`
      });
    }
  } else if (currentKm >= timingBeltIntervalKm || carAgeYears >= timingBeltIntervalYears) {
    healthScore -= 20;
    pendingTasks.push({
      id: 'belt_missing',
      label: 'Vérifier Courroie de Distribution',
      severity: 'high',
      basis: 'Aucun historique trouvé. Risque de casse moteur.'
    });
  }

  // Plafonnement du score
  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

  // --- 2. ESTIMATION DE LA COTE ARGUS (SIMULÉE) ---
  // Algorithme simplifié : Base 25000€ - 15% par an - 0.10€ par km
  let estimatedValue = 25000;
  if (['BMW', 'AUDI', 'MERCEDES', 'PORSCHE'].includes(make)) estimatedValue = 45000;
  if (['RENAULT', 'PEUGEOT', 'CITROEN', 'DACIA'].includes(make)) estimatedValue = 18000;

  // Dépréciation annuelle
  const depreciationFactor = Math.pow(0.85, carAgeYears);
  estimatedValue = estimatedValue * depreciationFactor;

  // Dépréciation kilométrique
  estimatedValue -= currentKm * 0.05;

  // Bonus Santé IA
  const healthBonus = (healthScore - 50) * 100; // Un score de 100 donne +5000€, un score de 0 donne -5000€
  estimatedValue += healthBonus;

  estimatedValue = Math.max(500, Math.round(estimatedValue / 100) * 100);

  // --- 3. AGRÉGATION DES PIÈCES IA ---
  const allDetectedParts: {name: string, date: string, km: number, ref?: string}[] = [];
  invoices.forEach(inv => {
    if (inv.detectedSpecs) {
      if (inv.detectedSpecs.mechanicalParts) {
        inv.detectedSpecs.mechanicalParts.forEach(p => allDetectedParts.push({ name: p, date: inv.date, km: inv.km }));
      }
      if (inv.detectedSpecs.filterRefs) {
        inv.detectedSpecs.filterRefs.forEach(f => allDetectedParts.push({ name: 'Filtre', ref: f, date: inv.date, km: inv.km }));
      }
      if (inv.detectedSpecs.oilViscosity) {
        allDetectedParts.push({ name: 'Huile Moteur', ref: inv.detectedSpecs.oilViscosity, date: inv.date, km: inv.km });
      }
      if (inv.detectedSpecs.batteryRef) {
        allDetectedParts.push({ name: 'Batterie', ref: inv.detectedSpecs.batteryRef, date: inv.date, km: inv.km });
      }
    }
  });

  // --- 4. FILTRAGE PAR NOTIFICATIONS (ACTIONS DÉJÀ FAITES) ---
  const filteredPendingTasks = pendingTasks.filter(task => {
    const doneNotif = notifications.find(n => n.carId === car.id && n.title === task.label && n.actionDone);
    return !doneNotif;
  });

  const filteredUpcomingDeadlines = upcomingDeadlines.filter(deadline => {
    const doneNotif = notifications.find(n => n.carId === car.id && n.title.includes(deadline.label) && n.actionDone);
    return !doneNotif;
  });

  let status: MaintenanceStatus['status'] = 'success';
  let message = `Toutes les échéances de votre ${car.name} sont à jour.`;

  if (filteredPendingTasks.some(t => t.severity === 'high')) {
    status = 'critical';
    message = `ALERTE : Des entretiens critiques sont en retard.`;
  } else if (filteredPendingTasks.length > 0 || filteredUpcomingDeadlines.length > 0) {
    status = 'warning';
    message = `VIGILANCE : Des échéances approchent.`;
  }

  return { 
    status, 
    message, 
    nextDeadline: nextCTDate.toLocaleDateString(), 
    alerts,
    pendingTasks: filteredPendingTasks,
    upcomingDeadlines: filteredUpcomingDeadlines,
    tireHealth: {
      mileageSinceChange,
      wearPercentage,
      lastChangeDate: lastTireChange?.date,
      recommendation: wearPercentage > 85 ? "Remplacement recommandé immédiatement." : "Pneus en bon état apparent."
    },
    lastCTInvoice: lastCT,
    allDetectedParts,
    healthScore,
    estimatedValue
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
      return estimatedNext;
  }
  return firstCT;
};
