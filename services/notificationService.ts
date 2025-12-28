
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("Les notifications ne sont pas supportées par ce navigateur.");
    return false;
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  return permission === "granted";
};

/**
 * Envoie une notification via le Service Worker pour un affichage "natif" sur mobile.
 */
export const sendLocalNotification = async (title: string, body: string) => {
  if (!("serviceWorker" in navigator)) {
    // Fallback si pas de SW
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  if (registration && Notification.permission === "granted") {
    // Fix: Cast the options to any to avoid TypeScript errors regarding 'vibrate' property 
    // which is supported in browsers but might be missing from some NotificationOptions type definitions.
    registration.showNotification(title, {
      body: body,
      icon: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
      vibrate: [200, 100, 200],
      tag: 'autobook-alert',
      renotify: true,
      data: {
        url: window.location.origin
      }
    } as any);
  }
};
