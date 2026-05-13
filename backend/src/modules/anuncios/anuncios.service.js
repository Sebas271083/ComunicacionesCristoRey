import { prisma } from '../../config/database.js';
import { isPrivilegiado } from '../../utils/roles.js';

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

export async function crear({ titulo, contenido, cursoId, destinatario, creadorId }) {
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

export async function eliminar(id, userId, rol) {
  const anuncio = await prisma.anuncio.findUnique({ where: { id } });
  if (!anuncio) throw new Error('Anuncio no encontrado');
  if (anuncio.creadorId !== userId && !isPrivilegiado(rol)) throw new Error('Sin permiso');
  return prisma.anuncio.delete({ where: { id } });
}
