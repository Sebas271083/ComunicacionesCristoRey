import { prisma } from '../../config/database.js';
import { isPrivilegiado } from '../../utils/roles.js';
import { registrarAudit } from '../../utils/audit.js';
import { cursoIdsDelDocente } from '../cursos/cursos.service.js';
import { notificarCreacion } from '../notificaciones/notificaciones.service.js';

const PUEDE_EDITAR_AJENO = ['admin', 'director'];

const includeBase = {
  creador: { select: { id: true, nombre: true } },
  curso:   { select: { id: true, nombre: true } },
  alumno:  { select: { id: true, nombre: true } },
};

function rangoPorMes(mes, anio) {
  if (!mes || !anio) return {};
  return {
    fecha: {
      gte: new Date(anio, mes - 1, 1),
      lte: new Date(anio, mes, 0, 23, 59, 59),
    },
  };
}

export async function listar({ mes, anio } = {}, userId, rol) {
  const rango = rangoPorMes(mes, anio);

  if (isPrivilegiado(rol)) {
    return prisma.evento.findMany({
      where: rango,
      orderBy: { fecha: 'asc' },
      include: includeBase,
    });
  }

  if (rol === 'docente') {
    const asignaciones = await prisma.cursoDocente.findMany({
      where: { docenteId: userId },
      select: { cursoId: true },
    });
    const cursoIds = asignaciones.map((a) => a.cursoId);

    return prisma.evento.findMany({
      where: {
        ...rango,
        OR: [
          // Eventos que el docente creó (siempre los ve)
          { creadorId: userId },
          // Generales sin alumno, no exclusivos de padres
          { alumnoId: null, destinatario: { not: 'padres' }, cursoId: null },
          // De sus cursos, no exclusivos de padres, no por alumno
          { alumnoId: null, destinatario: { not: 'padres' }, cursoId: { in: cursoIds } },
        ],
      },
      orderBy: { fecha: 'asc' },
      include: includeBase,
    });
  }

  // papa
  const hijos = await prisma.papaAlumno.findMany({
    where: { papaId: userId },
    include: { alumno: { select: { id: true, cursoId: true } } },
  });
  const alumnoIds = hijos.map((h) => h.alumno.id);
  const cursoIds  = [...new Set(hijos.map((h) => h.alumno.cursoId))];

  return prisma.evento.findMany({
    where: {
      ...rango,
      destinatario: { not: 'docentes' },
      OR: [
        // Generales sin curso ni alumno
        { cursoId: null, alumnoId: null },
        // De los cursos de sus hijos, sin alumno específico
        { cursoId: { in: cursoIds }, alumnoId: null },
        // Por alumno, para sus hijos
        { alumnoId: { in: alumnoIds } },
      ],
    },
    orderBy: { fecha: 'asc' },
    include: includeBase,
  });
}

export async function crear({ titulo, descripcion, fecha, tipo, creadorId, cursoId, alumnoId, destinatario }, rol) {
  if (rol === 'docente' && cursoId) {
    const ids = await cursoIdsDelDocente(creadorId);
    if (!ids.includes(cursoId)) throw new Error('No tenés asignación en ese curso');
  }
  const evento = await prisma.evento.create({
    data: {
      titulo,
      descripcion,
      fecha: new Date(fecha),
      tipo,
      creadorId,
      cursoId:      cursoId   || null,
      alumnoId:     alumnoId  || null,
      destinatario: destinatario || 'todos',
    },
    include: includeBase,
  });

  notificarCreacion({
    cursoId: evento.cursoId,
    alumnoId: evento.alumnoId,
    destinatario: evento.destinatario,
    creadorId,
    payload: {
      title: `Nuevo evento: ${evento.titulo}`,
      body: `${new Date(evento.fecha).toLocaleDateString('es-AR')}${evento.descripcion ? ` · ${evento.descripcion}` : ''}`,
      url: '/calendario',
    },
  });

  return evento;
}

export async function actualizar(id, datos, userId, rol) {
  const evento = await prisma.evento.findUnique({ where: { id } });
  if (!evento) throw new Error('Evento no encontrado');
  if (evento.creadorId !== userId && !PUEDE_EDITAR_AJENO.includes(rol)) throw new Error('Sin permiso');
  if (evento.fecha <= new Date()) throw new Error('No se puede editar un evento pasado');

  const data = {
    ...(datos.titulo       !== undefined && { titulo: datos.titulo }),
    ...(datos.descripcion  !== undefined && { descripcion: datos.descripcion }),
    ...(datos.tipo         !== undefined && { tipo: datos.tipo }),
    ...(datos.fecha                      && { fecha: new Date(datos.fecha) }),
    ...(datos.cursoId      !== undefined && { cursoId: datos.cursoId || null }),
    ...(datos.alumnoId     !== undefined && { alumnoId: datos.alumnoId || null }),
    ...(datos.destinatario !== undefined && { destinatario: datos.destinatario }),
  };

  const actualizado = await prisma.evento.update({ where: { id }, data, include: includeBase });

  registrarAudit({
    usuarioId: userId,
    recurso: 'evento',
    recursoId: id,
    titulo: evento.titulo,
    antes: { titulo: evento.titulo, descripcion: evento.descripcion, tipo: evento.tipo, destinatario: evento.destinatario },
    despues: { titulo: actualizado.titulo, descripcion: actualizado.descripcion, tipo: actualizado.tipo, destinatario: actualizado.destinatario },
  });

  return actualizado;
}

export async function eliminar(id, userId, rol) {
  const evento = await prisma.evento.findUnique({ where: { id } });
  if (!evento) throw new Error('Evento no encontrado');
  if (evento.creadorId !== userId && !isPrivilegiado(rol)) throw new Error('Sin permiso');
  return prisma.evento.delete({ where: { id } });
}
