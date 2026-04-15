
import { Car, Invoice, AppNotification } from '../types';
import { calculateMaintenanceStatus } from './mechanicRules';
import { cloud } from './cloudService';

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
export const checkVehicleHealthAndNotify = async (car: Car, invoices: Invoice[], userEmail: string, userId: string, existingNotifications: AppNotification[] = []) => {
  const health = calculateMaintenanceStatus(car, invoices, existingNotifications);
  
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
      // Filter out tasks that have a corresponding "Done" notification recently
      const pendingTasksToSend = health.pendingTasks.filter(task => {
        const existing = existingNotifications.find(n => n.carId === car.id && n.title === task.label);
        return !existing || (!existing.actionDone && !existing.read);
      });

      const deadlinesToSend = health.upcomingDeadlines.filter(deadline => {
        const existing = existingNotifications.find(n => n.carId === car.id && n.title.includes(deadline.label));
        return !existing || (!existing.actionDone && !existing.read);
      });

      if (pendingTasksToSend.length === 0 && deadlinesToSend.length === 0) return;

      // Send a summary local notification
      let summaryTitle = hasCritical ? `🚨 ALERTE ENTRETIEN : ${car.plate}` : `📅 RAPPEL AUTOBOOK : ${car.plate}`;
      let summaryBody = `Vous avez ${pendingTasksToSend.length + deadlinesToSend.length} interventions à prévoir pour votre sécurité.`;
      
      await sendLocalNotification(summaryTitle, summaryBody);
      simulateCloudEmail(userEmail, car.name, summaryBody, allTasks);
      
      // Create separate persistent notifications for each task
      for (const task of pendingTasksToSend) {
        const notification: AppNotification = {
          id: `task_${car.id}_${task.id}_${now}`,
          userId: userId,
          title: task.label,
          message: task.basis || "Intervention recommandée pour la longévité de votre véhicule.",
          type: task.severity === 'high' ? 'error' : 'warning',
          date: new Date().toISOString(),
          read: false,
          carId: car.id,
          actionRequired: true,
          actionDone: false
        };
        await cloud.sendNotification(notification);
      }

      for (const deadline of deadlinesToSend) {
        const notification: AppNotification = {
          id: `deadline_${car.id}_${deadline.id}_${now}`,
          userId: userId,
          title: `Échéance : ${deadline.label}`,
          message: `Date limite prévue : ${deadline.date}. Anticipez pour éviter les mauvaises surprises.`,
          type: 'info',
          date: new Date().toISOString(),
          read: false,
          carId: car.id,
          actionRequired: true,
          actionDone: false
        };
        await cloud.sendNotification(notification);
      }

      localStorage.setItem(lastAlertKey, now.toString());
    }
  }
};
