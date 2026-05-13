import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../../components/Layout/Layout.jsx';
import { ConversationList } from './components/ConversationList.jsx';
import { MessageList } from './components/MessageList.jsx';
import { MessageInput } from './components/MessageInput.jsx';
import { messageService } from '../../services/messageService.js';
import { getSocket } from '../../services/socketService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChatStore } from '../../store/chatStore.js';
import { IconArrowLeft, IconPlus, IconMessages, IconSend, IconUsersGroup } from '@tabler/icons-react';

// ── Sub-componentes estables (fuera del render para evitar re-mount) ───────────

function SidebarLista({ conversaciones, loading, receptor, onSelect, onNuevo }) {
  return (
    <div className="flex flex-col h-full bg-[#e8e8e8]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-base-200 bg-[#e8e8e8] flex-shrink-0">
        <span className="font-bold text-base">Conversaciones</span>
        <button className="btn btn-primary btn-sm gap-1" onClick={onNuevo}>
          <IconPlus size={14} /> Nuevo
        </button>
      </div>
      <div className="flex-1 overflow-y-auto bg-[#e8e8e8] relative">
        <img
          src="/logo.png"
          className="lg:hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 pointer-events-none select-none rounded-full"
          style={{ opacity: 0.18, mixBlendMode: 'multiply' }}
          alt=""
          aria-hidden="true"
        />
        <ConversationList
          conversaciones={conversaciones}
          loading={loading}
          onSelect={onSelect}
          selectedId={receptor?.id}
        />
      </div>
    </div>
  );
}

