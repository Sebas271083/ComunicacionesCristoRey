import { prisma } from '../../config/database.js';

export async function listar(cursoId) {
  return prisma.alumno.findMany({
    where: { activo: true, ...(cursoId && { cursoId }) },
    orderBy: { nombre: 'asc' },
    include: {
      curso: { select: { id: true, nombre: true } },
      padres: { include: { papa: { select: { id: true, nombre: true, email: true } } } },
    },
  });
}

export async function crear({ nombre, cursoId }) {
  return prisma.alumno.create({
    data: { nombre, cursoId },
    include: { curso: { select: { id: true, nombre: true } } },
  });
}

export async function actualizar(id, { nombre, cursoId }) {
  return prisma.alumno.update({
    where: { id },
    data: { nombre, ...(cursoId && { cursoId }) },
    include: { curso: { select: { id: true, nombre: true } } },
  });
}

export async function eliminar(id) {
  return prisma.alumno.update({ where: { id }, data: { activo: false } });
}

export async function vincularPapa({ alumnoId, papaId }) {
  const papa = await prisma.usuario.findUnique({ where: { id: papaId } });
  if (!papa || papa.rol !== 'papa') throw new Error('Usuario no es papá');

  return prisma.papaAlumno.create({
    data: { papaId, alumnoId },
    include: {
      papa: { select: { id: true, nombre: true } },
      alumno: { select: { id: true, nombre: true } },
    },
  });
}

export async function desvincularPapa({ alumnoId, papaId }) {
  return prisma.papaAlumno.delete({ where: { papaId_alumnoId: { papaId, alumnoId } } });
}

// Devuelve los papás de un curso (útil para docentes al escribir)
export async function papasDeCurso(cursoId) {
  const alumnos = await prisma.alumno.findMany({
    where: { cursoId, activo: true },
    include: {
      padres: {
        include: { papa: { select: { id: true, nombre: true, email: true } } },
      },
    },
  });

  // Deduplicar papás (un papá puede tener 2 hijos en el mismo curso)
  const papasMap = new Map();
  for (const alumno of alumnos) {
    for (const pa of alumno.padres) {
      if (!papasMap.has(pa.papaId)) {
        papasMap.set(pa.papaId, { ...pa.papa, hijos: [] });
      }
      papasMap.get(pa.papaId).hijos.push({ id: alumno.id, nombre: alumno.nombre });
    }
  }
  return Array.from(papasMap.values());
}
