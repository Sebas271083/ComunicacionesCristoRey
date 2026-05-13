import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { IconSchool } from '@tabler/icons-react';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'papa' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-sm">
        <div className="card-body">
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <IconSchool size={36} className="text-primary-content" />
            </div>
            <h1 className="card-title text-2xl">Crear cuenta</h1>
          </div>

          {error && <div className="alert alert-error py-2 text-sm"><span>{error}</span></div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Nombre completo</span></label>
              <input name="nombre" type="text" placeholder="Juan García" className="input input-bordered w-full"
                value={form.nombre} onChange={handleChange} required />
            </div>

            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Email</span></label>
              <input name="email" type="email" placeholder="tu@email.com" className="input input-bordered w-full"
                value={form.email} onChange={handleChange} required />
            </div>

            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Contraseña</span></label>
              <input name="password" type="password" placeholder="Mínimo 6 caracteres" className="input input-bordered w-full"
                value={form.password} onChange={handleChange} required minLength={6} />
            </div>

            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Soy...</span></label>
              <select name="rol" className="select select-bordered w-full" value={form.rol} onChange={handleChange}>
                <option value="papa">Papá / Mamá</option>
                <option value="docente">Docente</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-base-content/60 mt-2">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="link link-primary font-medium">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
