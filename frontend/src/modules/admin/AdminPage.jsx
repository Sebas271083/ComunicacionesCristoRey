import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Layout } from '../../components/Layout/Layout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { usuariosService } from '../../services/usuariosService.js';
import { alumnosService } from '../../services/alumnosService.js';
import { cursosService } from '../../services/cursosService.js';
import { auditService } from '../../services/auditService.js';
import { pendientesService } from '../../services/pendientesService.js';
import { formatRelativo } from '../../utils/formatDate.js';
import {
  IconPlus, IconTrash, IconUser, IconSchool, IconBook,
  IconUserPlus, IconLink, IconLinkOff, IconX, IconChevronDown, IconHistory,
  IconPencil, IconCalendarEvent, IconSearch, IconId,
  IconCheck, IconClockHour4, IconMessages, IconSpeakerphone, IconCalendar, IconClipboardList, IconToggleLeft,
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
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: '', email: '', rol: 'docente', password: '' });
  const [permisosModal, setPermisosModal] = useState(null);
  const [permisosGuardando, setPermisosGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try { setUsuarios(await usuariosService.listar()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirEditar = (u) => {
    setEditForm({ nombre: u.nombre, email: u.email, rol: u.rol, password: '' });
    setEditando(u);
    setError('');
  };

  const handleActualizar = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = { nombre: editForm.nombre, email: editForm.email, rol: editForm.rol };
      if (editForm.password) payload.password = editForm.password;
      const actualizado = await usuariosService.actualizar(editando.id, payload);
      setUsuarios((prev) => prev.map((u) => u.id === actualizado.id ? actualizado : u));
      setEditando(null);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al actualizar');
    } finally { setSaving(false); }
  };

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

  const handleTogglePermiso = async (campo, valor) => {
    setPermisosGuardando(true);
    try {
      const actualizado = await usuariosService.actualizarPermisos(permisosModal.id, { [campo]: valor });
      setPermisosModal((p) => ({ ...p, ...actualizado }));
      setUsuarios((prev) => prev.map((u) => u.id === actualizado.id ? { ...u, ...actualizado } : u));
    } finally { setPermisosGuardando(false); }
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
                  {u.rol === 'docente' && (
                    <button className="btn btn-ghost btn-xs text-warning" title="Permisos" onClick={() => setPermisosModal(u)}>
                      <IconToggleLeft size={14} />
                    </button>
                  )}
                  <button className="btn btn-ghost btn-xs text-info" onClick={() => abrirEditar(u)}>
                    <IconPencil size={14} />
                  </button>
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

      {editando && (
        <Modal title="Editar usuario" onClose={() => { setEditando(null); setError(''); }}>
          <form onSubmit={handleActualizar} className="flex flex-col gap-3">
            {error && <div className="alert alert-error py-2 text-sm"><span>{error}</span></div>}
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Nombre completo</span></label>
              <input className="input input-bordered" required
                value={editForm.nombre} onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Email</span></label>
              <input className="input input-bordered" type="email" required
                value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Rol</span></label>
              <select className="select select-bordered" value={editForm.rol}
                onChange={(e) => setEditForm((f) => ({ ...f, rol: e.target.value }))}>
                {ROLES_CREABLES.map((r) => <option key={r} value={r}>{etiquetaRol[r] ?? r}</option>)}
              </select>
            </div>
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Nueva contraseña</span></label>
              <input className="input input-bordered" type="password" placeholder="Dejar vacío para no cambiar" minLength={6}
                value={editForm.password} onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))} />
            </div>
            <button className="btn btn-primary mt-1" type="submit" disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-sm" /> : 'Guardar cambios'}
            </button>
          </form>
        </Modal>
      )}

      {permisosModal && (
        <Modal title={`Permisos — ${permisosModal.nombre}`} onClose={() => setPermisosModal(null)}>
          <p className="text-xs text-base-content/50 mb-4">Activá o desactivá el acceso a cada sección para este docente.</p>
          {[
            { campo: 'puedeChat',      label: 'Mensajes',   icon: IconMessages },
            { campo: 'puedeAnuncios',  label: 'Anuncios',   icon: IconSpeakerphone },
            { campo: 'puedeTareas',    label: 'Tareas',     icon: IconClipboardList },
            { campo: 'puedeEventos',   label: 'Calendario', icon: IconCalendar },
          ].map(({ campo, label, icon: Icon }) => (
            <div key={campo} className="flex items-center justify-between py-3 border-b border-base-200 last:border-0">
              <div className="flex items-center gap-2">
                <Icon size={16} className="text-base-content/50" />
                <span className="text-sm font-medium">{label}</span>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={permisosModal[campo] !== false}
                disabled={permisosGuardando}
                onChange={(e) => handleTogglePermiso(campo, e.target.checked)}
              />
            </div>
          ))}
        </Modal>
      )}

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
  const [vincBusqueda, setVincBusqueda] = useState('');
  const [saving, setSaving] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('todos');
  const [filtroCurso, setFiltroCurso] = useState('');
  const [fichaEditando, setFichaEditando] = useState(false);
  const [fichaForm, setFichaForm] = useState({});
  const [fichaGuardando, setFichaGuardando] = useState(false);
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

  const abrirEditarFicha = (a) => {
    setFichaForm({
      nombre: a.nombre ?? '',
      sexo: a.sexo ?? '',
      fechaNacimiento: a.fechaNacimiento ? format(new Date(a.fechaNacimiento), 'yyyy-MM-dd') : '',
      nacionalidad: a.nacionalidad ?? '',
      dni: a.dni ?? '',
      domicilio: a.domicilio ?? '',
      nombreResponsable: a.nombreResponsable ?? '',
      dniResponsable: a.dniResponsable ?? '',
      telefonoResponsable: a.telefonoResponsable ?? '',
    });
    setFichaEditando(true);
  };

  const handleGuardarFicha = async () => {
    setFichaGuardando(true);
    try {
      const actualizado = await alumnosService.actualizar(modal.alumno.id, fichaForm);
      setAlumnos((prev) => prev.map((a) => a.id === actualizado.id ? { ...a, ...actualizado } : a));
      setModal((m) => ({ ...m, alumno: { ...m.alumno, ...actualizado } }));
      setFichaEditando(false);
    } finally { setFichaGuardando(false); }
  };

  const nombreCurso = (id) => cursos.find((c) => c.id === id)?.nombre ?? '—';

  const cursosDelNivel = filtroNivel === 'todos'
    ? cursos
    : cursos.filter((c) => c.nivel === filtroNivel);

  const alumnosFiltrados = alumnos
    .filter((a) => {
      if (filtroNivel !== 'todos' && a.curso?.nivel !== filtroNivel) return false;
      if (filtroCurso && a.cursoId !== filtroCurso) return false;
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        return a.nombre.toLowerCase().includes(q) || (a.curso?.nombre ?? '').toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => a.nombre.localeCompare(b, 'es'));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-base-content/50">{alumnos.length} alumnos</p>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setModal('nuevo')}>
          <IconPlus size={15} /> Agregar
        </button>
      </div>

      <div className="relative mb-2">
        <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
        <input
          className="input input-bordered input-sm w-full pl-9 pr-8"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <button className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle" onClick={() => setBusqueda('')}>
            <IconX size={12} />
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        <div className="flex gap-1">
          {[['todos', 'Todos'], ['primaria', 'Primaria'], ['inicial', 'Inicial']].map(([val, label]) => (
            <button
              key={val}
              className={`btn btn-xs rounded-full ${filtroNivel === val ? 'btn-primary' : 'btn-ghost border border-base-300'}`}
              onClick={() => { setFiltroNivel(val); setFiltroCurso(''); }}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          className="select select-bordered select-xs flex-1 min-w-0"
          value={filtroCurso}
          onChange={(e) => setFiltroCurso(e.target.value)}
        >
          <option value="">Todos los cursos</option>
          {cursosDelNivel.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-base-content/40 mb-3">
        {alumnosFiltrados.length} {alumnosFiltrados.length === 1 ? 'alumno' : 'alumnos'}
        {(filtroNivel !== 'todos' || filtroCurso || busqueda) ? ' encontrados' : ' en total'}
      </p>

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
                  onClick={() => { setVincForm({ papaId: '' }); setVincBusqueda(''); setModal({ type: 'vincular', alumno: a }); }}>
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
              {vincForm.papaId ? (
                <div className="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{papas.find((p) => p.id === vincForm.papaId)?.nombre}</p>
                    <p className="text-xs text-base-content/50">{papas.find((p) => p.id === vincForm.papaId)?.email}</p>
                  </div>
                  <button type="button" className="btn btn-ghost btn-xs btn-circle"
                    onClick={() => { setVincForm({ papaId: '' }); setVincBusqueda(''); }}>
                    <IconX size={13} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative mb-1">
                    <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
                    <input
                      className="input input-bordered input-sm w-full pl-9"
                      placeholder="Buscar por nombre o email..."
                      value={vincBusqueda}
                      onChange={(e) => setVincBusqueda(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="border border-base-300 rounded-lg overflow-y-auto max-h-48">
                    {papas
                      .filter((p) => !modal.alumno.padres?.some((pa) => pa.papaId === p.id))
                      .filter((p) => {
                        const q = vincBusqueda.toLowerCase();
                        return !q || p.nombre.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
                      })
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-base-200 border-b border-base-200 last:border-0"
                          onClick={() => setVincForm({ papaId: p.id })}
                        >
                          <p className="text-sm font-medium">{p.nombre}</p>
                          <p className="text-xs text-base-content/50">{p.email}</p>
                        </button>
                      ))}
                  </div>
                </>
              )}
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
        const ff = (k) => (e) => setFichaForm((f) => ({ ...f, [k]: e.target.value }));
        return (
          <Modal
            title={fichaEditando ? 'Editar ficha' : 'Ficha del alumno'}
            onClose={() => { setModal(null); setFichaEditando(false); }}
          >
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-base-200">
              <div className="w-12 h-12 rounded-full bg-secondary/20 text-secondary flex items-center justify-center flex-shrink-0">
                <IconSchool size={22} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-base">{a.nombre}</p>
                <span className="badge badge-sm badge-ghost mt-0.5">{a.curso?.nombre ?? '—'}</span>
              </div>
              {!fichaEditando && (
                <button className="btn btn-ghost btn-sm gap-1" onClick={() => abrirEditarFicha(a)}>
                  <IconPencil size={14} /> Editar
                </button>
              )}
            </div>

            {fichaEditando ? (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold uppercase tracking-wide text-base-content/40">Datos personales</p>
                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs">Nombre completo</span></label>
                  <input className="input input-bordered input-sm" value={fichaForm.nombre} onChange={ff('nombre')} required />
                </div>
                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs">Sexo</span></label>
                  <select className="select select-bordered select-sm" value={fichaForm.sexo} onChange={ff('sexo')}>
                    <option value="">No especificado</option>
                    <option value="V">Varón</option>
                    <option value="M">Mujer</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs">Fecha de nacimiento</span></label>
                  <input type="date" className="input input-bordered input-sm" value={fichaForm.fechaNacimiento} onChange={ff('fechaNacimiento')} />
                </div>
                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs">Nacionalidad</span></label>
                  <input className="input input-bordered input-sm" value={fichaForm.nacionalidad} onChange={ff('nacionalidad')} />
                </div>
                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs">DNI</span></label>
                  <input className="input input-bordered input-sm" value={fichaForm.dni} onChange={ff('dni')} />
                </div>
                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs">Domicilio</span></label>
                  <input className="input input-bordered input-sm" value={fichaForm.domicilio} onChange={ff('domicilio')} />
                </div>

                <p className="text-xs font-bold uppercase tracking-wide text-base-content/40 mt-1">Responsable</p>
                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs">Nombre</span></label>
                  <input className="input input-bordered input-sm" value={fichaForm.nombreResponsable} onChange={ff('nombreResponsable')} />
                </div>
                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs">DNI</span></label>
                  <input className="input input-bordered input-sm" value={fichaForm.dniResponsable} onChange={ff('dniResponsable')} />
                </div>
                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs">Teléfono</span></label>
                  <input className="input input-bordered input-sm" value={fichaForm.telefonoResponsable} onChange={ff('telefonoResponsable')} />
                </div>

                <div className="flex gap-2 mt-2">
                  <button className="btn btn-ghost btn-sm flex-1" onClick={() => setFichaEditando(false)}>Cancelar</button>
                  <button className="btn btn-primary btn-sm flex-1" onClick={handleGuardarFicha} disabled={fichaGuardando}>
                    {fichaGuardando ? <span className="loading loading-spinner loading-xs" /> : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
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

// ── Tab: Pendientes ───────────────────────────────────────────────────────────
function TabPendientes({ onCambio }) {
  const [datos, setDatos] = useState({ tareas: [], anuncios: [], eventos: [] });
  const [loading, setLoading] = useState(true);
  const [aprobando, setAprobando] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try { setDatos(await pendientesService.listar()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const total = datos.tareas.length + datos.anuncios.length + datos.eventos.length;

  const handleAprobar = async (tipo, id) => {
    setAprobando(id);
    try {
      if (tipo === 'tarea')   await pendientesService.aprobarTarea(id);
      if (tipo === 'anuncio') await pendientesService.aprobarAnuncio(id);
      if (tipo === 'evento')  await pendientesService.aprobarEvento(id);
      await cargar();
      onCambio?.();
    } finally { setAprobando(null); }
  };

  const handleRechazar = async (tipo, id) => {
    if (!confirm('¿Rechazar y eliminar este contenido?')) return;
    if (tipo === 'tarea')   await pendientesService.eliminarTarea(id);
    if (tipo === 'anuncio') await pendientesService.eliminarAnuncio(id);
    if (tipo === 'evento')  await pendientesService.eliminarEvento(id);
    await cargar();
    onCambio?.();
  };

  if (loading) return <div className="flex justify-center py-12"><span className="loading loading-spinner text-primary" /></div>;

  if (total === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-base-content/40 gap-2">
      <IconCheck size={48} />
      <p className="text-sm">Todo al día — sin contenido pendiente</p>
    </div>
  );

  const SECCIONES = [
    { key: 'anuncios', label: 'Anuncios',   items: datos.anuncios, icon: IconSpeakerphone },
    { key: 'tareas',   label: 'Tareas',     items: datos.tareas,   icon: IconClipboardList },
    { key: 'eventos',  label: 'Eventos',    items: datos.eventos,  icon: IconCalendar },
  ];

  return (
    <div className="flex flex-col gap-4">
      {SECCIONES.filter((s) => s.items.length > 0).map(({ key, label, items, icon: Icon }) => (
        <div key={key}>
          <p className="text-xs font-bold uppercase tracking-wide text-base-content/40 mb-2 flex items-center gap-1">
            <Icon size={12} /> {label} ({items.length})
          </p>
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.id} className="bg-base-100 rounded-xl shadow-sm border-l-4 border-warning overflow-hidden">
                <div className="p-3 pb-2">
                  <p className="font-semibold text-sm leading-snug">{item.titulo}</p>
                  <p className="text-xs text-base-content/60 mt-1">
                    <span className="font-medium">{item.creador?.nombre}</span>
                    {item.curso?.nombre && <span className="text-base-content/40"> · {item.curso.nombre}</span>}
                  </p>
                  {(item.contenido || item.descripcion) && (
                    <p className="text-xs text-base-content/50 mt-1 line-clamp-2">
                      {(item.contenido || item.descripcion).slice(0, 120)}
                      {(item.contenido || item.descripcion).length > 120 ? '…' : ''}
                    </p>
                  )}
                  <p className="text-[10px] text-base-content/30 mt-1.5">
                    {format(new Date(item.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                  </p>
                </div>
                <div className="flex border-t border-base-200">
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-success hover:bg-success/10 transition-colors"
                    onClick={() => handleAprobar(key.slice(0, -1), item.id)}
                    disabled={aprobando === item.id}
                  >
                    {aprobando === item.id
                      ? <span className="loading loading-spinner loading-xs" />
                      : <><IconCheck size={13} /> Aprobar</>}
                  </button>
                  <div className="w-px bg-base-200" />
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-error hover:bg-error/10 transition-colors"
                    onClick={() => handleRechazar(key.slice(0, -1), item.id)}
                    disabled={aprobando === item.id}
                  >
                    <IconX size={13} /> Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { key: 'usuarios', label: 'Usuarios', icon: IconUser },
  { key: 'alumnos', label: 'Alumnos', icon: IconSchool },
  { key: 'cursos', label: 'Cursos', icon: IconBook },
  { key: 'auditoria', label: 'Auditoría', icon: IconHistory },
];

export function AdminPage() {
  const [tab, setTab] = useState('usuarios');
  const [pendientesCount, setPendientesCount] = useState(0);

  const refreshPendientes = useCallback(async () => {
    try {
      const d = await pendientesService.listar();
      setPendientesCount(d.tareas.length + d.anuncios.length + d.eventos.length);
    } catch { /* ignorar */ }
  }, []);

  useEffect(() => { refreshPendientes(); }, [refreshPendientes]);

  const TABS = [
    { key: 'usuarios',   label: 'Usuarios',  icon: IconUser },
    { key: 'alumnos',    label: 'Alumnos',   icon: IconSchool },
    { key: 'cursos',     label: 'Cursos',    icon: IconBook },
    { key: 'pendientes', label: 'Pendientes',icon: IconClockHour4, badge: pendientesCount },
    { key: 'auditoria',  label: 'Auditoría', icon: IconHistory },
  ];

  return (
    <Layout title="Administración">
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-4">
        <div className="flex border-b border-base-200 mb-4">
          {TABS.map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors relative ${
                tab === key ? 'text-primary border-b-2 border-primary' : 'text-base-content/40'
              }`}
              onClick={() => setTab(key)}
            >
              <div className="relative">
                <Icon size={18} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-warning text-warning-content text-[8px] font-bold rounded-full min-w-[13px] h-3 flex items-center justify-center px-0.5 leading-none">
                    {badge}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {tab === 'usuarios'   && <TabUsuarios />}
        {tab === 'alumnos'    && <TabAlumnos />}
        {tab === 'cursos'     && <TabCursos />}
        {tab === 'pendientes' && <TabPendientes onCambio={refreshPendientes} />}
        {tab === 'auditoria'  && <TabAuditoria />}
      </div>
    </Layout>
  );
}
