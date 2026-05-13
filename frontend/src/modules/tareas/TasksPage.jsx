import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../../components/Layout/Layout.jsx';
import { TaskCard } from './components/TaskCard.jsx';
import { TaskForm } from './components/TaskForm.jsx';
import { taskService } from '../../services/taskService.js';
import { cursosService } from '../../services/cursosService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { IconPlus, IconClipboardList } from '@tabler/icons-react';

export function TasksPage() {
  const { user } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filtro, setFiltro] = useState('todas');

  const PUEDE_CREAR = ['docente', 'admin', 'director', 'secretaria'];
  const puedeCrear = PUEDE_CREAR.includes(user.rol);

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
    if (puedeCrear) cursosService.listar().then(setCursos).catch(() => {});
  }, [puedeCrear]);

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
    </Layout>
  );
}
