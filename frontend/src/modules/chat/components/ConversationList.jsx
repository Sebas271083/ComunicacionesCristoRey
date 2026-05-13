import { formatFecha } from '../../../utils/formatDate.js';

export function ConversationList({ conversaciones, loading, onSelect, selectedId }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 p-3 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-base-300" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-base-300 rounded w-3/4" />
              <div className="h-3 bg-base-300 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!conversaciones.length) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-base-content/50">
        <p className="text-sm">No hay conversaciones aún</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-base-200">
      {conversaciones.map((conv) => (
        <li
          key={conv.interlocutor.id}
          onClick={() => onSelect(conv.interlocutor)}
          className={`flex gap-3 p-4 cursor-pointer hover:bg-base-200 transition-colors ${
            selectedId === conv.interlocutor.id ? 'bg-base-200' : ''
          }`}
        >
          <div className="avatar placeholder flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-content">
              <span className="text-lg font-bold">{conv.interlocutor.nombre.charAt(0)}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline gap-2">
              <span className="font-semibold truncate">{conv.interlocutor.nombre}</span>
              <span className="text-xs text-base-content/50 flex-shrink-0">{formatFecha(conv.fecha)}</span>
            </div>
            <div className="flex justify-between items-center gap-2 mt-0.5">
              <p className="text-sm text-base-content/60 truncate">{conv.ultimoMensaje}</p>
              {conv.noLeidos > 0 && (
                <span className="badge badge-primary badge-sm flex-shrink-0">{conv.noLeidos}</span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
