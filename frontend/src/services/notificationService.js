import api from './api.js';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export const notificationService = {
  isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  isGranted() {
    return Notification.permission === 'granted';
  },

  isDenied() {
    return Notification.permission === 'denied';
  },

  async getVapidPublicKey() {
    const res = await api.get('/notificaciones/vapid-public-key');
    return res.data.data;
  },

  async suscribir() {
    if (!this.isSupported()) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const reg = await navigator.serviceWorker.ready;
    const vapidKey = await this.getVapidPublicKey();

    // Si ya hay suscripción activa, reutilizarla
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    const { endpoint, keys } = sub.toJSON();
    await api.post('/notificaciones/subscribe', {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });

    return sub;
  },

  async desuscribir() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    await api.delete('/notificaciones/subscribe');
  },
};
