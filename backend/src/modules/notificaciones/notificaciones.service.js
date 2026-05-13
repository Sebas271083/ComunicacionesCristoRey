import webpush from 'web-push';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';

if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(env.VAPID_EMAIL, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
}

export async function suscribir({ usuarioId, endpoint, p256dh, auth }) {
  return prisma.pushSubscription.upsert({
    where: { usuarioId },
    update: { endpoint, p256dh, auth },
    create: { usuarioId, endpoint, p256dh, auth },
  });
}

export async function desuscribir(usuarioId) {
  return prisma.pushSubscription.deleteMany({ where: { usuarioId } });
}

export async function enviarNotificacion(usuarioId, payload) {
  const sub = await prisma.pushSubscription.findUnique({ where: { usuarioId } });
  if (!sub) return null;

  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
    return true;
  } catch (err) {
    if (err.statusCode === 410) {
      await prisma.pushSubscription.delete({ where: { usuarioId } });
    }
    return false;
  }
}

// Resuelve los IDs de usuarios que deben recibir la notificación
// según el contexto de la creación (curso, alumno, destinatario)
async function resolverDestinatarios({ cursoId, alumnoId, destinatario = 'todos', excluirId }) {
  let ids = [];

  if (alumnoId) {
    // Evento/tarea de un alumno específico → solo sus papas
    const relaciones = await prisma.papaAlumno.findMany({
      where: { alumnoId },
      select: { papaId: true },
    });
    ids = relaciones.map((r) => r.papaId);
  } else if (cursoId) {
    // Contenido de un curso → papas y/o docentes según destinatario
    if (destinatario !== 'docentes') {
      const alumnos = await prisma.alumno.findMany({
        where: { cursoId, activo: true },
        include: { padres: { select: { papaId: true } } },
      });
      alumnos.forEach((a) => a.padres.forEach((p) => ids.push(p.papaId)));
    }
    if (destinatario !== 'padres') {
      const asignaciones = await prisma.cursoDocente.findMany({
        where: { cursoId },
        select: { docenteId: true },
      });
      asignaciones.forEach((a) => ids.push(a.docenteId));
    }
  } else {
    // General: sin curso ni alumno
    const rolFiltro =
      destinatario === 'padres'   ? { rol: 'papa' } :
      destinatario === 'docentes' ? { rol: { in: ['docente', 'admin', 'director', 'secretaria'] } } :
      {};                          // 'todos' → sin filtro de rol
    const usuarios = await prisma.usuario.findMany({
      where: { activo: true, ...rolFiltro },
      select: { id: true },
    });
    ids = usuarios.map((u) => u.id);
  }

  // Eliminar duplicados y al creador
  return [...new Set(ids)].filter((id) => id !== excluirId);
}

// Notifica a todos los involucrados cuando se crea contenido (tarea/anuncio/evento)
export async function notificarCreacion({ cursoId, alumnoId, destinatario, creadorId, payload }) {
  try {
    const ids = await resolverDestinatarios({ cursoId, alumnoId, destinatario, excluirId: creadorId });
    console.log(`[PUSH] ${payload.title} → ${ids.length} destinatarios`);
    if (!ids.length) return;
    const resultados = await Promise.allSettled(ids.map((id) => enviarNotificacion(id, payload)));
    const ok  = resultados.filter((r) => r.value === true).length;
    const sin = resultados.filter((r) => r.value === null).length;
    const err = resultados.filter((r) => r.status === 'rejected' || r.value === false).length;
    console.log(`[PUSH] enviados: ${ok} | sin suscripción: ${sin} | errores: ${err}`);
  } catch (e) {
    console.error('[PUSH] Error en notificarCreacion:', e.message);
  }
}

export async function enviarATodos(payload) {
  const subs = await prisma.pushSubscription.findMany({ include: { usuario: true } });
  const resultados = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  );
  return resultados;
}
