import { useState } from 'react';
import { format } from 'date-fns';

export function TaskForm({ onSubmit, onCancel, loading, cursos = [] }) {
  const hoy = format(new Date(), "yyyy-MM-dd'T'HH:mm");
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    fechaVencimiento: '',
    cursoId: '',
    destinatario: 'todos',
  });

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="form-control">
        <label className="label py-1"><span className="label-text font-medium">Título *</span></label>
        <input name="titulo" type="text" placeholder="Nombre de la tarea" className="input input-bordered"
          value={form.titulo} onChange={handleChange} required />
      </div>

      <div className="form-control">
        <label className="label py-1"><span className="label-text font-medium">Descripción</span></label>
        <textarea name="descripcion" placeholder="Instrucciones detalladas..." className="textarea textarea-bordered"
          value={form.descripcion} onChange={handleChange} rows={3} />
      </div>

      <div className="form-control">
        <label className="label py-1"><span className="label-text font-medium">Fecha de entrega *</span></label>
        <input name="fechaVencimiento" type="datetime-local" className="input input-bordered"
          value={form.fechaVencimiento} onChange={handleChange} min={hoy} required />
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
        <button type="button" className="btn btn-ghost flex-1" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : 'Publicar tarea'}
        </button>
      </div>
    </form>
  );
}
