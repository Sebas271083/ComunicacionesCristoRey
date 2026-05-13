import { useState } from 'react';
import { IconRefresh, IconX } from '@tabler/icons-react';

export function UpdateNotification({ available, onUpdate }) {
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (!available || dismissed) return null;

  const handleUpdate = () => {
    setUpdating(true);
    onUpdate();
    // Si por algún motivo el reload no ocurre en 5s, resetear
    setTimeout(() => setUpdating(false), 5000);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="
        fixed bottom-0 left-0 right-0 z-50
        safe-bottom
        flex items-center justify-between gap-3
        px-4 py-3
        bg-neutral text-neutral-content
        shadow-lg
        animate-slide-up
        sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2
        sm:w-auto sm:min-w-[340px] sm:max-w-sm
        sm:rounded-xl sm:px-5
      "
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-content/20 flex items-center justify-center">
          <IconRefresh size={16} className={updating ? 'animate-spin' : ''} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">Nueva versión disponible</p>
          <p className="text-xs text-neutral-content/70 truncate">
            Actualizá para ver los últimos cambios
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          className="btn btn-sm btn-primary"
          onClick={handleUpdate}
          disabled={updating}
        >
          {updating
            ? <span className="loading loading-spinner loading-xs" />
            : 'Actualizar'
          }
        </button>
        <button
          className="btn btn-ghost btn-sm btn-circle text-neutral-content/60 hover:text-neutral-content"
          onClick={() => setDismissed(true)}
          aria-label="Descartar"
        >
          <IconX size={16} />
        </button>
      </div>
    </div>
  );
}
