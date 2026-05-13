import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { IconSchool, IconWifiOff, IconUser, IconLogout, IconKey, IconMoon, IconSun } from '@tabler/icons-react';
import { useOffline } from '../../hooks/useOffline.js';
import { useTheme } from '../../hooks/useTheme.js';
import { useState } from 'react';

export function Header({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isOffline = useOffline();
  const { dark, toggle: toggleTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar bg-primary text-primary-content sticky top-0 z-40 shadow-md min-h-14 px-3">
      <div className="flex-1 flex items-center gap-2">
        <IconSchool size={22} />
        <span className="font-bold text-base">{title ?? 'EduChat'}</span>
      </div>

      <div className="flex-none flex items-center gap-2">
        {isOffline && (
          <div className="tooltip tooltip-bottom" data-tip="Sin conexión">
            <IconWifiOff size={18} className="text-warning" />
          </div>
        )}

        {user && (
          <div className="relative">
            <button
              className="avatar placeholder cursor-pointer"
              onClick={() => setShowMenu((v) => !v)}
            >
              <div className="w-9 h-9 rounded-full bg-primary-content text-primary ring-2 ring-primary-content/30 hover:ring-primary-content transition-all">
                <span className="text-sm font-bold">{user.nombre.charAt(0).toUpperCase()}</span>
              </div>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-11 z-50 w-56 bg-base-100 text-base-content rounded-xl shadow-xl border border-base-200 overflow-hidden">
                  {/* Info usuario */}
                  <div className="px-4 py-3 border-b border-base-200 bg-base-200/50">
                    <p className="font-semibold text-sm truncate">{user.nombre}</p>
                    <p className="text-xs text-base-content/50 truncate">{user.email}</p>
                  </div>

                  <ul className="py-1">
                    <li>
                      <button
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-base-200 transition-colors"
                        onClick={() => { setShowMenu(false); navigate('/perfil'); }}
                      >
                        <IconUser size={16} className="text-base-content/60" />
                        Ver perfil
                      </button>
                    </li>
                    <li>
                      <button
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-base-200 transition-colors"
                        onClick={() => { setShowMenu(false); navigate('/perfil?tab=password'); }}
                      >
                        <IconKey size={16} className="text-base-content/60" />
                        Cambiar contraseña
                      </button>
                    </li>

                    {/* Switch tema */}
                    <li className="border-t border-base-200 mt-1 pt-1">
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-3 text-sm">
                          {dark ? <IconMoon size={16} className="text-base-content/60" /> : <IconSun size={16} className="text-base-content/60" />}
                          <span>{dark ? 'Modo oscuro' : 'Modo claro'}</span>
                        </div>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary toggle-sm"
                          checked={dark}
                          onChange={toggleTheme}
                        />
                      </div>
                    </li>

                    <li className="border-t border-base-200 mt-1 pt-1">
                      <button
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
                        onClick={handleLogout}
                      >
                        <IconLogout size={16} />
                        Cerrar sesión
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
