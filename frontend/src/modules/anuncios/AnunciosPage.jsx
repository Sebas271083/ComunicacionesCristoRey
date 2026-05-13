import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../../components/Layout/Layout.jsx';
import { anunciosService } from '../../services/anunciosService.js';
import { cursosService } from '../../services/cursosService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatRelativo } from '../../utils/formatDate.js';
import { IconPlus, IconSpeakerphone, IconTrash, IconWorld, IconSchool } from '@tabler/icons-react';

export function AnunciosPage() {
  const { user } = useAuth();
  const [anuncios, setAnuncios] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: '', contenido: '', cursoId: '', destinatario: 'todos' });

  const PUEDE_CREAR = ['docente', 'admin', 'director', 'secretaria'];
  const puedeCrear = PUEDE_CREAR.includes(user.rol);

  const cargar = useCallback(async () => {
    try {
      const data = await anunciosService.listar();
      setAnuncios(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (puedeCrear && showForm) {
      cursosService.listar().then(setCursos).catch(() => {});
    }
  }, [showForm, puedeCrear]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const crear = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const nuevo = await anunciosService.crear({
        titulo: form.titulo,
        contenido: form.contenido,
        cursoId: form.cursoId || null,
        destinatario: form.destinatario,
      });
      setAnuncios((prev) => [nuevo, ...prev]);
      setShowForm(false);
      setForm({ titulo: '', contenido: '', cursoId: '', destinatario: 'todos' });
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este anuncio?')) return;
    await anunciosService.eliminar(id);
    setAnuncios((prev) => prev.filter((a) => a.id !== id));
  };


  return (
    <Layout title="Anuncios">
      <div className="page-container p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Anuncios</h2>
          {puedeCrear && (
            <button className="btn btn-primary btn-sm gap-1" onClick={() => setShowForm(true)}>
              <IconPlus size={16} /> Nuevo
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : anuncios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-base-content/40 gap-2">
            <IconSpeakerphone size={48} />
            <p className="text-sm">No hay anuncios</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {anuncios.map((anuncio) => (
              <div key={anuncio.id} className="card bg-base-100 shadow-sm">
                <div className="card-body p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {anuncio.cursoId ? (
                          <span className="badge badge-primary badge-sm gap-1">
                            <IconSchool size={10} /> {anuncio.curso?.nombre}
                          </span>
                        ) : (
                          <span className="badge badge-ghost badge-sm gap-1">
                            <IconWorld size={10} /> General
                          </span>
                        )}
                        {anuncio.destinatario === 'docentes' && (
                          <span className="badge badge-warning badge-sm">Solo docentes</span>
                        )}
                        {anuncio.destinatario === 'padres' && (
                          <span className="badge badge-info badge-sm">Solo padres</span>
                        )}
                      </div>
                      <h3 className="font-bold text-base">{anuncio.titulo}</h3>
                      <p className="text-sm text-base-content/70 mt-1 whitespace-pre-line">{anuncio.contenido}</p>
                      <p className="text-xs text-base-content/40 mt-2">
                        {anuncio.creador?.nombre} · {formatRelativo(anuncio.createdAt)}
                      </p>
                    </div>
                    {(['admin','director','secretaria'].includes(user.rol) || anuncio.creador?.id === user.id) && (
                      <button className="btn btn-ghost btn-xs text-error flex-shrink-0" onClick={() => eliminar(anuncio.id)}>
                        <IconTrash size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Nuevo anuncio</h3>
            <form onSubmit={crear} className="flex flex-col gap-3">
              <div className="form-control">
                <label className="label py-1"><span className="label-text font-medium">Título *</span></label>
                <input name="titulo" type="text" className="input input-bordered" placeholder="Asunto del anuncio"
                  value={form.titulo} onChange={handleChange} required />
              </div>

              <div className="form-control">
                <label className="label py-1"><span className="label-text font-medium">Mensaje *</span></label>
                <textarea name="contenido" className="textarea textarea-bordered" rows={4}
                  placeholder="Escribí el contenido del anuncio..."
                  value={form.contenido} onChange={handleChange} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text font-medium">Curso</span></label>
                  <select name="cursoId" className="select select-bordered select-sm" value={form.cursoId} onChange={handleChange}>
                    <option value="">Todos los cursos</option>
                    {cursos.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text font-medium">Para</span></label>
                  <select name="destinatario" className="select select-bordered select-sm" value={form.destinatario} onChange={handleChange}>
                    <option value="todos">Todos</option>
                    <option value="padres">Solo padres</option>
                    <option value="docentes">Solo docentes</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                  {saving ? <span className="loading loading-spinner loading-sm" /> : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowForm(false)} />
        </dialog>
      )}
    </Layout>
  );
}
