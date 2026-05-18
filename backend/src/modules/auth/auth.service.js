import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database.js';
import { signToken, signRefreshToken, verifyRefreshToken } from '../../config/jwt.js';

export async function registrar({ email, password, nombre, rol }) {
  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) throw new Error('El email ya está registrado');

  const hash = await bcrypt.hash(password, 12);
  const usuario = await prisma.usuario.create({
    data: { email, password: hash, nombre, rol },
    select: { id: true, email: true, nombre: true, rol: true, createdAt: true },
  });

  const payload = { userId: usuario.id, email: usuario.email, rol: usuario.rol };
  return { usuario, token: signToken(payload), refreshToken: signRefreshToken(payload) };
}

export async function login({ email, password }) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.activo) throw new Error('Credenciales inválidas');

  const valido = await bcrypt.compare(password, usuario.password);
  if (!valido) throw new Error('Credenciales inválidas');

  const payload = { userId: usuario.id, email: usuario.email, rol: usuario.rol };
  const usuarioCompleto = await prisma.usuario.findUnique({ where: { id: usuario.id }, select: PERMISOS_SELECT });
  return { usuario: usuarioCompleto, token: signToken(payload), refreshToken: signRefreshToken(payload) };
}

export async function refreshToken(token) {
  const payload = verifyRefreshToken(token);
  const usuario = await prisma.usuario.findUnique({ where: { id: payload.userId } });
  if (!usuario || !usuario.activo) throw new Error('Usuario no encontrado');

  const newPayload = { userId: usuario.id, email: usuario.email, rol: usuario.rol };
  return { token: signToken(newPayload) };
}

const PERMISOS_SELECT = {
  id: true, email: true, nombre: true, rol: true, createdAt: true,
  puedeChat: true, puedeAnuncios: true, puedeTareas: true, puedeEventos: true,
};

export async function getMe(userId) {
  const usuario = await prisma.usuario.findUnique({ where: { id: userId }, select: PERMISOS_SELECT });
  if (!usuario) throw new Error('Usuario no encontrado');
  return usuario;
}
