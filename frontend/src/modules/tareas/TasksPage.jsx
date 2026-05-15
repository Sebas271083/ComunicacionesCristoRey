import { useState, useEffect, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import { Layout } from '../../components/Layout/Layout.jsx';
import { TaskCard } from './components/TaskCard.jsx';
import { TaskForm } from './components/TaskForm.jsx';
import { taskService } from '../../services/taskService.js';
import { cursosService } from '../../services/cursosService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { IconPlus, IconClipboardList, IconClock, IconCircleCheck, IconCalendar } from '@tabler/icons-react';

export function TasksPage() {
  const { user } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [filtro, setFiltro] = useState('todas');

  const PUEDE_CREAR = ['docente', 'admin', 'director', 'secretaria'];
  const puedeCrear = PUEDE_CREAR.includes(user.rol);

  const puedeEditar = (tarea) => {
    const esFutura = new Date(tarea.fechaVencimiento) > new Date();
    return esFutura && (tarea.creador?.id === user.id || ['admin', 'director'].includes(user.rol));
  };

  const toInputDate = (dateStr) => format(new Date(dateStr), "yyyy-MM-dd'T'HH:mm");

  const cargar = useCallback(async () => {
    try {
      const data = await taskService.listar();
      setTareas(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (puedeCrear) cursosService.listarParaForm(user.rol).then(setCursos).catch(() => {});
  }, [puedeCrear, user.rol]);

  const crear = async (formData) => {
    setSaving(true);
    try {
      const nueva = await taskService.crear(formData);
      setTareas((prev) => [nueva, ...prev]);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const toggleCompletada = async (id) => {
    const actualizada = await taskService.toggleCompletada(id);
    setTareas((prev) => prev.map((t) => t.id === id ? actualizada : t));
  };

  const editar = async (formData) => {
    setSaving(true);
    try {
      const actualizada = await taskService.actualizar(editando.id, formData);
      setTareas((prev) => prev.map((t) => t.id === editando.id ? actualizada : t));
      setEditando(null);
    } finally { setSaving(false); }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    await taskService.eliminar(id);
    setTareas((prev) => prev.filter((t) => t.id !== id));
  };

  const tareasFiltradas = tareas.filter((t) => {
    if (filtro === 'pendientes') return !t.completada;
    if (filtro === 'completadas') return t.completada;
    return true;
  });

  // Stats
  const ahora = new Date();
  const en7dias = addDays(ahora, 7);
  const statTotal      = tareas.length;
  const statPendientes = tareas.filter((t) => !t.completada && new Date(t.fechaVencimiento) >= ahora).length;
  const statCompletadas = tareas.filter((t) => t.completada).length;
  const statProximas   = tareas.filter((t) => !t.completada && new Date(t.fechaVencimiento) >= ahora && new Date(t.fechaVencimiento) <= en7dias).length;

  const STATS = [
    { label: 'Total',      value: statTotal,       icon: IconClipboardList, color: 'text-base-content' },
    { label: 'Pendientes', value: statPendientes,   icon: IconClock,         color: 'text-warning' },
    { label: 'Completadas',value: statCompletadas,  icon: IconCircleCheck,   color: 'text-success' },
    { label: 'Próximas',   value: statProximas,     icon: IconCalendar,      color: 'text-info' },
  ];

  return (
    <Layout title="Tareas">
      <div className="page-container p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Tareas</h2>
          {puedeCrear && (
            <button className="btn btn-primary btn-sm gap-1" onClick={() => setShowForm(true)}>
              <IconPlus size={16} /> Nueva
            </button>
          )}
        </div>

        <div className="tabs tabs-boxed mb-4 bg-base-200">
          {['todas', 'pendientes', 'completadas'].map((f) => (
            <button
              key={f}
              className={`tab capitalize flex-1 ${filtro === f ? 'tab-active' : ''}`}
              onClick={() => setFiltro(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        {!loading && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {STATS.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-base-100 rounded-xl p-2.5 shadow-sm flex flex-col items-center gap-1">
                <Icon size={18} className={color} />
                <span className={`text-lg font-bold leading-none ${color}`}>{value}</span>
                <span className="text-[10px] text-base-content/50 text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : tareasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-base-content/40 gap-2">
            <IconClipboardList size={48} />
            <p className="text-sm">No hay tareas {filtro !== 'todas' ? filtro : ''}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tareasFiltradas.map((tarea) => (
              <TaskCard
                key={tarea.id}
                tarea={tarea}
                onToggle={toggleCompletada}
                onDelete={eliminar}
                onEdit={puedeEditar(tarea) ? () => setEditando({
                  ...tarea,
                  fechaVencimiento: toInputDate(tarea.fechaVencimiento),
                  cursoId: tarea.cursoId ?? '',
                }) : null}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Nueva tarea</h3>
            <TaskForm onSubmit={crear} onCancel={() => setShowForm(false)} loading={saving} cursos={cursos} />
          </div>
          <div className="modal-backdrop" onClick={() => setShowForm(false)} />
        </dialog>
      )}

      {editando && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Editar tarea</h3>
            <TaskForm onSubmit={editar} onCancel={() => setEditando(null)} loading={saving} cursos={cursos} initialValues={editando} />
          </div>
          <div className="modal-backdrop" onClick={() => setEditando(null)} />
        </dialog>
      )}
    </Layout>
  );
}
