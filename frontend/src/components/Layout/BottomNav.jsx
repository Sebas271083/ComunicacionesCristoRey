import { NavLink } from 'react-router-dom';
import { IconMessages, IconClipboardList, IconCalendar, IconSpeakerphone, IconUser, IconSettings } from '@tabler/icons-react';
import { useChatStore } from '../../store/chatStore.js';
import { useAuth } from '../../context/AuthContext.jsx';

const PRIVILEGIADOS = ['admin', 'director', 'secretaria'];

export function BottomNav() {
  const unreadCount = useChatStore((s) => s.unreadCount);
  const { user } = useAuth();

  const esDocente = user?.rol === 'docente';

  const links = [
    ...(!esDocente || user?.puedeChat !== false ? [{
      to: '/chat',
      icon: IconMessages,
      label: 'Mensajes',
      badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : null,
    }] : []),
    ...(!esDocente || user?.puedeTareas !== false   ? [{ to: '/tareas',    icon: IconClipboardList, label: 'Tareas'    }] : []),
    ...(!esDocente || user?.puedeEventos !== false  ? [{ to: '/calendario', icon: IconCalendar,      label: 'Calendario'}] : []),
    ...(!esDocente || user?.puedeAnuncios !== false ? [{ to: '/anuncios',   icon: IconSpeakerphone,  label: 'Anuncios'  }] : []),
    ...(PRIVILEGIADOS.includes(user?.rol)
      ? [{ to: '/admin', icon: IconSettings, label: 'Admin' }]
      : [{ to: '/perfil', icon: IconUser, label: 'Perfil' }]
    ),
  ];

  return (
    <nav className="flex-shrink-0 flex border-t border-base-300 bg-base-100 z-50 h-14">
      {links.map(({ to, icon: Icon, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center gap-0.5 flex-1 text-[10px] transition-colors ${
              isActive ? 'text-primary' : 'text-base-content/50'
            }`
          }
        >
          <div className="relative">
            <Icon size={20} />
            {badge && (
              <span className="absolute -top-1.5 -right-2 bg-error text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
                {badge}
              </span>
            )}
          </div>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
