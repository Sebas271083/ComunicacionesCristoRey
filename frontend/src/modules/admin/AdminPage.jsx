import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Layout } from '../../components/Layout/Layout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { usuariosService } from '../../services/usuariosService.js';
import { alumnosService } from '../../services/alumnosService.js';
import { cursosService } from '../../services/cursosService.js';
import { auditService } from '../../services/auditService.js';
import { formatRelativo } from '../../utils/formatDate.js';
import {
  IconPlus, IconTrash, IconUser, IconSchool, IconBook,
  IconUserPlus, IconLink, IconLinkOff, IconX, IconChevronDown, IconHistory,
  IconPencil, IconCalendarEvent, IconSearch, IconId,
} from '@tabler/icons-react';

const CICLO_ACTUAL = new Date().getFullYear();

const ROL_BADGE = {
  admin: 'badge-error',
  director: 'badge-warning',
  secretaria: 'badge-info',
  docente: 'badge-success',
  papa: 'badge-ghost',
};

const ROLES_CREABLES = ['docente', 'papa', 'director', 'secretaria', 'admin'];

// ── Modales reutilizables ─────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-h-[85vh] flex flex-col p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-200 flex-shrink-0">
          <h3 className="font-bold text-base">{title}</h3>
          <button className="btn btn-ghost btn-xs btn-circle" onClick={onClose}><IconX size={14} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">{children}</div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}

// ── Tab: Usuarios ─────────────────────────────────────────────────────────────

