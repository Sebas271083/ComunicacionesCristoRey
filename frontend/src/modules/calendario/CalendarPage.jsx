import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../../components/Layout/Layout.jsx';
import { EventCard } from './components/EventCard.jsx';
import { EventForm } from './components/EventForm.jsx';
import { calendarService } from '../../services/calendarService.js';
import { cursosService } from '../../services/cursosService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { IconPlus, IconCalendarOff, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

const PUEDE_PUBLICAR = ['docente', 'admin', 'director', 'secretaria'];
const PUEDE_SEGMENTAR = ['admin', 'director', 'secretaria', 'docente'];

export function CalendarPage() {
  const { user } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fechaActual, setFechaActual] = useState(new Date());

  const puedeCrear    = PUEDE_PUBLICAR.includes(user.rol);
  const puedeSegmentar = PUEDE_SEGMENTAR.includes(user.rol);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await calendarService.listar({
        mes: fechaActual.getMonth() + 1,
        anio: fechaActual.getFullYear(),
      });
      setEventos(data);
    } finally {
      setLoading(false);
    }
  }, [fechaActual]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (puedeSegmentar) cursosService.listar().then(setCursos).catch(() => {});
  }, [puedeSegmentar]);

  const crear = async (formData) => {
    setSaving(true);
    try {
      const nuevo = await calendarService.crear(formData);
      setEventos((prev) => [...prev, nuevo].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este evento?')) return;
    await calendarService.eliminar(id);
    setEventos((prev) => prev.filter((e) => e.id !== id));
  };

  const mesLabel = format(fechaActual, "MMMM yyyy", { locale: es });

  return (
    <Layout title="Calendario">
      <div className="page-container p-4">
        <div className="flex items-center justify-between mb-4">
          <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setFechaActual((f) => subMonths(f, 1))}>
            <IconChevronLeft size={20} />
          </button>
          <h2 className="font-bold text-lg capitalize">{mesLabel}</h2>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setFechaActual((f) => addMonths(f, 1))}>
            <IconChevronRight size={20} />
          </button>
        </div>

        {puedeCrear && (
          <button className="btn btn-primary btn-sm gap-1 w-full mb-4" onClick={() => setShowForm(true)}>
            <IconPlus size={16} /> Agregar evento
          </button>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : eventos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-base-content/40 gap-2">
            <IconCalendarOff size={48} />
            <p className="text-sm">Sin eventos este mes</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {eventos.map((evento) => (
              <EventCard key={evento.id} evento={evento} onDelete={eliminar} />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Nuevo evento</h3>
            <EventForm
              onSubmit={crear}
              onCancel={() => setShowForm(false)}
              loading={saving}
              cursos={cursos}
              puedeSegmentar={puedeSegmentar}
            />
          </div>
          <div className="modal-backdrop" onClick={() => setShowForm(false)} />
        </dialog>
      )}
    </Layout>
  );
}
