import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { IconLogout, IconMail, IconShield, IconKey, IconCheck } from '@tabler/icons-react';
import api from '../../services/api.js';

const ROL_LABEL = { papa: 'Papá / Mamá', docente: 'Docente', admin: 'Administrador' };

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'password' ? 'password' : 'info');

  // Cambio de contraseña
  const [passForm, setPassForm] = useState({ actual: '', nueva: '', confirmar: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [passOk, setPassOk] = useState(false);

  useEffect(() => {
    if (searchParams.get('tab') === 'password') setTab('password');
  }, [searchParams]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handlePassChange = (e) => setPassForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handlePassSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassOk(false);
    if (passForm.nueva !== passForm.confirmar) {
      setPassError('Las contraseñas no coinciden');
      return;
    }
    if (passForm.nueva.length < 6) {
      setPassError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    setPassLoading(true);
    try {
      await api.put('/usuarios/cambiar-password', {
        passwordActual: passForm.actual,
        passwordNueva: passForm.nueva,
      });
      setPassOk(true);
      setPassForm({ actual: '', nueva: '', confirmar: '' });
    } catch (err) {
      setPassError(err.response?.data?.error ?? 'Error al cambiar contraseña');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <Layout title="Perfil">
      <div className="page-container p-4 max-w-lg mx-auto">
        {/* Card usuario */}
        <div className="card bg-base-100 shadow-md mb-4">
          <div className="card-body items-center text-center py-6 gap-3">
            <div className="avatar placeholder">
              <div className="w-20 h-20 rounded-full bg-primary text-primary-content">
                <span className="text-3xl font-bold">{user?.nombre.charAt(0).toUpperCase()}</span>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.nombre}</h2>
              <span className="badge badge-primary mt-1">{ROL_LABEL[user?.rol] ?? user?.rol}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed bg-base-200 mb-4">
          <button className={`tab flex-1 ${tab === 'info' ? 'tab-active' : ''}`} onClick={() => setTab('info')}>
            Info
          </button>
          <button className={`tab flex-1 ${tab === 'password' ? 'tab-active' : ''}`} onClick={() => setTab('password')}>
            Contraseña
          </button>
        </div>

        {tab === 'info' && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body gap-3">
              <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                <IconMail size={18} className="text-base-content/50 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-base-content/50">Email</p>
                  <p className="font-medium text-sm truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                <IconShield size={18} className="text-base-content/50 flex-shrink-0" />
                <div>
                  <p className="text-xs text-base-content/50">Rol</p>
                  <p className="font-medium text-sm">{ROL_LABEL[user?.rol] ?? user?.rol}</p>
                </div>
              </div>
              <button
                className="btn btn-error btn-outline gap-2 mt-2"
                onClick={handleLogout}
              >
                <IconLogout size={18} />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {tab === 'password' && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <IconKey size={18} /> Cambiar contraseña
              </h3>

              {passError && <div className="alert alert-error py-2 text-sm"><span>{passError}</span></div>}
              {passOk && (
                <div className="alert alert-success py-2 text-sm">
                  <IconCheck size={16} /> Contraseña actualizada
                </div>
              )}

              <form onSubmit={handlePassSubmit} className="flex flex-col gap-3">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-sm">Contraseña actual</span></label>
                  <input name="actual" type="password" className="input input-bordered input-sm"
                    value={passForm.actual} onChange={handlePassChange} required />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-sm">Nueva contraseña</span></label>
                  <input name="nueva" type="password" className="input input-bordered input-sm"
                    value={passForm.nueva} onChange={handlePassChange} required minLength={6} />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-sm">Confirmar nueva contraseña</span></label>
                  <input name="confirmar" type="password" className="input input-bordered input-sm"
                    value={passForm.confirmar} onChange={handlePassChange} required />
                </div>
                <button type="submit" className="btn btn-primary btn-sm mt-1" disabled={passLoading}>
                  {passLoading ? <span className="loading loading-spinner loading-xs" /> : 'Guardar cambios'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
