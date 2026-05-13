import { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService.js';

export function useNotificaciones() {
  const [estado, setEstado] = useState('idle'); // 'idle' | 'pending' | 'granted' | 'denied' | 'unsupported'
  const [suscribiendo, setSuscribiendo] = useState(false);

  useEffect(() => {
    if (!notificationService.isSupported()) { setEstado('unsupported'); return; }
    const perm = Notification.permission;
    if (perm === 'granted') setEstado('granted');
    else if (perm === 'denied') setEstado('denied');
    else setEstado('pending');
  }, []);

  const activar = async () => {
    setSuscribiendo(true);
    try {
      const sub = await notificationService.suscribir();
      setEstado(sub ? 'granted' : 'denied');
    } catch {
      setEstado('denied');
    } finally {
      setSuscribiendo(false);
    }
  };

  const desactivar = async () => {
    await notificationService.desuscribir();
    setEstado('pending');
  };

  return { estado, suscribiendo, activar, desactivar };
}
