import { prisma } from '../../config/database.js';
import { isPrivilegiado } from '../../utils/roles.js';
import { enviarNotificacion } from '../notificaciones/notificaciones.service.js';
import { cicloActual } from '../../utils/ciclo.js';

export async function getConversaciones(userId) {
  const mensajes = await prisma.mensaje.findMany({
    where: { OR: [{ enviadorId: userId }, { receptorId: userId }] },
    orderBy: { createdAt: 'desc' },
    include: {
      enviador: { select: { id: true, nombre: true, rol: true } },
      receptor: { select: { id: true, nombre: true, rol: true } },
    },
  });

  const conversacionesMap = new Map();
  for (const m of mensajes) {
    const interlocutorId = m.enviadorId === userId ? m.receptorId : m.enviadorId;
    if (!conversacionesMap.has(interlocutorId)) {
      conversacionesMap.set(interlocutorId, {
        interlocutor: m.enviadorId === userId ? m.receptor : m.enviador,
        ultimoMensaje: m.contenido,
        fecha: m.createdAt,
        noLeidos: 0,
      });
    }
  }

  // Enriquecer interlocutores papa con los nombres de sus hijos
  const papaIds = Array.from(conversacionesMap.values())
    .filter((c) => c.interlocutor.rol === 'papa')
    .map((c) => c.interlocutor.id);

  if (papaIds.length) {
    const relaciones = await prisma.papaAlumno.findMany({
      where: { papaId: { in: papaIds } },
      include: { alumno: { select: { nombre: true } } },
    });
    const alumnosPorPapa = {};
    for (const r of relaciones) {
      (alumnosPorPapa[r.papaId] ??= []).push(r.alumno.nombre);
    }
    for (const conv of conversacionesMap.values()) {
      if (conv.interlocutor.rol === 'papa') {
        const hijos = alumnosPorPapa[conv.interlocutor.id] ?? [];
        conv.interlocutor.info = hijos.length
          ? `padre/madre de ${hijos.join(' y ')}`
          : 'Padre/Madre';
      }
    }
  }

  const noLeidos = await prisma.mensaje.groupBy({
    by: ['enviadorId'],
    where: { receptorId: userId, leido: false },
    _count: { id: true },
  });
  for (const nl of noLeidos) {
    if (conversacionesMap.has(nl.enviadorId)) {
      conversacionesMap.get(nl.enviadorId).noLeidos = nl._count.id;
    }
  }

  return Array.from(conversacionesMap.values());
}

