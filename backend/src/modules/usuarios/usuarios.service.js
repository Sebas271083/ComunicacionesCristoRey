import { prisma } from '../../config/database.js';
import bcrypt from 'bcryptjs';

export async function crearUsuario({ nombre, email, password, rol }) {
  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) throw new Error('El email ya está registrado');
  const hash = await bcrypt.hash(password, 12);
  return prisma.usuario.create({
    data: { nombre, email, password: hash, rol },
    select: { id: true, nombre: true, email: true, rol: true, createdAt: true },
  });
}

export async function listarDocentes() {
  return prisma.usuario.findMany({
    where: { rol: 'docente', activo: true },
    select: { id: true, nombre: true, email: true, rol: true },
    orderBy: { nombre: 'asc' },
  });
}

export async function listarUsuarios() {
  return prisma.usuario.findMany({
    where: { activo: true },
    select: {
      id: true, nombre: true, email: true, rol: true, createdAt: true,
      puedeChat: true, puedeAnuncios: true, puedeTareas: true, puedeEventos: true,
    },
    orderBy: { nombre: 'asc' },
  });
}

export async function obtenerUsuario(id) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { id: true, nombre: true, email: true, rol: true, createdAt: true },
  });
  if (!usuario) throw new Error('Usuario no encontrado');
  return usuario;
}

export async function cambiarPassword(id, { passwordActual, passwordNueva }) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) throw new Error('Usuario no encontrado');
  const valido = await bcrypt.compare(passwordActual, usuario.password);
  if (!valido) throw new Error('Contraseña actual incorrecta');
  const hash = await bcrypt.hash(passwordNueva, 12);
  return prisma.usuario.update({ where: { id }, data: { password: hash }, select: { id: true } });
}

export async function actualizarUsuario(id, { nombre, email, rol, password }) {
  const data = {};
  if (nombre) data.nombre = nombre;
  if (rol)    data.rol    = rol;
  if (email) {
    const existe = await prisma.usuario.findFirst({ where: { email, NOT: { id } } });
    if (existe) throw new Error('El email ya está registrado');
    data.email = email;
  }
  if (password) data.password = await bcrypt.hash(password, 12);
  return prisma.usuario.update({
    where: { id },
    data,
    select: { id: true, nombre: true, email: true, rol: true, createdAt: true },
  });
}

export async function actualizarPermisos(id, { puedeChat, puedeAnuncios, puedeTareas, puedeEventos }) {
  return prisma.usuario.update({
    where: { id },
    data: {
      ...(puedeChat      !== undefined && { puedeChat }),
      ...(puedeAnuncios  !== undefined && { puedeAnuncios }),
      ...(puedeTareas    !== undefined && { puedeTareas }),
      ...(puedeEventos   !== undefined && { puedeEventos }),
    },
    select: { id: true, nombre: true, puedeChat: true, puedeAnuncios: true, puedeTareas: true, puedeEventos: true },
  });
}

export async function desactivarUsuario(id) {
  return prisma.usuario.update({
    where: { id },
    data: { activo: false },
    select: { id: true, nombre: true, activo: true },
  });
}
