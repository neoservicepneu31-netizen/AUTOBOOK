
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
  
  // Fallback
  new Notification(title, { body });
};

/**
 * Simule l'envoi d'un email de rappel via le Cloud
 */
export const simulateCloudEmail = (email: string, carName: string, reason: string) => {
  console.log(`[CLOUD EMAIL] Envoi de l'alerte à ${email} pour la ${carName}. Raison: ${reason}`);
  // Ici on pourrait appeler une cloud function réelle
};

/**
 * Vérifie l'état d'un véhicule et envoie une alerte si nécessaire
 */
export const checkVehicleHealthAndNotify = async (car: Car, invoices: Invoice[], userEmail: string) => {
  const health = calculateMaintenanceStatus(car, invoices);
  
  if (health.status === 'critical' || health.status === 'warning') {
    const lastAlertKey = `last_alert_${car.id}_${health.status}`;
    const lastAlertTime = localStorage.getItem(lastAlertKey);
    const now = Date.now();

    // On n'alerte pas plus d'une fois toutes les 24h pour le même statut
    if (!lastAlertTime || (now - parseInt(lastAlertTime)) > 24 * 60 * 60 * 1000) {
      const title = health.status === 'critical' ? `🚨 ALERTE CRITIQUE : ${car.plate}` : `⚠️ RAPPEL ENTRETIEN : ${car.plate}`;
      
      // Notification Push
      await sendLocalNotification(title, health.message);
      
      // Simulation Email
      simulateCloudEmail(userEmail, car.name, health.message);
      
      localStorage.setItem(lastAlertKey, now.toString());
    }
  }
};
