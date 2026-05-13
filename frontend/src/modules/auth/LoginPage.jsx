import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { IconSchool, IconEye, IconEyeOff, IconDownload, IconShare } from '@tabler/icons-react';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showIOSHint, setShowIOSHint] = useState(false);

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-sm relative overflow-hidden">
        <img
          src="/logo.png"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none scale-110"
          style={{ opacity: 0.18, mixBlendMode: 'multiply' }}
          alt=""
          aria-hidden="true"
        />
        <div className="card-body relative z-10">
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <IconSchool size={36} className="text-primary-content" />
            </div>
            <h1 className="card-title text-2xl">EduChat</h1>
            <p className="text-base-content/60 text-sm text-center">Mensajería escolar</p>
          </div>

          {error && (
            <div className="alert alert-error py-2 text-sm">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-medium">Email</span>
              </label>
              <input
                name="email"
                type="email"
                placeholder="tu@email.com"
                className="input input-bordered w-full"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-medium">Contraseña</span>
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••"
                  className="input input-bordered w-full pr-12"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50"
                  onClick={() => setShowPass((v) => !v)}
                >
                  {showPass ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full mt-2"
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner loading-sm" /> : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-sm text-base-content/60 mt-2">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="link link-primary font-medium">
              Registrarse
            </Link>
          </p>

          {!isStandalone && (
            <div className="mt-4 pt-4 border-t border-base-200">
              {/* Android / Desktop Chrome/Edge: prompt nativo */}
              {installPrompt && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm w-full gap-2"
                  onClick={handleInstall}
                >
                  <IconDownload size={16} />
                  Instalar aplicación
                </button>
              )}

              {/* iOS Safari: instrucciones manuales */}
              {isIOS && !installPrompt && (
                <div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm w-full gap-2"
                    onClick={() => setShowIOSHint((v) => !v)}
                  >
                    <IconDownload size={16} />
                    Instalar en iPhone / iPad
                  </button>
                  {showIOSHint && (
                    <p className="text-xs text-base-content/60 mt-2 text-center leading-relaxed">
                      Tocá <IconShare size={12} className="inline mb-0.5" /> <strong>Compartir</strong> en Safari
                      y luego <strong>"Agregar a pantalla de inicio"</strong>
                    </p>
                  )}
                </div>
              )}

              {/* Android sin prompt nativo (Chrome ya instalado o prompt descartado) */}
              {isAndroid && !installPrompt && !isIOS && (
                <div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm w-full gap-2"
                    onClick={() => setShowIOSHint((v) => !v)}
                  >
                    <IconDownload size={16} />
                    Instalar en Android
                  </button>
                  {showIOSHint && (
                    <p className="text-xs text-base-content/60 mt-2 text-center leading-relaxed">
                      En Chrome tocá el menú <strong>⋮</strong> y seleccioná
                      {' '}<strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla de inicio"</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

