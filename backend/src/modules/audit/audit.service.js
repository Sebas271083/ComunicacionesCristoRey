import { prisma } from '../../config/database.js';

export async function listar({ recurso, usuarioId, limit = 100 } = {}) {
  return prisma.auditLog.findMany({
    where: {
      ...(recurso    && { recurso }),
      ...(usuarioId  && { usuarioId }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      usuario: { select: { id: true, nombre: true, rol: true } },
    },
  });
}
