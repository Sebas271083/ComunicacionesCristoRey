import { prisma } from '../../config/database.js';
import { isPrivilegiado } from '../../utils/roles.js';
import { registrarAudit } from '../../utils/audit.js';
import { cursoIdsDelDocente } from '../cursos/cursos.service.js';

const PUEDE_EDITAR_AJENO = ['admin', 'director'];

const includeBase = {
  creador: { select: { id: true, nombre: true, rol: true } },
  curso:   { select: { id: true, nombre: true } },
};

export async function listarParaPapa(papaId) {
  const hijos = await prisma.papaAlumno.findMany({
    where: { papaId },
    select: { alumno: { select: { cursoId: true } } },
  });
  const cursoIds = [...new Set(hijos.map((h) => h.alumno.cursoId))];

  return prisma.anuncio.findMany({
    where: {
      destinatario: { not: 'docentes' },
      OR: [{ cursoId: null }, { cursoId: { in: cursoIds } }],
    },
    orderBy: { createdAt: 'desc' },
    include: includeBase,
  });
}

export async function listarParaDocente(docenteId) {
  const asignaciones = await prisma.cursoDocente.findMany({
    where: { docenteId },
    select: { cursoId: true },
  });
  const cursoIds = [...new Set(asignaciones.map((a) => a.cursoId))];

  return prisma.anuncio.findMany({
    where: {
      destinatario: { not: 'padres' },
      OR: [{ cursoId: null }, { cursoId: { in: cursoIds } }],
    },
    orderBy: { createdAt: 'desc' },
    include: includeBase,
  });
}

export async function listarTodos() {
  return prisma.anuncio.findMany({
    orderBy: { createdAt: 'desc' },
    include: includeBase,
  });
}

export async function crear({ titulo, contenido, cursoId, destinatario, creadorId }, rol) {
  if (rol === 'docente' && cursoId) {
    const ids = await cursoIdsDelDocente(creadorId);
    if (!ids.includes(cursoId)) throw new Error('No tenés asignación en ese curso');
  }
  return prisma.anuncio.create({
    data: {
      titulo,
      contenido,
      cursoId: cursoId || null,
      destinatario: destinatario || 'todos',
      creadorId,
    },
    include: includeBase,
  });
}

export async function actualizar(id, { titulo, contenido, cursoId, destinatario }, userId, rol) {
  const anuncio = await prisma.anuncio.findUnique({ where: { id } });
  if (!anuncio) throw new Error('Anuncio no encontrado');
  if (anuncio.creadorId !== userId && !PUEDE_EDITAR_AJENO.includes(rol)) throw new Error('Sin permiso');

  const data = {
    ...(titulo       !== undefined && { titulo }),
    ...(contenido    !== undefined && { contenido }),
    ...(cursoId      !== undefined && { cursoId: cursoId || null }),
    ...(destinatario !== undefined && { destinatario }),
  };

  const actualizado = await prisma.anuncio.update({ where: { id }, data, include: includeBase });

  registrarAudit({
    usuarioId: userId,
    recurso: 'anuncio',
    recursoId: id,
    titulo: anuncio.titulo,
    antes: { titulo: anuncio.titulo, contenido: anuncio.contenido, destinatario: anuncio.destinatario },
    despues: { titulo: actualizado.titulo, contenido: actualizado.contenido, destinatario: actualizado.destinatario },
  });

  return actualizado;
}

export async function eliminar(id, userId, rol) {
  const anuncio = await prisma.anuncio.findUnique({ where: { id } });
  if (!anuncio) throw new Error('Anuncio no encontrado');
  if (anuncio.creadorId !== userId && !isPrivilegiado(rol)) throw new Error('Sin permiso');
  return prisma.anuncio.delete({ where: { id } });
}
