import { useState } from 'react';
import { IconBell, IconBellOff, IconX } from '@tabler/icons-react';
import { Header } from './Header.jsx';
import { BottomNav } from './BottomNav.jsx';
import { useNotificaciones } from '../../hooks/useNotificaciones.js';

function NotificationBanner() {
  const { estado, suscribiendo, activar } = useNotificaciones();
  const [descartado, setDescartado] = useState(
    () => localStorage.getItem('notif_banner_dismissed') === '1'
  );

  if (descartado || estado !== 'pending') return null;

  const descartar = () => {
    localStorage.setItem('notif_banner_dismissed', '1');
    setDescartado(true);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border-b border-primary/20 text-sm flex-shrink-0">
      <IconBell size={15} className="text-primary flex-shrink-0" />
      <span className="flex-1 text-xs text-base-content/80">
        Activá las notificaciones para recibir mensajes aunque no tengas la app abierta.
      </span>
      <button
        className="btn btn-primary btn-xs"
        onClick={activar}
        disabled={suscribiendo}
      >
        {suscribiendo ? <span className="loading loading-spinner loading-xs" /> : 'Activar'}
      </button>
      <button className="btn btn-ghost btn-xs btn-circle" onClick={descartar}>
        <IconX size={13} />
      </button>
    </div>
  );
}

export function Layout({ children, title, hideHeader = false, fullHeight = false }) {
  return (
    <div className="flex flex-col h-screen bg-base-200 overflow-hidden">
      {!hideHeader && <Header title={title} />}
      <NotificationBanner />
      <main className={fullHeight ? 'flex-1 overflow-hidden' : 'flex-1 overflow-y-auto pb-20'}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
