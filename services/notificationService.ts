
import { Car, Invoice } from '../types';
import { calculateMaintenanceStatus } from './mechanicRules';

/**
 * Demande la permission d'envoyer des notifications
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.warn("Les notifications ne sont pas supportées.");
    return false;
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  return permission === "granted";
};

/**
 * Envoie une notification système native
 */
export const sendLocalNotification = async (title: string, body: string) => {
  if (Notification.permission !== "granted") return;

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        registration.showNotification(title, {
          body: body,
          icon: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
          badge: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
          vibrate: [200, 100, 200],
          tag: 'autobook-alert',
          renotify: true,
        } as any);
        return;
      }
    }
    new Notification(title, { body });
  } catch (e) {
    console.warn("Notification error:", e);
  }
};

/**
 * Simule l'envoi d'un email de rappel via le Cloud
 */
export const simulateCloudEmail = (email: string, carName: string, reason: string) => {
  console.log(`[IA PROACTIVE EMAIL] Envoi de l'alerte à ${email} pour la ${carName}. Raison: ${reason}`);
};

/**
 * Vérifie l'état d'un véhicule et envoie une alerte si nécessaire
 */
export const checkVehicleHealthAndNotify = async (car: Car, invoices: Invoice[], userEmail: string) => {
  const health = calculateMaintenanceStatus(car, invoices);
  
  // Alertes critiques ou imminentes
  const hasCritical = health.status === 'critical';
  const hasUpcoming = health.upcomingDeadlines.length > 0;

  if (hasCritical || hasUpcoming) {
    const alertType = hasCritical ? 'critical' : 'proactive';
    const lastAlertKey = `last_alert_${car.id}_${alertType}`;
    const lastAlertTime = localStorage.getItem(lastAlertKey);
    const now = Date.now();

    // On n'alerte pas plus d'une fois toutes les 48h pour les rappels proactifs
    const interval = hasCritical ? 24 : 48;
    if (!lastAlertTime || (now - parseInt(lastAlertTime)) > interval * 60 * 60 * 1000) {
      let title = "";
      let body = health.message;

      if (hasCritical) {
        title = `🚨 ACTION REQUISE : ${car.plate}`;
      } else {
        const deadline = health.upcomingDeadlines[0];
        title = `📅 RAPPEL PROACTIF : ${car.plate}`;
        body = `Votre ${deadline.type === 'CT' ? 'Contrôle Technique' : 'Révision'} approche (${deadline.date}). Prévoyez votre rendez-vous !`;
      }
      
      await sendLocalNotification(title, body);
      simulateCloudEmail(userEmail, car.name, body);
      localStorage.setItem(lastAlertKey, now.toString());
    }
  }
};
