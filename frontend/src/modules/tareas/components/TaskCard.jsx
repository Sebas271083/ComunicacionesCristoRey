import { IconCalendar, IconTrash } from '@tabler/icons-react';
import { formatFechaVencimiento, isVencida } from '../../../utils/formatDate.js';
import { useAuth } from '../../../context/AuthContext.jsx';

export function TaskCard({ tarea, onToggle, onDelete }) {
  const { user } = useAuth();
  const vencida = isVencida(tarea.fechaVencimiento) && !tarea.completada;
  const puedeEliminar = user.rol === 'docente' || user.rol === 'admin';

  return (
    <div className={`card bg-base-100 shadow-sm border-l-4 transition-all ${
      tarea.completada ? 'border-success opacity-70' : vencida ? 'border-error' : 'border-primary'
    }`}>
      <div className="card-body p-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={tarea.completada}
            onChange={() => onToggle(tarea.id)}
            className="checkbox checkbox-primary mt-0.5 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-base leading-tight ${tarea.completada ? 'line-through text-base-content/50' : ''}`}>
              {tarea.titulo}
            </h3>
            {tarea.descripcion && (
              <p className="text-sm text-base-content/60 mt-1 line-clamp-2">{tarea.descripcion}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <IconCalendar size={14} className="text-base-content/50" />
              <span className={`text-xs font-medium ${vencida ? 'text-error' : 'text-base-content/60'}`}>
                {formatFechaVencimiento(tarea.fechaVencimiento)}
              </span>
              {vencida && <span className="badge badge-error badge-xs">Vencida</span>}
              {tarea.completada && <span className="badge badge-success badge-xs">Completada</span>}
            </div>
            <p className="text-xs text-base-content/40 mt-1">
              {tarea.creador?.nombre}
            </p>
          </div>
          {puedeEliminar && (
            <button
              className="btn btn-ghost btn-xs text-error flex-shrink-0"
              onClick={() => onDelete(tarea.id)}
            >
              <IconTrash size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
