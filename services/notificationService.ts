
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("Ce navigateur ne supporte pas les notifications desktop");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const sendLocalNotification = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    // Sur mobile, navigator.serviceWorker.ready est souvent nécessaire pour des notifs persistantes,
    // mais new Notification() fonctionne pour les applis actives ou en background proche sur Android/Desktop.
    new Notification(title, {
      body: body,
      icon: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png', // Icône générique voiture ou logo app
      tag: 'nsp-alert' // Evite d'empiler les notifs identiques
    });
  }
};
