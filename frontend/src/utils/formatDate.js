import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatFecha(date) {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Ayer';
  return format(d, 'dd/MM/yyyy');
}

export function formatHora(date) {
  return format(new Date(date), 'HH:mm');
}

export function formatFechaLarga(date) {
  return format(new Date(date), "EEEE d 'de' MMMM", { locale: es });
}

export function formatFechaVencimiento(date) {
  return format(new Date(date), "d 'de' MMMM yyyy", { locale: es });
}

export function formatRelativo(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function isVencida(date) {
  return new Date(date) < new Date();
}
