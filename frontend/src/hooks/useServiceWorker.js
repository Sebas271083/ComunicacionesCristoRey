import { useState, useEffect } from 'react';

export function useServiceWorker() {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let reloading = false;

    const onControllerChange = () => {
      // Evitar recargas en loop (raro, pero posible si hay múltiples tabs)
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    const trackInstalling = (worker) => {
      worker.addEventListener('statechange', () => {
        // 'installed' + hay un controlador activo = nuevo SW en waiting
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          setWaitingWorker(worker);
          setUpdateAvailable(true);
        }
      });
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        // Caso A: ya había un SW en waiting antes de que la página cargara
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
        }

        // Caso B: se descarga una nueva versión mientras la página está abierta
        registration.addEventListener('updatefound', () => {
          if (registration.installing) {
            trackInstalling(registration.installing);
          }
        });

        // Verificar actualizaciones cada vez que la pestaña recupera el foco
        const onVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
          document.removeEventListener('visibilitychange', onVisibilityChange);
        };
      } catch (err) {
        console.error('[SW] Error al registrar:', err);
      }
    };

    // Caso C: el SW en waiting llamó skipWaiting → recargar la página
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    let cleanup;
    register().then((fn) => { cleanup = fn; });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      cleanup?.();
    };
  }, []);

  // Enviar mensaje al SW en waiting para que se active
  const updateServiceWorker = () => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
  };

  return { updateAvailable, updateServiceWorker };
}
