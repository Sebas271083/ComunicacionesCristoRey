import { useState } from 'react';
import { IconSend } from '@tabler/icons-react';

export function MessageInput({ onSend, disabled }) {
  const [texto, setTexto] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const contenido = texto.trim();
    if (!contenido || disabled) return;
    onSend(contenido);
    setTexto('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 px-3 py-2.5 bg-base-100 border-t-2 border-base-200"
    >
      <textarea
        className="flex-1 resize-none text-sm leading-relaxed
          min-h-[42px] max-h-28
          bg-[#ececec] rounded-2xl px-4 py-2.5
          border-2 border-[#d8d8d8]
          placeholder:text-base-content/40
          focus:outline-none focus:border-primary/50 focus:bg-base-100 focus:shadow-sm
          transition-all duration-150"
        placeholder="Escribe un mensaje..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={1000}
        rows={1}
        disabled={disabled}
      />
      <button
        type="submit"
        className={`btn btn-circle btn-sm flex-shrink-0 mb-0.5 transition-colors ${
          texto.trim() ? 'btn-primary shadow-sm' : 'btn-ghost text-base-content/30'
        }`}
        disabled={!texto.trim() || disabled}
      >
        <IconSend size={15} />
      </button>
    </form>
  );
}