export async function getHistorial(userId, otroUserId, limit = 50, before) {
  const mensajes = await prisma.mensaje.findMany({
    where: {
      OR: [
        { enviadorId: userId, receptorId: otroUserId },
        { enviadorId: otroUserId, receptorId: userId },
      ],
      ...(before && { createdAt: { lt: new Date(before) } }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { enviador: { select: { id: true, nombre: true } } },
  });
  return mensajes.reverse();
}

export async function enviar({ contenido, enviadorId, receptorId }) {
  const receptor = await prisma.usuario.findUnique({ where: { id: receptorId } });
  if (!receptor) throw new Error('Receptor no encontrado');

  const mensaje = await prisma.mensaje.create({
    data: { contenido, enviadorId, receptorId },
    include: { enviador: { select: { id: true, nombre: true } } },
  });

  // Push al receptor (sin await — no bloqueamos la respuesta)
  const preview = contenido.length > 60 ? contenido.slice(0, 57) + '...' : contenido;
  enviarNotificacion(receptorId, {
    title: mensaje.enviador.nombre,
    body: preview,
    url: '/chat',
  }).catch(() => {});

  return mensaje;
}

export async function enviarMasivo({ contenido, enviadorId, receptorIds }) {
  if (!receptorIds?.length) throw new Error('Sin destinatarios');

  const enviador = await prisma.usuario.findUnique({ where: { id: enviadorId }, select: { nombre: true } });
  await prisma.mensaje.createMany({
    data: receptorIds.map((receptorId) => ({ contenido, enviadorId, receptorId })),
  });

  // Push a todos los receptores en paralelo
  const preview = contenido.length > 60 ? contenido.slice(0, 57) + '...' : contenido;
  const payload = { title: enviador?.nombre ?? 'Nuevo mensaje', body: preview, url: '/chat' };
  Promise.allSettled(receptorIds.map((id) => enviarNotificacion(id, payload))).catch(() => {});

  return { count: receptorIds.length };
}

export async function marcarLeido(id, userId) {
  const mensaje = await prisma.mensaje.findUnique({ where: { id } });
  if (!mensaje) throw new Error('Mensaje no encontrado');
  if (mensaje.receptorId !== userId) throw new Error('Sin permiso');
  return prisma.mensaje.update({ where: { id }, data: { leido: true } });
}

export async function marcarLeidosConversacion(otroUserId, userId) {
  return prisma.mensaje.updateMany({
    where: { enviadorId: otroUserId, receptorId: userId, leido: false },
    data: { leido: true },
  });
}

export async function eliminar(id, userId) {
  const mensaje = await prisma.mensaje.findUnique({ where: { id } });
  if (!mensaje) throw new Error('Mensaje no encontrado');
  if (mensaje.enviadorId !== userId) throw new Error('Sin permiso');
  return prisma.mensaje.delete({ where: { id } });
}

// Contactos disponibles para chat individual según rol
export async function contactosDisponibles(userId, rol) {
  if (isPrivilegiado(rol)) {
    const todos = await prisma.usuario.findMany({
      where: { id: { not: userId }, activo: true },
      select: { id: true, nombre: true, rol: true },
      orderBy: { nombre: 'asc' },
    });
    const staff  = todos.filter((u) => u.rol !== 'papa');
    const padres = todos.filter((u) => u.rol === 'papa');
    return [
      { tipo: 'lista', nombre: 'Personal docente y administrativo', items: staff },
      { tipo: 'lista', nombre: 'Padres', items: padres },
    ];
  }

  if (rol === 'docente') {
    const cursos = await papasDisponiblesParaDocente(userId);
    return cursos.map((c) => ({ tipo: 'curso', nombre: c.nombre, items: c.papas }));
  }

  // papa
  return cursosDelPapaContactos(userId);
}

// Grupos disponibles para envío masivo según rol
export async function gruposMasivo(userId, rol) {
  if (isPrivilegiado(rol)) {
    const [todos, staff, padresRaw, cursos] = await Promise.all([
      prisma.usuario.findMany({ where: { id: { not: userId }, activo: true }, select: { id: true } }),
      prisma.usuario.findMany({ where: { id: { not: userId }, activo: true, rol: { in: ['docente', 'admin', 'director', 'secretaria'] } }, select: { id: true } }),
      prisma.usuario.findMany({ where: { activo: true, rol: 'papa' }, select: { id: true } }),
      prisma.curso.findMany({
        where: { activo: true },
        select: { id: true, nombre: true, alumnos: { select: { padres: { select: { papaId: true } } } } },
        orderBy: { nombre: 'asc' },
      }),
    ]);

    const grupos = [
      { id: 'todos',   label: 'Toda la institución',              ids: todos.map((u) => u.id) },
      { id: 'staff',   label: 'Solo docentes y administrativos',  ids: staff.map((u) => u.id) },
      { id: 'padres',  label: 'Todos los padres',                 ids: padresRaw.map((u) => u.id) },
    ];

    for (const curso of cursos) {
      const papaIds = [...new Set(curso.alumnos.flatMap((a) => a.padres.map((p) => p.papaId)))];
      if (papaIds.length) grupos.push({ id: `curso_${curso.id}`, label: `Padres del ${curso.nombre}`, ids: papaIds });
    }
    return grupos;
  }

  if (rol === 'docente') {
    const asignaciones = await prisma.cursoDocente.findMany({
      where: { docenteId: userId, cicloLectivo: cicloActual() },
      include: { curso: { select: { id: true, nombre: true, alumnos: { include: { padres: true } } } } },
    });

    const todosPadresSet = new Set();
    const grupos = [];

    for (const a of asignaciones) {
      const papaIds = [...new Set(a.curso.alumnos.flatMap((al) => al.padres.map((p) => p.papaId)))];
      papaIds.forEach((id) => todosPadresSet.add(id));
      if (papaIds.length) grupos.push({ id: `curso_${a.curso.id}`, label: `Padres del ${a.curso.nombre}`, ids: papaIds });
    }

    if (todosPadresSet.size) grupos.unshift({ id: 'todos_mis_padres', label: 'Todos mis padres', ids: [...todosPadresSet] });
    return grupos;
  }

  return [];
}

// Docente: papás por curso (solo ciclo activo)
export async function papasDisponiblesParaDocente(docenteId) {
  const asignaciones = await prisma.cursoDocente.findMany({
    where: { docenteId, cicloLectivo: cicloActual() },
    select: { cursoId: true, curso: { select: { id: true, nombre: true } } },
  });

  const cursoIds = [...new Set(asignaciones.map((a) => a.cursoId))];
  const alumnos = await prisma.alumno.findMany({
    where: { cursoId: { in: cursoIds }, activo: true },
    include: {
      curso: { select: { id: true, nombre: true } },
      padres: { include: { papa: { select: { id: true, nombre: true, email: true } } } },
    },
  });

  const cursosMap = new Map();
  for (const alumno of alumnos) {
    const key = alumno.cursoId;
    if (!cursosMap.has(key)) cursosMap.set(key, { ...alumno.curso, papas: new Map() });
    for (const pa of alumno.padres) {
      if (!cursosMap.get(key).papas.has(pa.papaId)) {
        cursosMap.get(key).papas.set(pa.papaId, { ...pa.papa, hijos: [alumno.nombre] });
      } else {
        cursosMap.get(key).papas.get(pa.papaId).hijos.push(alumno.nombre);
      }
    }
  }

  return Array.from(cursosMap.values()).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    papas: Array.from(c.papas.values()).map(({ hijos, ...papa }) => ({
      ...papa,
      info: `padre/madre de ${hijos.join(' y ')}`,
    })),
  }));
}

// Papa: docentes de sus hijos (para el modal de nuevo chat)
async function cursosDelPapaContactos(papaId) {
  const hijos = await prisma.papaAlumno.findMany({
    where: { papaId },
    include: { alumno: { include: { curso: { include: { docentes: { include: { docente: { select: { id: true, nombre: true } }, materia: true } } } } } } },
  });

  const docentesMap = new Map();
  for (const h of hijos) {
    for (const cd of h.alumno.curso.docentes) {
      const info = `${h.alumno.curso.nombre}${cd.materia ? ` · ${cd.materia.nombre}` : ''}`;
      if (!docentesMap.has(cd.docenteId)) {
        docentesMap.set(cd.docenteId, { id: cd.docenteId, nombre: cd.docente.nombre, info });
      } else {
        docentesMap.get(cd.docenteId).info += ` / ${info}`;
      }
    }
  }

  return [{ tipo: 'lista', nombre: 'Docentes de tus hijos', items: Array.from(docentesMap.values()) }];
}
