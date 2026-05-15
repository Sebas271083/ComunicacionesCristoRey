import { IconCalendar, IconTrash, IconPencil, IconCheck } from '@tabler/icons-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { isVencida } from '../../../utils/formatDate.js';
import { useAuth } from '../../../context/AuthContext.jsx';

export function TaskCard({ tarea, onToggle, onDelete, onEdit }) {
  const { user } = useAuth();
  const vencida = isVencida(tarea.fechaVencimiento) && !tarea.completada;
  const puedeEliminar = ['docente', 'admin', 'director', 'secretaria'].includes(user.rol);

  const borderColor = tarea.completada ? 'border-success' : vencida ? 'border-error' : 'border-warning';
  const badgeClass  = tarea.completada ? 'badge-success' : vencida ? 'badge-error' : 'badge-warning';
  const badgeText   = tarea.completada ? 'Completada'   : vencida ? 'Vencida'      : 'Pendiente';

  const subtitulo = [tarea.creador?.nombre, tarea.curso?.nombre].filter(Boolean).join(' · ');

  return (
    <div className={`card bg-base-100 shadow-sm border-l-4 ${borderColor}`}>
      <div className="card-body p-4">
        <div className="flex items-start gap-3">
          {/* Circular checkbox */}
          <button
            onClick={() => onToggle(tarea.id)}
            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
              tarea.completada
                ? 'bg-success border-success text-success-content'
                : 'border-base-content/30 hover:border-success hover:bg-success/10'
            }`}
          >
            {tarea.completada && <IconCheck size={13} strokeWidth={3} />}
          </button>

          {/* Center content */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-sm leading-tight ${tarea.completada ? 'line-through text-base-content/50' : ''}`}>
              {tarea.titulo}
            </h3>
            {subtitulo && (
              <p className="text-xs text-base-content/40 mt-0.5">{subtitulo}</p>
            )}
            {tarea.descripcion && (
              <p className="text-sm text-base-content/60 mt-1 line-clamp-2">{tarea.descripcion}</p>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className={`badge badge-sm ${badgeClass}`}>{badgeText}</span>
            <div className="flex items-center gap-1 text-xs text-base-content/50 whitespace-nowrap">
              <IconCalendar size={11} />
              <span>{format(new Date(tarea.fechaVencimiento), 'd MMM yyyy, HH:mm', { locale: es })}</span>
            </div>
            <div className="flex gap-0.5">
              {onEdit && (
                <button className="btn btn-ghost btn-xs text-primary p-0.5" onClick={onEdit}>
                  <IconPencil size={14} />
                </button>
              )}
              {puedeEliminar && (
                <button className="btn btn-ghost btn-xs text-error p-0.5" onClick={() => onDelete(tarea.id)}>
                  <IconTrash size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