function ChatPanel({ receptor, mensajes, loadingMsg, onSend, onBack }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-base-200 bg-base-100 flex-shrink-0">
        {onBack && (
          <button className="btn btn-ghost btn-sm btn-circle -ml-1" onClick={onBack}>
            <IconArrowLeft size={18} />
          </button>
        )}
        <div className="avatar placeholder flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-primary text-primary-content">
            <span className="font-bold text-sm">{receptor.nombre.charAt(0)}</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{receptor.nombre}</p>
          {receptor.info && (
            <p className="text-xs text-base-content/50 truncate">{receptor.info}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#FAF6F5] relative">
        <img
          src="/logo.png"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 pointer-events-none select-none rounded-full"
          style={{ opacity: 0.15, mixBlendMode: 'multiply' }}
          alt=""
          aria-hidden="true"
        />
        <MessageList mensajes={mensajes} loading={loadingMsg} />
      </div>

      <div className="flex-shrink-0 border-t border-base-200 bg-base-100">
        <MessageInput onSend={onSend} />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 bg-base-50 relative overflow-hidden">
      <img
        src="/logo.png"
        className="absolute w-80 pointer-events-none select-none rounded-full"
        style={{ opacity: 0.18, mixBlendMode: 'multiply' }}
        alt=""
        aria-hidden="true"
      />
      <div className="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center relative">
        <IconMessages size={32} className="text-base-content/30" strokeWidth={1.5} />
      </div>
      <div className="text-center relative">
        <p className="font-medium text-base-content/50 text-sm">Ninguna conversación abierta</p>
        <p className="text-xs text-base-content/30 mt-1">Seleccioná una o iniciá una nueva</p>
      </div>
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────────

export function ChatPage() {
  const { user } = useAuth();
  const setUnreadCount = useChatStore((s) => s.setUnreadCount);
  const [conversaciones, setConversaciones] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [receptor, setReceptor] = useState(null);
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [showNuevo, setShowNuevo] = useState(false);

  // Modal estado
  const [tabModal, setTabModal] = useState('individual'); // 'individual' | 'masivo'
  const [contactos, setContactos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('');
  const [mensajeMasivo, setMensajeMasivo] = useState('');
  const [enviandoMasivo, setEnviandoMasivo] = useState(false);

  const puedeEnviarMasivo = user.rol !== 'papa';

  const cargarConversaciones = useCallback(async () => {
    try {
      const data = await messageService.getConversaciones();
      setConversaciones(data);
      setUnreadCount(data.reduce((acc, c) => acc + (c.noLeidos ?? 0), 0));
    } finally {
      setLoadingConv(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    cargarConversaciones();
    // Polling reducido solo como fallback para unread counts
    const interval = setInterval(() => {
      if (!document.hidden) cargarConversaciones();
    }, 10000);
    return () => clearInterval(interval);
  }, [cargarConversaciones]);

  const abrirChat = useCallback(async (interlocutor) => {
    setReceptor(interlocutor);
    setLoadingMsg(true);
    try {
      const data = await messageService.getHistorial(interlocutor.id);
      setMensajes(data);
      await messageService.marcarLeidosConversacion(interlocutor.id);
      cargarConversaciones();
    } finally {
      setLoadingMsg(false);
    }
  }, [cargarConversaciones]);

  // Tiempo real: escuchar mensajes nuevos vía socket
  useEffect(() => {
    const socket = getSocket();

    const onNuevoMensaje = (mensaje) => {
      // Si el mensaje es de la conversación abierta, agregarlo
      if (receptor && mensaje.enviadorId === receptor.id) {
        setMensajes((prev) => [...prev, mensaje]);
        messageService.marcarLeidosConversacion(receptor.id).catch(() => {});
      }
      // Actualizar lista de conversaciones (unread badge)
      cargarConversaciones();
    };

    socket.on('nuevo_mensaje', onNuevoMensaje);
    return () => socket.off('nuevo_mensaje', onNuevoMensaje);
  }, [receptor, cargarConversaciones]);

  const enviarMensaje = async (contenido) => {
    const msg = await messageService.enviar({ contenido, receptorId: receptor.id });
    setMensajes((prev) => [...prev, msg]);
    cargarConversaciones();
  };

  const abrirNuevoChat = async () => {
    setBusqueda('');
    setTabModal('individual');
    setGrupoSeleccionado('');
    setMensajeMasivo('');
    if (!contactos.length) {
      const data = await messageService.getContactos();
      setContactos(data);
    }
    if (puedeEnviarMasivo && !grupos.length) {
      const data = await messageService.getGruposMasivo();
      setGrupos(data);
    }
    setShowNuevo(true);
  };

  const handleEnviarMasivo = async () => {
    const grupo = grupos.find((g) => g.id === grupoSeleccionado);
    if (!grupo || !mensajeMasivo.trim()) return;
    setEnviandoMasivo(true);
    try {
      await messageService.enviarMasivo({ contenido: mensajeMasivo.trim(), receptorIds: grupo.ids });
      setShowNuevo(false);
      setMensajeMasivo('');
      setGrupoSeleccionado('');
      cargarConversaciones();
    } finally {
      setEnviandoMasivo(false);
    }
  };

  const contactosFiltrados = contactos.map((grupo) => ({
    ...grupo,
    items: (grupo.items || grupo.papas || []).filter((c) =>
      c.nombre.toLowerCase().includes(busqueda.toLowerCase())
    ),
  })).filter((g) => g.items.length > 0);

  const tituloModal = user.rol === 'papa'
    ? 'Escribirle a un docente'
    : 'Nuevo mensaje';

  return (
    <Layout title="Mensajes" fullHeight>
      {/* ── DESKTOP ── */}
      <div className="hidden lg:flex h-full bg-base-100">
        <div className="w-72 xl:w-96 2xl:w-[420px] flex-shrink-0 border-r border-base-200">
          <SidebarLista
            conversaciones={conversaciones}
            loading={loadingConv}
            receptor={receptor}
            onSelect={abrirChat}
            onNuevo={abrirNuevoChat}
          />
        </div>
        <div className="flex-1 min-w-0">
          {receptor
            ? <ChatPanel receptor={receptor} mensajes={mensajes} loadingMsg={loadingMsg} onSend={enviarMensaje} />
            : <EmptyState />
          }
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="lg:hidden h-full">
        {receptor
          ? <ChatPanel
              receptor={receptor}
              mensajes={mensajes}
              loadingMsg={loadingMsg}
              onSend={enviarMensaje}
              onBack={() => setReceptor(null)}
            />
          : <SidebarLista
              conversaciones={conversaciones}
              loading={loadingConv}
              receptor={receptor}
              onSelect={abrirChat}
              onNuevo={abrirNuevoChat}
            />
        }
      </div>

      {/* ── Modal nuevo chat ── */}
      {showNuevo && (
        <dialog className="modal modal-open">
          <div className="modal-box max-h-[80vh] flex flex-col p-0">
            {/* Header */}
            <div className="sticky top-0 bg-base-100 border-b border-base-200 z-10 flex-shrink-0">
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <h3 className="font-bold text-base">{tituloModal}</h3>
                <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setShowNuevo(false)}>✕</button>
              </div>

              {/* Tabs (solo si puede enviar masivo) */}
              {puedeEnviarMasivo && (
                <div className="flex border-b border-base-200">
                  <button
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${tabModal === 'individual' ? 'text-primary border-b-2 border-primary' : 'text-base-content/50'}`}
                    onClick={() => setTabModal('individual')}
                  >
                    Individual
                  </button>
                  <button
                    className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${tabModal === 'masivo' ? 'text-primary border-b-2 border-primary' : 'text-base-content/50'}`}
                    onClick={() => setTabModal('masivo')}
                  >
                    <IconUsersGroup size={15} /> Masivo
                  </button>
                </div>
              )}

              {/* Buscador (solo en tab individual) */}
              {tabModal === 'individual' && (
                <div className="px-4 py-2.5">
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    className="input input-bordered input-sm w-full"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Contenido */}
            <div className="overflow-y-auto flex-1">
              {tabModal === 'individual' ? (
                <div className="px-2 pb-3">
                  {contactosFiltrados.map((grupo, i) => (
                    <div key={i}>
                      {(grupo.tipo === 'curso' || grupo.tipo === 'lista') && grupo.nombre && (
                        <p className="text-xs font-bold uppercase tracking-wide text-base-content/40 px-3 pt-4 pb-1">
                          {grupo.nombre}
                        </p>
                      )}
                      <ul>
                        {grupo.items.map((c) => (
                          <li
                            key={c.id}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-base-200 cursor-pointer rounded-lg transition-colors mx-1"
                            onClick={() => { setShowNuevo(false); abrirChat(c); }}
                          >
                            <div className="avatar placeholder flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-primary text-primary-content">
                                <span className="font-bold text-sm">{c.nombre.charAt(0)}</span>
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{c.nombre}</p>
                              {c.info && <p className="text-xs text-base-content/50 truncate">{c.info}</p>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {contactosFiltrados.length === 0 && (
                    <p className="text-center text-sm text-base-content/40 py-8">
                      {busqueda ? 'Sin resultados' : 'Sin contactos disponibles'}
                    </p>
                  )}
                </div>
              ) : (
                /* Tab masivo */
                <div className="p-4 flex flex-col gap-4">
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-medium">Destinatarios</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={grupoSeleccionado}
                      onChange={(e) => setGrupoSeleccionado(e.target.value)}
                    >
                      <option value="">Seleccioná un grupo...</option>
                      {grupos.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label} ({g.ids.length} {g.ids.length === 1 ? 'persona' : 'personas'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-medium">Mensaje</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered"
                      rows={4}
                      placeholder="Escribí el mensaje que recibirán todos..."
                      value={mensajeMasivo}
                      onChange={(e) => setMensajeMasivo(e.target.value)}
                      maxLength={1000}
                    />
                  </div>

                  {grupoSeleccionado && (
                    <p className="text-xs text-base-content/50 -mt-2">
                      Se enviará como mensaje directo a cada persona del grupo seleccionado.
                    </p>
                  )}

                  <button
                    className="btn btn-primary gap-2"
                    disabled={!grupoSeleccionado || !mensajeMasivo.trim() || enviandoMasivo}
                    onClick={handleEnviarMasivo}
                  >
                    {enviandoMasivo
                      ? <span className="loading loading-spinner loading-sm" />
                      : <><IconSend size={16} /> Enviar a todos</>
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowNuevo(false)} />
        </dialog>
      )}
    </Layout>
  );
}
