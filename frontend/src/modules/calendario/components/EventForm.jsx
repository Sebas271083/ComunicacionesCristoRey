import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { alumnosService } from '../../../services/alumnosService.js';

const TIPOS = ['examen', 'reunion', 'evento', 'feriado'];

export function EventForm({ onSubmit, onCancel, loading, cursos = [], puedeSegmentar = false }) {
  const hoy = format(new Date(), "yyyy-MM-dd'T'HH:mm");
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    tipo: 'evento',
    cursoId: '',
    alumnoId: '',
    destinatario: 'todos',
  });
  const [alumnos, setAlumnos] = useState([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);

  useEffect(() => {
    if (!form.cursoId) {
      setAlumnos([]);
      setForm((f) => ({ ...f, alumnoId: '' }));
      return;
    }
    setLoadingAlumnos(true);
    alumnosService.listar(form.cursoId)
      .then(setAlumnos)
      .catch(() => setAlumnos([]))
      .finally(() => setLoadingAlumnos(false));
  }, [form.cursoId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value, ...(name === 'cursoId' ? { alumnoId: '' } : {}) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="form-control">
        <label className="label py-1"><span className="label-text font-medium">Título *</span></label>
        <input name="titulo" type="text" placeholder="Ej: Reunión de padres" className="input input-bordered"
          value={form.titulo} onChange={handleChange} required />
      </div>

      <div className="form-control">
        <label className="label py-1"><span className="label-text font-medium">Tipo *</span></label>
        <select name="tipo" className="select select-bordered" value={form.tipo} onChange={handleChange}>
          {TIPOS.map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="form-control">
        <label className="label py-1"><span className="label-text font-medium">Fecha y hora *</span></label>
        <input name="fecha" type="datetime-local" className="input input-bordered"
          value={form.fecha} onChange={handleChange} min={hoy} required />
      </div>

      <div className="form-control">
        <label className="label py-1"><span className="label-text font-medium">Descripción</span></label>
        <textarea name="descripcion" placeholder="Detalles del evento..." className="textarea textarea-bordered"
          value={form.descripcion} onChange={handleChange} rows={2} />
      </div>

      {/* Targeting - solo para quienes pueden segmentar */}
      {puedeSegmentar && (
        <>
          <div className="divider text-xs text-base-content/40 my-0">Destinatarios</div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Curso</span></label>
              <select name="cursoId" className="select select-bordered select-sm" value={form.cursoId} onChange={handleChange}>
                <option value="">Toda la institución</option>
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Para</span></label>
              <select name="destinatario" className="select select-bordered select-sm" value={form.destinatario} onChange={handleChange}
                disabled={!!form.alumnoId}>
                <option value="todos">Todos</option>
                <option value="padres">Solo padres</option>
                <option value="docentes">Solo docentes</option>
              </select>
            </div>
          </div>

          {/* Alumno específico (solo si hay curso seleccionado) */}
          {form.cursoId && (
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-medium">Alumno específico</span>
                <span className="label-text-alt text-base-content/40">opcional — para reuniones individuales</span>
              </label>
              <select name="alumnoId" className="select select-bordered select-sm" value={form.alumnoId} onChange={handleChange}
                disabled={loadingAlumnos}>
                <option value="">Todo el curso</option>
                {alumnos.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
              {form.alumnoId && (
                <p className="text-xs text-base-content/40 mt-1">
                  Solo verán este evento los padres de {alumnos.find((a) => a.id === form.alumnoId)?.nombre}.
                </p>
              )}
            </div>
          )}
        </>
      )}

      <div className="flex gap-2 mt-2">
        <button type="button" className="btn btn-ghost flex-1" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : 'Publicar evento'}
        </button>
      </div>
    </form>
  );
}
