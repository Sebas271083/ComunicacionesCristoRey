import { prisma } from '../../config/database.js';

export async function listarCursos() {
  return prisma.curso.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
    include: {
      docentes: {
        include: {
          docente: { select: { id: true, nombre: true } },
          materia: { select: { id: true, nombre: true } },
        },
      },
      _count: { select: { alumnos: true } },
    },
  });
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

// Asignaciones docente → curso + materia
export async function asignarDocente({ cursoId, docenteId, materiaId }) {
  return prisma.cursoDocente.create({
    data: { cursoId, docenteId, materiaId: materiaId ?? null },
    include: {
      docente: { select: { id: true, nombre: true } },
      materia: { select: { id: true, nombre: true } },
      curso: { select: { id: true, nombre: true } },
    },
  });
}

export async function quitarDocente(id) {
  return prisma.cursoDocente.delete({ where: { id } });
}

// Devuelve los cursos y docentes accesibles para un papá (por sus hijos)
export async function cursosDelPapa(papaId) {
  const hijos = await prisma.papaAlumno.findMany({
    where: { papaId },
    include: {
      alumno: {
        include: {
          curso: {
            include: {
              docentes: {
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
        materia: cd.materia?.nombre ?? null,
        cursoDocenteId: cd.id,
      })),
    },
  }));
}

// Devuelve los cursos que enseña un docente
export async function cursosDelDocente(docenteId) {
  return prisma.cursoDocente.findMany({
    where: { docenteId },
    include: {
      curso: { select: { id: true, nombre: true } },
      materia: { select: { id: true, nombre: true } },
    },
  });
}