function TabUsuarios() {
  const { user: me } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'docente' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    try { setUsuarios(await usuariosService.listar()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCrear = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await usuariosService.crear(form);
      setModal(false);
      setForm({ nombre: '', email: '', password: '', rol: 'docente' });
      cargar();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al crear usuario');
    } finally { setSaving(false); }
  };

  const handleDesactivar = async (id) => {
    if (!confirm('¿Desactivar este usuario?')) return;
    await usuariosService.desactivar(id);
    cargar();
  };

  const etiquetaRol = { admin: 'Administradores', director: 'Directivos', secretaria: 'Secretaría', docente: 'Docentes', papa: 'Padres/Madres' };

  const usuariosFiltrados = !busqueda.trim() ? usuarios : usuarios.filter((u) => {
    const q = busqueda.toLowerCase();
    return u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const grupos = ROLES_CREABLES.reduce((acc, rol) => {
    acc[rol] = usuariosFiltrados.filter((u) => u.rol === rol);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-base-content/50">{usuarios.length} usuarios activos</p>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setModal(true)}>
          <IconUserPlus size={15} /> Agregar
        </button>
      </div>

      <div className="relative mb-4">
        <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
        <input
          className="input input-bordered input-sm w-full pl-9 pr-8"
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <button className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle" onClick={() => setBusqueda('')}>
            <IconX size={12} />
          </button>
        )}
      </div>

      {loading
        ? <div className="flex justify-center py-8"><span className="loading loading-spinner text-primary" /></div>
        : Object.entries(etiquetaRol).map(([rol, label]) => grupos[rol]?.length > 0 && (
          <div key={rol} className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wide text-base-content/40 mb-1">{label}</p>
            <div className="flex flex-col gap-1">
              {grupos[rol].map((u) => (
                <div key={u.id} className="flex items-center gap-3 bg-base-100 rounded-xl px-3 py-2.5 shadow-sm">
                  <div className="avatar placeholder flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary">
                      <span className="font-bold text-sm">{u.nombre.charAt(0)}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{u.nombre}</p>
                    <p className="text-xs text-base-content/50 truncate">{u.email}</p>
                  </div>
                  <span className={`badge badge-sm ${ROL_BADGE[u.rol] ?? 'badge-ghost'}`}>{u.rol}</span>
                  {u.id !== me.id && (
                    <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDesactivar(u.id)}>
                      <IconTrash size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      }

      {modal && (
        <Modal title="Nuevo usuario" onClose={() => { setModal(false); setError(''); }}>
          <form onSubmit={handleCrear} className="flex flex-col gap-3">
            {error && <div className="alert alert-error py-2 text-sm"><span>{error}</span></div>}
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Nombre completo</span></label>
              <input className="input input-bordered" placeholder="María García" required
                value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Email</span></label>
              <input className="input input-bordered" type="email" placeholder="usuario@escuela.com" required
                value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Contraseña temporal</span></label>
              <input className="input input-bordered" type="password" placeholder="Mínimo 6 caracteres" minLength={6} required
                value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Rol</span></label>
              <select className="select select-bordered" value={form.rol}
                onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}>
                {ROLES_CREABLES.map((r) => <option key={r} value={r}>{etiquetaRol[r] ?? r}</option>)}
              </select>
            </div>
            <button className="btn btn-primary mt-1" type="submit" disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-sm" /> : 'Crear usuario'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Campo({ label, value }) {
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-base-200 last:border-0 gap-2">
      <span className="text-xs text-base-content/50 flex-shrink-0">{label}</span>
      <span className={`text-sm text-right ${value ? 'font-medium' : 'text-base-content/30'}`}>{value ?? '—'}</span>
    </div>
  );
}

// ── Tab: Alumnos ──────────────────────────────────────────────────────────────

function TabAlumnos() {
  const { user } = useAuth();
  const [alumnos, setAlumnos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [papas, setPapas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'nuevo' | {type:'vincular'|'editar'|'ficha', alumno}
  const [form, setForm] = useState({ nombre: '', cursoId: '' });
  const [editForm, setEditForm] = useState({ cursoId: '' });
  const [vincForm, setVincForm] = useState({ papaId: '' });
  const [saving, setSaving] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const puedeVerFicha = ['admin', 'director', 'secretaria'].includes(user.rol);

  const cargar = useCallback(async () => {
    try {
      const [a, c, u] = await Promise.all([
        alumnosService.listar(),
        cursosService.listar(),
        usuariosService.listar(),
      ]);
      setAlumnos(a);
      setCursos(c);
      setPapas(u.filter((u) => u.rol === 'papa'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCrear = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await alumnosService.crear(form);
      setModal(null);
      setForm({ nombre: '', cursoId: '' });
      cargar();
    } finally { setSaving(false); }
  };

  const handleVincular = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await alumnosService.vincularPapa(modal.alumno.id, vincForm.papaId);
      setModal(null);
      setVincForm({ papaId: '' });
      cargar();
    } finally { setSaving(false); }
  };

  const handleDesvincular = async (alumnoId, papaId) => {
    if (!confirm('¿Desvincular este padre del alumno?')) return;
    await alumnosService.desvincularPapa(alumnoId, papaId);
    cargar();
  };

  const handleEditarCurso = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await alumnosService.actualizar(modal.alumno.id, { cursoId: editForm.cursoId });
      setModal(null);
      cargar();
    } finally { setSaving(false); }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este alumno?')) return;
    await alumnosService.eliminar(id);
    cargar();
  };

  const nombreCurso = (id) => cursos.find((c) => c.id === id)?.nombre ?? '—';

  const alumnosFiltrados = !busqueda.trim() ? alumnos : alumnos.filter((a) => {
    const q = busqueda.toLowerCase();
    return a.nombre.toLowerCase().includes(q) || (a.curso?.nombre ?? '').toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-base-content/50">{alumnos.length} alumnos</p>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setModal('nuevo')}>
          <IconPlus size={15} /> Agregar
        </button>
      </div>

      <div className="relative mb-4">
        <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
        <input
          className="input input-bordered input-sm w-full pl-9 pr-8"
          placeholder="Buscar por nombre o curso..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <button className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle" onClick={() => setBusqueda('')}>
            <IconX size={12} />
          </button>
        )}
      </div>

      {loading
        ? <div className="flex justify-center py-8"><span className="loading loading-spinner text-primary" /></div>
        : <div className="flex flex-col gap-2">
          {alumnosFiltrados.map((a) => (
            <div key={a.id} className="bg-base-100 rounded-xl px-3 py-2.5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center flex-shrink-0">
                  <IconSchool size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{a.nombre}</p>
                  <p className="text-xs text-base-content/50">{a.curso?.nombre ?? '—'}</p>
                </div>
                <button className="btn btn-ghost btn-xs gap-1 text-info"
                  onClick={() => { setEditForm({ cursoId: a.cursoId ?? '' }); setModal({ type: 'editar', alumno: a }); }}>
                  <IconPencil size={13} />
                </button>
                {puedeVerFicha && (
                  <button className="btn btn-ghost btn-xs gap-1 text-secondary"
                    onClick={() => setModal({ type: 'ficha', alumno: a })}>
                    <IconId size={13} />
                  </button>
                )}
                <button className="btn btn-ghost btn-xs gap-1 text-primary"
                  onClick={() => { setVincForm({ papaId: '' }); setModal({ type: 'vincular', alumno: a }); }}>
                  <IconLink size={13} /> Padre
                </button>
                <button className="btn btn-ghost btn-xs text-error" onClick={() => handleEliminar(a.id)}>
                  <IconTrash size={14} />
                </button>
              </div>
              {a.padres?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 pl-10">
                  {a.padres.map((p) => (
                    <span key={p.papaId} className="badge badge-sm badge-ghost gap-1">
                      <IconUser size={10} /> {p.papa?.nombre}
                      <button className="ml-0.5 hover:text-error" onClick={() => handleDesvincular(a.id, p.papaId)}>
                        <IconLinkOff size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      }

      {modal === 'nuevo' && (
        <Modal title="Nuevo alumno" onClose={() => setModal(null)}>
          <form onSubmit={handleCrear} className="flex flex-col gap-3">
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Nombre completo</span></label>
              <input className="input input-bordered" placeholder="Lucía Fernández" required
                value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Curso</span></label>
              <select className="select select-bordered" required value={form.cursoId}
                onChange={(e) => setForm((f) => ({ ...f, cursoId: e.target.value }))}>
                <option value="">Seleccioná un curso...</option>
                {cursos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <button className="btn btn-primary mt-1" type="submit" disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-sm" /> : 'Crear alumno'}
            </button>
          </form>
        </Modal>
      )}

      {modal?.type === 'editar' && (
        <Modal title={`Cambiar curso — ${modal.alumno.nombre}`} onClose={() => setModal(null)}>
          <form onSubmit={handleEditarCurso} className="flex flex-col gap-3">
            <p className="text-sm text-base-content/60">
              Curso actual: <strong>{modal.alumno.curso?.nombre ?? '—'}</strong>
            </p>
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Nuevo curso</span></label>
              <select className="select select-bordered" required value={editForm.cursoId}
                onChange={(e) => setEditForm({ cursoId: e.target.value })}>
                <option value="">Seleccioná...</option>
                {cursos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <button className="btn btn-primary mt-1" type="submit" disabled={saving || !editForm.cursoId}>
              {saving ? <span className="loading loading-spinner loading-sm" /> : 'Guardar'}
            </button>
          </form>
        </Modal>
      )}

      {modal?.type === 'vincular' && (
        <Modal title={`Vincular padre — ${modal.alumno.nombre}`} onClose={() => setModal(null)}>
          <form onSubmit={handleVincular} className="flex flex-col gap-3">
            <p className="text-sm text-base-content/60">
              Seleccioná el padre/madre a vincular. Podés vincular más de uno.
            </p>
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Padre / Madre</span></label>
              <select className="select select-bordered" required value={vincForm.papaId}
                onChange={(e) => setVincForm({ papaId: e.target.value })}>
                <option value="">Seleccioná...</option>
                {papas
                  .filter((p) => !modal.alumno.padres?.some((pa) => pa.papaId === p.id))
                  .map((p) => <option key={p.id} value={p.id}>{p.nombre} — {p.email}</option>)}
              </select>
            </div>
            <button className="btn btn-primary mt-1" type="submit" disabled={saving || !vincForm.papaId}>
              {saving ? <span className="loading loading-spinner loading-sm" /> : 'Vincular'}
            </button>
          </form>
        </Modal>
      )}

      {modal?.type === 'ficha' && (() => {
        const a = modal.alumno;
        const sexoLabel = a.sexo === 'V' ? 'Varón' : a.sexo === 'M' ? 'Mujer' : null;
        const fnLabel = a.fechaNacimiento
          ? format(new Date(a.fechaNacimiento), "d 'de' MMMM 'de' yyyy", { locale: es })
          : null;
        return (
          <Modal title="Ficha del alumno" onClose={() => setModal(null)}>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-base-200">
              <div className="w-12 h-12 rounded-full bg-secondary/20 text-secondary flex items-center justify-center flex-shrink-0">
                <IconSchool size={22} />
              </div>
              <div>
                <p className="font-bold text-base">{a.nombre}</p>
                <span className="badge badge-sm badge-ghost mt-0.5">{a.curso?.nombre ?? '—'}</span>
              </div>
            </div>

            <p className="text-xs font-bold uppercase tracking-wide text-base-content/40 mb-1">Datos personales</p>
            <div className="mb-4">
              <Campo label="Sexo" value={sexoLabel} />
              <Campo label="Fecha de nacimiento" value={fnLabel} />
              <Campo label="Nacionalidad" value={a.nacionalidad} />
              <Campo label="DNI" value={a.dni} />
              <Campo label="Domicilio" value={a.domicilio} />
            </div>

            <p className="text-xs font-bold uppercase tracking-wide text-base-content/40 mb-1">Responsable</p>
            <div>
              <Campo label="Nombre" value={a.nombreResponsable} />
              <Campo label="DNI" value={a.dniResponsable} />
              <Campo label="Teléfono" value={a.telefonoResponsable} />
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}

// ── Tab: Cursos ───────────────────────────────────────────────────────────────

function TabCursos() {
  const [cursos, setCursos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'nuevo' | {type:'asignar', curso}
  const [form, setForm] = useState({ nombre: '' });
  const [asigForm, setAsigForm] = useState({ docenteId: '', tipo: 'especial' });
  const [saving, setSaving] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [c, d] = await Promise.all([cursosService.listar(), usuariosService.getDocentes()]);
      setCursos(c);
      setDocentes(d);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCrear = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await cursosService.crear(form);
      setModal(null);
      setForm({ nombre: '' });
      cargar();
    } finally { setSaving(false); }
  };

  const handleAsignar = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await cursosService.asignarDocente({ cursoId: modal.curso.id, docenteId: asigForm.docenteId, tipo: asigForm.tipo });
      setModal(null);
      setAsigForm({ docenteId: '', tipo: 'especial' });
      cargar();
    } finally { setSaving(false); }
  };

  const handleQuitarDocente = async (asignacionId) => {
    if (!confirm('¿Quitar este docente del curso?')) return;
    await cursosService.quitarDocente(asignacionId);
    cargar();
  };

  const handleEliminarCurso = async (id) => {
    if (!confirm('¿Eliminar este curso?')) return;
    await cursosService.eliminar(id);
    cargar();
  };

  const cursosFiltrados = !busqueda.trim() ? cursos : cursos.filter((c) => {
    const q = busqueda.toLowerCase();
    const matchNombre = c.nombre.toLowerCase().includes(q);
    const matchDocente = c.docentes?.some((d) => d.docente?.nombre?.toLowerCase().includes(q));
    return matchNombre || matchDocente;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm text-base-content/50">{cursos.length} cursos</p>
          <p className="text-xs text-base-content/40 flex items-center gap-1 mt-0.5">
            <IconCalendarEvent size={11} /> Ciclo lectivo {CICLO_ACTUAL}
          </p>
        </div>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setModal('nuevo')}>
          <IconPlus size={15} /> Agregar
        </button>
      </div>

      <div className="relative mb-4">
        <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
        <input
          className="input input-bordered input-sm w-full pl-9 pr-8"
          placeholder="Buscar por curso o docente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <button className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle" onClick={() => setBusqueda('')}>
            <IconX size={12} />
          </button>
        )}
      </div>

      {loading
        ? <div className="flex justify-center py-8"><span className="loading loading-spinner text-primary" /></div>
        : <div className="flex flex-col gap-2">
          {cursosFiltrados.map((c) => (
            <div key={c.id} className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
                onClick={() => setExpandido(expandido === c.id ? null : c.id)}>
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <IconBook size={16} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{c.nombre}</p>
                  <p className="text-xs text-base-content/50">
                    {c.docentes?.length ?? 0} {c.docentes?.length === 1 ? 'docente' : 'docentes'}
                    {' · '}{c.alumnos ?? 0} alumnos
                  </p>
                </div>
                <button className="btn btn-ghost btn-xs gap-1 text-primary"
                  onClick={(e) => { e.stopPropagation(); setAsigForm({ docenteId: '' }); setModal({ type: 'asignar', curso: c }); }}>
                  <IconLink size={13} /> Docente
                </button>
                <button className="btn btn-ghost btn-xs text-error" onClick={(e) => { e.stopPropagation(); handleEliminarCurso(c.id); }}>
                  <IconTrash size={14} />
                </button>
                <IconChevronDown size={14} className={`text-base-content/40 transition-transform ${expandido === c.id ? 'rotate-180' : ''}`} />
              </div>

              {expandido === c.id && c.docentes?.length > 0 && (
                <div className="border-t border-base-200 px-3 py-2 flex flex-col gap-1">
                  {c.docentes.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 text-sm">
                      <IconUser size={12} className="text-base-content/40" />
                      <span className="flex-1">{d.docente?.nombre}</span>
                      {d.tipo === 'titular' && <span className="badge badge-xs badge-primary">Titular</span>}
                      {d.materia && <span className="badge badge-xs badge-ghost">{d.materia?.nombre}</span>}
                      <button className="btn btn-ghost btn-xs text-error" onClick={() => handleQuitarDocente(d.id)}>
                        <IconLinkOff size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      }

      {modal === 'nuevo' && (
        <Modal title="Nuevo curso" onClose={() => setModal(null)}>
          <form onSubmit={handleCrear} className="flex flex-col gap-3">
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Nombre del curso</span></label>
              <input className="input input-bordered" placeholder="1° A Primaria" required
                value={form.nombre} onChange={(e) => setForm({ nombre: e.target.value })} />
            </div>
            <button className="btn btn-primary mt-1" type="submit" disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-sm" /> : 'Crear curso'}
            </button>
          </form>
        </Modal>
      )}

      {modal?.type === 'asignar' && (
        <Modal title={`Asignar docente — ${modal.curso.nombre}`} onClose={() => setModal(null)}>
          <form onSubmit={handleAsignar} className="flex flex-col gap-3">
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Docente</span></label>
              <select className="select select-bordered" required value={asigForm.docenteId}
                onChange={(e) => setAsigForm((f) => ({ ...f, docenteId: e.target.value }))}>
                <option value="">Seleccioná...</option>
                {docentes
                  .filter((d) => !modal.curso.docentes?.some((cd) => cd.docenteId === d.id))
                  .map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </div>
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Tipo de asignación</span></label>
              <div className="flex gap-3">
                {[['titular', 'Titular', 'Maestra/o a cargo del grado'], ['especial', 'Especial', 'Música, Ed. Física, etc.']].map(([val, label, desc]) => (
                  <label key={val} className={`flex-1 flex flex-col items-center gap-1 border-2 rounded-xl p-3 cursor-pointer transition-colors ${asigForm.tipo === val ? 'border-primary bg-primary/5' : 'border-base-200'}`}>
                    <input type="radio" className="hidden" name="tipo" value={val}
                      checked={asigForm.tipo === val} onChange={() => setAsigForm((f) => ({ ...f, tipo: val }))} />
                    <span className="font-semibold text-sm">{label}</span>
                    <span className="text-xs text-base-content/50 text-center">{desc}</span>
                  </label>
                ))}
              </div>
            </div>
            <button className="btn btn-primary mt-1" type="submit" disabled={saving || !asigForm.docenteId}>
              {saving ? <span className="loading loading-spinner loading-sm" /> : 'Asignar'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── Tab: Auditoría ────────────────────────────────────────────────────────────

const RECURSO_BADGE = {
  tarea: 'badge-primary',
  anuncio: 'badge-secondary',
  evento: 'badge-info',
};

function TabAuditoria() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    auditService.listar({ limit: 100 })
      .then((res) => {
        const lista = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : [];

        setLogs(lista);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-8"><span className="loading loading-spinner text-primary" /></div>;

  if (logs.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-base-content/40 gap-2">
      <IconHistory size={40} />
      <p className="text-sm">Sin cambios registrados aún</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      {logs.map((log) => (
        <div key={log.id} className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-3 py-2.5 cursor-pointer" onClick={() => setExpandido(expandido === log.id ? null : log.id)}>
            <div className="flex items-center gap-2">
              <span className={`badge badge-sm ${RECURSO_BADGE[log.recurso] ?? 'badge-ghost'}`}>{log.recurso}</span>
              <span className="flex-1 text-sm font-medium truncate">{log.titulo}</span>
              <IconChevronDown size={13} className={`text-base-content/40 flex-shrink-0 transition-transform ${expandido === log.id ? 'rotate-180' : ''}`} />
            </div>
            <p className="text-xs text-base-content/50 mt-0.5">
              {log.usuario?.nombre} · {formatRelativo(log.createdAt)}
            </p>
          </div>

          {expandido === log.id && (
            <div className="border-t border-base-200 px-3 py-2 flex flex-col gap-1.5">
              {Object.entries(log.detalle || {}).map(([campo, cambio]) => (
                <div key={campo} className="text-xs">
                  <span className="font-medium text-base-content/60 capitalize">{campo}:</span>{' '}
                  <span className="text-error line-through">{String(cambio?.antes ?? '—')}</span>
                  {' → '}
                  <span className="text-success">{String(cambio?.despues ?? '—')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

const TABS = [
  { key: 'usuarios', label: 'Usuarios', icon: IconUser },
  { key: 'alumnos', label: 'Alumnos', icon: IconSchool },
  { key: 'cursos', label: 'Cursos', icon: IconBook },
  { key: 'auditoria', label: 'Auditoría', icon: IconHistory },
];

export function AdminPage() {
  const [tab, setTab] = useState('usuarios');

  return (
    <Layout title="Administración">
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-4">
        {/* Tabs */}
        <div className="flex border-b border-base-200 mb-4">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${tab === key ? 'text-primary border-b-2 border-primary' : 'text-base-content/50'
                }`}
              onClick={() => setTab(key)}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {tab === 'usuarios' && <TabUsuarios />}
        {tab === 'alumnos' && <TabAlumnos />}
        {tab === 'cursos' && <TabCursos />}
        {tab === 'auditoria' && <TabAuditoria />}
      </div>
    </Layout>
  );
}
