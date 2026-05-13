import { useState, useEffect } from 'react';

export function useServiceWorker() {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let reloading = false;

    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    const markUpdate = (worker) => {
      setWaitingWorker(worker);
      setUpdateAvailable(true);
    };

    const trackInstalling = (worker) => {
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          markUpdate(worker);
        }
      });
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        // Caso A: SW ya estaba en waiting al cargar la página
        if (registration.waiting) {
          markUpdate(registration.waiting);
          return;
        }

        // Caso B: SW todavía instalándose cuando la página cargó
        if (registration.installing) {
          trackInstalling(registration.installing);
        }

        // Caso C: nueva versión descargada mientras la página está abierta
        registration.addEventListener('updatefound', () => {
          if (registration.installing) {
            trackInstalling(registration.installing);
          }
        });

        // Forzar verificación inmediata contra el servidor
        registration.update().catch(() => {});

        // Re-verificar cada vez que el usuario vuelve a la app
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

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    let cleanup;
    register().then((fn) => { cleanup = fn; });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      cleanup?.();
    };
  }, []);

  const updateServiceWorker = () => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
  };

  return { updateAvailable, updateServiceWorker };
}
