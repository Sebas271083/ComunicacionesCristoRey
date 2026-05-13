import { prisma } from '../../config/database.js';
import { isPrivilegiado } from '../../utils/roles.js';
import { registrarAudit } from '../../utils/audit.js';
import { cursoIdsDelDocente } from '../cursos/cursos.service.js';
import { notificarCreacion } from '../notificaciones/notificaciones.service.js';

const PUEDE_EDITAR_AJENO = ['admin', 'director'];

const includeBase = {
  creador: { select: { id: true, nombre: true } },
  curso:   { select: { id: true, nombre: true } },
};

export async function listar({ desde, hasta } = {}, userId, rol) {
  const rango = {};
  if (desde || hasta) {
    rango.fechaVencimiento = {
      ...(desde && { gte: new Date(desde) }),
      ...(hasta && { lte: new Date(hasta) }),
    };
  }

  if (isPrivilegiado(rol)) {
    return prisma.tarea.findMany({
      where: rango,
      orderBy: { fechaVencimiento: 'asc' },
      include: includeBase,
    });
  }

  if (rol === 'docente') {
    const asignaciones = await prisma.cursoDocente.findMany({
      where: { docenteId: userId },
      select: { cursoId: true },
    });
    const cursoIds = asignaciones.map((a) => a.cursoId);

    return prisma.tarea.findMany({
      where: {
        ...rango,
        OR: [
          // Siempre ve las tareas que él mismo creó
          { creadorId: userId },
          // Y las de sus cursos que no sean exclusivas de padres
          { destinatario: { not: 'padres' }, cursoId: null },
          { destinatario: { not: 'padres' }, cursoId: { in: cursoIds } },
        ],
      },
      orderBy: { fechaVencimiento: 'asc' },
      include: includeBase,
    });
  }

  // papa
  const hijos = await prisma.papaAlumno.findMany({
    where: { papaId: userId },
    select: { alumno: { select: { cursoId: true } } },
  });
  const cursoIds = [...new Set(hijos.map((h) => h.alumno.cursoId))];

  return prisma.tarea.findMany({
    where: {
      ...rango,
      destinatario: { not: 'docentes' },
      OR: [{ cursoId: null }, { cursoId: { in: cursoIds } }],
    },
    orderBy: { fechaVencimiento: 'asc' },
    include: includeBase,
  });
}

export async function crear({ titulo, descripcion, fechaVencimiento, creadorId, cursoId, destinatario }, rol) {
  if (rol === 'docente' && cursoId) {
    const ids = await cursoIdsDelDocente(creadorId);
    if (!ids.includes(cursoId)) throw new Error('No tenés asignación en ese curso');
  }
  const tarea = await prisma.tarea.create({
    data: {
      titulo,
      descripcion,
      fechaVencimiento: new Date(fechaVencimiento),
      creadorId,
      cursoId: cursoId || null,
      destinatario: destinatario || 'todos',
    },
    include: includeBase,
  });

  notificarCreacion({
    cursoId: tarea.cursoId,
    destinatario: tarea.destinatario,
    creadorId,
    payload: {
      title: `Nueva tarea: ${tarea.titulo}`,
      body: tarea.descripcion ?? `Vence ${new Date(tarea.fechaVencimiento).toLocaleDateString('es-AR')}`,
      url: '/tareas',
    },
  });

  return tarea;
}

export async function actualizar(id, { titulo, descripcion, fechaVencimiento, cursoId, destinatario }, userId, rol) {
  const tarea = await prisma.tarea.findUnique({ where: { id } });
  if (!tarea) throw new Error('Tarea no encontrada');
  if (tarea.creadorId !== userId && !PUEDE_EDITAR_AJENO.includes(rol)) throw new Error('Sin permiso');
  if (tarea.fechaVencimiento <= new Date()) throw new Error('No se puede editar una tarea vencida');

  const data = {
    ...(titulo          !== undefined && { titulo }),
    ...(descripcion     !== undefined && { descripcion }),
    ...(fechaVencimiento              && { fechaVencimiento: new Date(fechaVencimiento) }),
    ...(cursoId         !== undefined && { cursoId: cursoId || null }),
    ...(destinatario    !== undefined && { destinatario }),
  };

  const actualizada = await prisma.tarea.update({ where: { id }, data, include: includeBase });

  registrarAudit({
    usuarioId: userId,
    recurso: 'tarea',
    recursoId: id,
    titulo: tarea.titulo,
    antes: { titulo: tarea.titulo, descripcion: tarea.descripcion, destinatario: tarea.destinatario },
    despues: { titulo: actualizada.titulo, descripcion: actualizada.descripcion, destinatario: actualizada.destinatario },
  });

  return actualizada;
}

export async function eliminar(id, userId, rol) {
  const tarea = await prisma.tarea.findUnique({ where: { id } });
  if (!tarea) throw new Error('Tarea no encontrada');
  if (tarea.creadorId !== userId && !isPrivilegiado(rol)) throw new Error('Sin permiso');
  return prisma.tarea.delete({ where: { id } });
}

export async function toggleCompletada(id) {
  const tarea = await prisma.tarea.findUnique({ where: { id } });
  if (!tarea) throw new Error('Tarea no encontrada');
  return prisma.tarea.update({ where: { id }, data: { completada: !tarea.completada } });
}
