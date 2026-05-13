import { prisma } from '../../config/database.js';
import bcrypt from 'bcryptjs';

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
    select: { id: true, nombre: true, email: true, rol: true, createdAt: true },
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

export async function desactivarUsuario(id) {
  return prisma.usuario.update({
    where: { id },
    data: { activo: false },
    select: { id: true, nombre: true, activo: true },
  });
}
