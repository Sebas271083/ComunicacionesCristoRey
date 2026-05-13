import { prisma } from '../../config/database.js';
import { isPrivilegiado } from '../../utils/roles.js';

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
        destinatario: { not: 'padres' },
        OR: [{ cursoId: null }, { cursoId: { in: cursoIds } }],
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

export async function crear({ titulo, descripcion, fechaVencimiento, creadorId, cursoId, destinatario }) {
  return prisma.tarea.create({
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
}

export async function actualizar(id, { titulo, descripcion, fechaVencimiento }, userId) {
  const tarea = await prisma.tarea.findUnique({ where: { id } });
  if (!tarea) throw new Error('Tarea no encontrada');
  if (tarea.creadorId !== userId) throw new Error('Sin permiso');
  return prisma.tarea.update({
    where: { id },
    data: { titulo, descripcion, ...(fechaVencimiento && { fechaVencimiento: new Date(fechaVencimiento) }) },
  });
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
