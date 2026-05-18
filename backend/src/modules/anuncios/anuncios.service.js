import { prisma } from '../../config/database.js';
import { isPrivilegiado } from '../../utils/roles.js';
import { registrarAudit } from '../../utils/audit.js';
import { cursoIdsDelDocente } from '../cursos/cursos.service.js';
import { notificarCreacion } from '../notificaciones/notificaciones.service.js';

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
      aprobado: true,
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
      OR: [
        { creadorId: docenteId },
        { aprobado: true, destinatario: { not: 'padres' }, cursoId: null },
        { aprobado: true, destinatario: { not: 'padres' }, cursoId: { in: cursoIds } },
      ],
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
  const aprobado = rol !== 'docente';
  const anuncio = await prisma.anuncio.create({
    data: {
      titulo,
      contenido,
      cursoId: cursoId || null,
      destinatario: destinatario || 'todos',
      creadorId,
      aprobado,
    },
    include: includeBase,
  });

  if (!aprobado) return anuncio;

  notificarCreacion({
    cursoId: anuncio.cursoId,
    destinatario: anuncio.destinatario,
    creadorId,
    payload: {
      title: `Nuevo anuncio: ${anuncio.titulo}`,
      body: anuncio.contenido.length > 80 ? anuncio.contenido.slice(0, 77) + '...' : anuncio.contenido,
      url: '/anuncios',
    },
  });

  return anuncio;
}

export async function listarPendientes() {
  return prisma.anuncio.findMany({
    where: { aprobado: false },
    orderBy: { createdAt: 'desc' },
    include: includeBase,
  });
}

export async function aprobar(id) {
  const anuncio = await prisma.anuncio.update({
    where: { id },
    data: { aprobado: true },
    include: includeBase,
  });
  notificarCreacion({
    cursoId: anuncio.cursoId,
    destinatario: anuncio.destinatario,
    creadorId: anuncio.creadorId,
    payload: {
      title: `Nuevo anuncio: ${anuncio.titulo}`,
      body: anuncio.contenido.length > 80 ? anuncio.contenido.slice(0, 77) + '...' : anuncio.contenido,
      url: '/anuncios',
    },
  });
  return anuncio;
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
