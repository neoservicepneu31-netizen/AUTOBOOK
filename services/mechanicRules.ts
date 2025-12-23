
import { Invoice, Car } from '../types';

// Règles fournies par le mécanicien
const RULES = {
  REVISION_KM: 20000,
  REVISION_MONTHS: 12,
  DISTRIBUTION_KM: 150000,
  DISTRIBUTION_YEARS: 6,
  CT_YEARS: 2,
  CT_FIRST_YEARS: 4
};

interface MaintenanceStatus {
  status: 'success' | 'warning' | 'critical';
  message: string;
  nextDeadline: string;
}

export const calculateMaintenanceStatus = (car: Car, invoices: Invoice[]): MaintenanceStatus => {
  const currentKm = invoices.length > 0 ? Math.max(...invoices.map(i => i.km)) : 0; // Estimation basée sur la dernière facture
  const today = new Date();

  // 1. ANALYSE RÉVISION (1 an ou 20 000 km)
  const lastRevision = invoices
    .filter(i => i.title.toLowerCase().includes('révision') || i.title.toLowerCase().includes('vidange'))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (lastRevision) {
    const nextRevisionDate = new Date(lastRevision.date);
    nextRevisionDate.setFullYear(nextRevisionDate.getFullYear() + 1);
    
    const kmSinceRevision = currentKm - lastRevision.km;
    const kmRemaining = RULES.REVISION_KM - kmSinceRevision;

    if (kmSinceRevision >= RULES.REVISION_KM) {
      return { status: 'critical', message: `URGENT : Révision dépassée de ${Math.abs(kmRemaining)} km ! Risque moteur.`, nextDeadline: 'Immédiat' };
    }
    if (today > nextRevisionDate) {
      return { status: 'critical', message: `URGENT : Révision annuelle dépassée depuis le ${nextRevisionDate.toLocaleDateString()}.`, nextDeadline: 'Immédiat' };
    }
    if (kmRemaining < 2000) {
      return { status: 'warning', message: `Prévoir Révision bientôt (reste ${kmRemaining} km).`, nextDeadline: `${kmRemaining} km` };
    }
  } else if (invoices.length === 0) {
     // Pas d'historique
     return { status: 'warning', message: "Aucun historique. Ajoutez votre dernière révision pour le calcul.", nextDeadline: 'Inconnue' };
  }

  // 2. ANALYSE DISTRIBUTION (6 ans ou 150 000 km)
  // On cherche si une facture mentionne "Distribution"
  const lastBelt = invoices.find(i => i.title.toLowerCase().includes('distribution') || i.title.toLowerCase().includes('courroie'));
  
  const carAgeYears = (today.getTime() - new Date(car.firstRegistrationDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  
  if (!lastBelt) {
    // Jamais faite selon l'historique
    if (currentKm > RULES.DISTRIBUTION_KM) {
      return { status: 'critical', message: "ALERTE : Distribution à faire impérativement (>150 000km). Risque casse moteur.", nextDeadline: 'Immédiat' };
    }
    if (carAgeYears > RULES.DISTRIBUTION_YEARS) {
      return { status: 'critical', message: `ALERTE : Véhicule a ${carAgeYears.toFixed(1)} ans. Distribution à faire (>6 ans).`, nextDeadline: 'Immédiat' };
    }
  }

  // 3. CONTRÔLE TECHNIQUE (4 ans puis tous les 2 ans)
  const nextCTDate = calculateNextCT(car.firstRegistrationDate, invoices);
  const monthsToCT = (nextCTDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);

  if (monthsToCT < 0) {
    return { status: 'critical', message: `URGENT : Contrôle Technique périmé depuis le ${nextCTDate.toLocaleDateString()}. Vous êtes en infraction !`, nextDeadline: 'Passée' };
  }
  if (monthsToCT < 2) {
    return { status: 'warning', message: `Contrôle Technique à prévoir avant le ${nextCTDate.toLocaleDateString()}.`, nextDeadline: nextCTDate.toLocaleDateString() };
  }

  // Si tout va bien
  return { 
    status: 'success', 
    message: "Véhicule sain. L'IA veille au grain sur vos échéances.",
    nextDeadline: 'RAS'
  };
};

const calculateNextCT = (firstRegDateStr: string, invoices: Invoice[]): Date => {
  const firstReg = new Date(firstRegDateStr);
  
  // Chercher le dernier CT dans les factures avec une Regex précise
  const lastCT = invoices
    .filter(i => /contr[oô]le technique|ct\b|visite technique/i.test(i.title))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (lastCT) {
    // RÈGLE : Si on a un CT scanné (ou titre manuel), le prochain est DANS 2 ANS
    const next = new Date(lastCT.date);
    next.setFullYear(next.getFullYear() + 2);
    return next;
  }

  // RÈGLE PAR DÉFAUT : 4 ans après la première mise en circulation si aucun CT trouvé
  const firstCT = new Date(firstReg);
  firstCT.setFullYear(firstCT.getFullYear() + 4);
  return firstCT;
};
