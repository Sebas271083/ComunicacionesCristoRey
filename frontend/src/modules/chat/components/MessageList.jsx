import { useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { formatHora } from '../../../utils/formatDate.js';
import { IconCheck, IconChecks } from '@tabler/icons-react';
import { isToday, isYesterday, format } from 'date-fns';
import { es } from 'date-fns/locale';

function etiquetaFecha(date) {
  const d = new Date(date);
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  return format(d, "d 'de' MMMM yyyy", { locale: es });
}

function mismodia(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function DateSeparator({ date }) {
  return (
    <div className="flex items-center gap-3 my-3 px-4">
      <div className="flex-1 h-px bg-base-300" />
      <span className="text-[11px] font-medium text-base-content/40 whitespace-nowrap">
        {etiquetaFecha(date)}
      </span>
      <div className="flex-1 h-px bg-base-300" />
    </div>
  );
}

export function MessageList({ mensajes, loading }) {
  const { user } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    );
  }

  if (!mensajes.length) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <p className="text-sm text-base-content/30">No hay mensajes aún</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col py-2">
      {mensajes.map((msg, i) => {
        const esMio = msg.enviadorId === user.id;
        const esPrimerDelDia = i === 0 || !mismodia(mensajes[i - 1].createdAt, msg.createdAt);

        return (
          <div key={msg.id}>
            {esPrimerDelDia && <DateSeparator date={msg.createdAt} />}

            <div className={`chat px-2 ${esMio ? 'chat-end' : 'chat-start'}`}>
              <div
                className={`chat-bubble text-sm max-w-[72vw] lg:max-w-md shadow-sm ${
                  esMio
                    ? 'bg-primary text-primary-content'
                    : 'bg-[#ede8dc] text-base-content'
                }`}
              >
                {msg.contenido}
                <div className={`flex items-center gap-1 mt-1 ${esMio ? 'justify-end' : 'justify-start'}`}>
                  <time className={`text-[10px] ${esMio ? 'text-primary-content/70' : 'text-base-content/50'}`}>
                    {formatHora(msg.createdAt)}
                  </time>
                  {esMio && (
                    msg.leido
                      ? <IconChecks size={12} className="text-primary-content/70" />
                      : <IconCheck size={12} className="text-primary-content/50" />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
