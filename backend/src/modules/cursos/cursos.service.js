import { prisma } from '../../config/database.js';
import { cicloActual } from '../../utils/ciclo.js';

const INCLUDE_DOCENTES = {
  docentes: {
    include: {
      docente: { select: { id: true, nombre: true } },
      materia: { select: { id: true, nombre: true } },
    },
  },
};

export async function listarCursos() {
  const ciclo = cicloActual();
  const cursos = await prisma.curso.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
    include: {
      docentes: {
        where: { cicloLectivo: ciclo },
        include: {
          docente: { select: { id: true, nombre: true } },
          materia: { select: { id: true, nombre: true } },
        },
      },
      _count: { select: { alumnos: true } },
    },
  });
  return cursos.map((c) => ({ ...c, alumnos: c._count.alumnos, _count: undefined }));
}

export async function crearCurso({ nombre, nivel }) {
  return prisma.curso.create({ data: { nombre, nivel } });
}

export async function eliminarCurso(id) {
  return prisma.curso.update({ where: { id }, data: { activo: false } });
}

// Materias
export async function listarMaterias() {
  return prisma.materia.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } });
}

export async function crearMateria({ nombre }) {
  return prisma.materia.create({ data: { nombre } });
}

// Asignaciones docente → curso + materia + tipo
export async function asignarDocente({ cursoId, docenteId, materiaId, tipo }) {
  const ciclo = cicloActual();
  return prisma.cursoDocente.create({
    data: {
      cursoId,
      docenteId,
      materiaId: materiaId ?? null,
      tipo: tipo ?? 'especial',
      cicloLectivo: ciclo,
    },
    include: {
      docente: { select: { id: true, nombre: true } },
      materia: { select: { id: true, nombre: true } },
      curso:   { select: { id: true, nombre: true } },
    },
  });
}

export async function quitarDocente(id) {
  return prisma.cursoDocente.delete({ where: { id } });
}

// Devuelve los cursos del ciclo activo accesibles para un papá (por sus hijos)
export async function cursosDelPapa(papaId) {
  const ciclo = cicloActual();
  const hijos = await prisma.papaAlumno.findMany({
    where: { papaId },
    include: {
      alumno: {
        include: {
          curso: {
            include: {
              docentes: {
                where: { cicloLectivo: ciclo },
                include: {
                  docente: { select: { id: true, nombre: true, email: true } },
                  materia: { select: { id: true, nombre: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  return hijos.map((h) => ({
    alumno: { id: h.alumno.id, nombre: h.alumno.nombre },
    curso: {
      id: h.alumno.curso.id,
      nombre: h.alumno.curso.nombre,
      docentes: h.alumno.curso.docentes.map((cd) => ({
        id: cd.docente.id,
        nombre: cd.docente.nombre,
        email: cd.docente.email,
        materia: cd.materia?.nombre ?? null,
        tipo: cd.tipo,
        cursoDocenteId: cd.id,
      })),
    },
  }));
}

// Devuelve los cursos del ciclo activo que enseña un docente
export async function cursosDelDocente(docenteId) {
  const ciclo = cicloActual();
  return prisma.cursoDocente.findMany({
    where: { docenteId, cicloLectivo: ciclo },
    include: {
      curso:   { select: { id: true, nombre: true } },
      materia: { select: { id: true, nombre: true } },
    },
  });
}

// IDs de cursos del docente para el ciclo actual (helper interno)
export async function cursoIdsDelDocente(docenteId) {
  const ciclo = cicloActual();
  const asigs = await prisma.cursoDocente.findMany({
    where: { docenteId, cicloLectivo: ciclo },
    select: { cursoId: true },
  });
  return [...new Set(asigs.map((a) => a.cursoId))];
}

// Inicio de nuevo ciclo lectivo: sin doc existentes para el nuevo año
export async function resumenNuevoCiclo(anio) {
  const cursos = await prisma.curso.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
    include: {
      docentes: {
        where: { cicloLectivo: anio },
        include: { docente: { select: { id: true, nombre: true } }, materia: true },
      },
      _count: { select: { alumnos: true } },
    },
  });
  return {
    ciclo: anio,
    cursos: cursos.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      alumnos: c._count.alumnos,
      docentesAsignados: c.docentes.length,
    })),
  };
}
