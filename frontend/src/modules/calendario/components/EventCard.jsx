import { IconTrash, IconSchool, IconUser, IconWorld } from '@tabler/icons-react';
import { formatFechaLarga, formatHora } from '../../../utils/formatDate.js';
import { useAuth } from '../../../context/AuthContext.jsx';

const TIPO_BADGE = {
  examen:  'badge-error',
  reunion: 'badge-warning',
  evento:  'badge-info',
  feriado: 'badge-success',
};

const TIPO_BORDER = {
  examen:  'border-error',
  reunion: 'border-warning',
  evento:  'border-info',
  feriado: 'border-success',
};

const PUEDE_ELIMINAR = ['docente', 'admin', 'director', 'secretaria'];

export function EventCard({ evento, onDelete }) {
  const { user } = useAuth();
  const puedeEliminar = PUEDE_ELIMINAR.includes(user.rol);

  return (
    <div className={`card bg-base-100 shadow-sm border-l-4 ${TIPO_BORDER[evento.tipo] ?? 'border-base-300'}`}>
      <div className="card-body p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className={`badge badge-sm ${TIPO_BADGE[evento.tipo] ?? 'badge-ghost'}`}>
                {evento.tipo}
              </span>

              {evento.alumnoId ? (
                <span className="badge badge-sm badge-outline gap-1">
                  <IconUser size={10} /> {evento.alumno?.nombre}
                </span>
              ) : evento.cursoId ? (
                <span className="badge badge-sm badge-primary gap-1">
                  <IconSchool size={10} /> {evento.curso?.nombre}
                </span>
              ) : (
                <span className="badge badge-sm badge-ghost gap-1">
                  <IconWorld size={10} /> General
                </span>
              )}

              {evento.destinatario === 'docentes' && (
                <span className="badge badge-sm badge-warning">Solo docentes</span>
              )}
              {evento.destinatario === 'padres' && (
                <span className="badge badge-sm badge-info">Solo padres</span>
              )}
            </div>

            <h3 className="font-semibold">{evento.titulo}</h3>
            {evento.descripcion && (
              <p className="text-sm text-base-content/60 mt-1">{evento.descripcion}</p>
            )}
            <p className="text-xs text-base-content/50 mt-2 capitalize">
              {formatFechaLarga(evento.fecha)} · {formatHora(evento.fecha)}
              {evento.creador && <span> · {evento.creador.nombre}</span>}
            </p>
          </div>
          {puedeEliminar && (
            <button className="btn btn-ghost btn-xs text-error flex-shrink-0" onClick={() => onDelete(evento.id)}>
              <IconTrash size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
