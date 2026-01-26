
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
export const simulateCloudEmail = (email: string, carName: string, reason: string, tasks: string[]) => {
  const taskList = tasks.length > 0 ? `\n\nActions requises :\n- ${tasks.join('\n- ')}` : "";
  console.log(`[IA PROACTIVE EMAIL] Destinataire: ${email}\nObjet: Entretien de votre ${carName}\nContenu: ${reason}${taskList}`);
};

/**
 * Vérifie l'état d'un véhicule et envoie une alerte si nécessaire
 */
export const checkVehicleHealthAndNotify = async (car: Car, invoices: Invoice[], userEmail: string) => {
  const health = calculateMaintenanceStatus(car, invoices);
  
  // Récupération de toutes les tâches
  const allTasks = [
    ...health.pendingTasks.map(t => t.label),
    ...health.upcomingDeadlines.map(d => `${d.label} (${d.date})`)
  ];

  if (allTasks.length > 0) {
    const hasCritical = health.status === 'critical';
    const alertType = hasCritical ? 'critical' : 'proactive';
    const lastAlertKey = `last_alert_${car.id}_${alertType}`;
    const lastAlertTime = localStorage.getItem(lastAlertKey);
    const now = Date.now();

    // Fréquence d'alerte : 24h pour critique, 48h pour informatif
    const interval = hasCritical ? 24 : 48;
    if (!lastAlertTime || (now - parseInt(lastAlertTime)) > interval * 60 * 60 * 1000) {
      let title = "";
      let body = "";

      if (hasCritical) {
        title = `🚨 ALERTE ENTRETIEN : ${car.plate}`;
        body = `Urgent : ${allTasks[0]}. ${allTasks.length > 1 ? `(+${allTasks.length - 1} autres tâches)` : ""}`;
      } else {
        title = `📅 RAPPEL AUTOBOOK : ${car.plate}`;
        body = `Pensez à : ${allTasks[0]}. Votre garage numérique veille sur votre sécurité.`;
      }
      
      await sendLocalNotification(title, body);
      simulateCloudEmail(userEmail, car.name, body, allTasks);
      localStorage.setItem(lastAlertKey, now.toString());
    }
  }
};
