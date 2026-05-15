import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../../components/Layout/Layout.jsx';
import { EventCard } from './components/EventCard.jsx';
import { EventForm } from './components/EventForm.jsx';
import { calendarService } from '../../services/calendarService.js';
import { cursosService } from '../../services/cursosService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  IconPlus, IconCalendarOff, IconChevronLeft, IconChevronRight,
  IconList, IconLayoutGrid, IconX,
} from '@tabler/icons-react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, isSameDay, isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';

const PUEDE_PUBLICAR  = ['docente', 'admin', 'director', 'secretaria'];
const PUEDE_SEGMENTAR = ['admin', 'director', 'secretaria', 'docente'];

const TIPO_CHIP = {
  examen:  'bg-error text-error-content',
  reunion: 'bg-warning text-warning-content',
  evento:  'bg-info text-info-content',
  feriado: 'bg-success text-success-content',
};

export function CalendarPage() {
  const { user } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [fechaActual, setFechaActual] = useState(new Date());
  const [vista, setVista] = useState('agenda');
  const [eventoModal, setEventoModal] = useState(null);

  const puedeEditar = (evento) => {
    const esFuturo = new Date(evento.fecha) > new Date();
    return esFuturo && (evento.creador?.id === user.id || ['admin', 'director'].includes(user.rol));
  };

  const puedeCrear     = PUEDE_PUBLICAR.includes(user.rol);
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
    if (puedeSegmentar) cursosService.listarParaForm(user.rol).then(setCursos).catch(() => {});
  }, [puedeSegmentar, user.rol]);

  const crear = async (formData) => {
    setSaving(true);
    try {
      const nuevo = await calendarService.crear(formData);
      setEventos((prev) => [...prev, nuevo].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const editar = async (formData) => {
    setSaving(true);
    try {
      const actualizado = await calendarService.actualizar(editando.id, formData);
      setEventos((prev) => prev.map((e) => e.id === editando.id ? actualizado : e));
      setEditando(null);
    } finally { setSaving(false); }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este evento?')) return;
    await calendarService.eliminar(id);
    setEventos((prev) => prev.filter((e) => e.id !== id));
    setEventoModal(null);
  };

  const abrirEditar = (evento) => {
    setEditando({
      ...evento,
      fecha: format(new Date(evento.fecha), "yyyy-MM-dd'T'HH:mm"),
      cursoId: evento.cursoId ?? '',
      alumnoId: evento.alumnoId ?? '',
    });
    setEventoModal(null);
  };

  const mesLabel = format(fechaActual, 'MMMM yyyy', { locale: es });

  // ── Agenda: group by day ─────────────────────────────────────────────────────
  const gruposPorDia = eventos.reduce((acc, ev) => {
    const key = format(new Date(ev.fecha), 'yyyy-MM-dd');
    (acc[key] ??= []).push(ev);
    return acc;
  }, {});
  const diasConEventos = Object.keys(gruposPorDia).sort();

  // ── Mes: build grid (Mon start) ──────────────────────────────────────────────
  const primerDia  = startOfMonth(fechaActual);
  const ultimoDia  = endOfMonth(fechaActual);
  const diasDelMes = eachDayOfInterval({ start: primerDia, end: ultimoDia });
  const offset     = (getDay(primerDia) + 6) % 7;
  const celdas     = [...Array(offset).fill(null), ...diasDelMes];
  while (celdas.length % 7 !== 0) celdas.push(null);

  const eventosDelDia = (dia) => eventos.filter((e) => isSameDay(new Date(e.fecha), dia));

  return (
    <Layout title="Calendario">
      <div className="page-container p-4">
        {/* Row 1: month navigation */}
        <div className="flex items-center justify-between mb-2">
          <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setFechaActual((f) => subMonths(f, 1))}>
            <IconChevronLeft size={20} />
          </button>
          <h2 className="font-bold text-lg capitalize">{mesLabel}</h2>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setFechaActual((f) => addMonths(f, 1))}>
            <IconChevronRight size={20} />
          </button>
        </div>

        {/* Row 2: view toggle + add button */}
        <div className="flex items-center justify-between mb-4">
          <div className="tabs tabs-boxed bg-base-200 p-0.5">
            <button
              className={`tab tab-sm gap-1.5 ${vista === 'agenda' ? 'tab-active' : ''}`}
              onClick={() => setVista('agenda')}
            >
              <IconList size={14} /> Agenda
            </button>
            <button
              className={`tab tab-sm gap-1.5 ${vista === 'mes' ? 'tab-active' : ''}`}
              onClick={() => setVista('mes')}
            >
              <IconLayoutGrid size={14} /> Mes
            </button>
          </div>
          {puedeCrear && (
            <button className="btn btn-primary btn-sm gap-1" onClick={() => setShowForm(true)}>
              <IconPlus size={16} /> Agregar
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : vista === 'agenda' ? (
          /* ── Agenda view ─────────────────────────────────────────────────── */
          diasConEventos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-base-content/40 gap-2">
              <IconCalendarOff size={48} />
              <p className="text-sm">Sin eventos este mes</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {diasConEventos.map((dia) => {
                const fecha = new Date(dia + 'T00:00:00');
                const esHoy = isToday(fecha);
                return (
                  <div key={dia}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold uppercase tracking-wide capitalize ${esHoy ? 'text-primary' : 'text-base-content/50'}`}>
                        {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
                      </span>
                      {esHoy && <span className="badge badge-primary badge-xs">Hoy</span>}
                    </div>
                    <div className="flex flex-col gap-2">
                      {gruposPorDia[dia].map((evento) => (
                        <EventCard
                          key={evento.id}
                          evento={evento}
                          onDelete={eliminar}
                          onEdit={puedeEditar(evento) ? () => abrirEditar(evento) : null}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* ── Mes view ────────────────────────────────────────────────────── */
          <div>
            <div className="grid grid-cols-7 mb-1">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                <div key={d} className="text-center text-xs font-bold text-base-content/40 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-base-200 rounded-xl overflow-hidden border border-base-200">
              {celdas.map((dia, i) => {
                if (!dia) return <div key={`empty-${i}`} className="bg-base-100 min-h-[64px]" />;
                const evDia = eventosDelDia(dia);
                const hoy   = isToday(dia);
                return (
                  <div key={dia.toISOString()} className="bg-base-100 min-h-[64px] p-1">
                    <span className={`text-xs font-semibold w-5 h-5 inline-flex items-center justify-center rounded-full mb-0.5 ${hoy ? 'bg-primary text-primary-content' : 'text-base-content/60'}`}>
                      {format(dia, 'd')}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      {evDia.slice(0, 2).map((ev) => (
                        <button
                          key={ev.id}
                          onClick={() => setEventoModal(ev)}
                          className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate w-full text-left ${TIPO_CHIP[ev.tipo] ?? 'bg-base-300 text-base-content'}`}
                        >
                          {ev.titulo}
                        </button>
                      ))}
                      {evDia.length > 2 && (
                        <span className="text-[10px] text-base-content/40 px-0.5">+{evDia.length - 2} más</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Event detail modal (Mes view) */}
      {eventoModal && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-sm p-0 overflow-hidden">
            <div className="flex justify-end px-3 pt-2">
              <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setEventoModal(null)}>
                <IconX size={14} />
              </button>
            </div>
            <div className="px-2 pb-3">
              <EventCard
                evento={eventoModal}
                onDelete={eliminar}
                onEdit={puedeEditar(eventoModal) ? () => abrirEditar(eventoModal) : null}
              />
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setEventoModal(null)} />
        </dialog>
      )}

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

      {editando && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Editar evento</h3>
            <EventForm
              onSubmit={editar}
              onCancel={() => setEditando(null)}
              loading={saving}
              cursos={cursos}
              puedeSegmentar={puedeSegmentar}
              initialValues={editando}
            />
          </div>
          <div className="modal-backdrop" onClick={() => setEditando(null)} />
        </dialog>
      )}
    </Layout>
  );
}
