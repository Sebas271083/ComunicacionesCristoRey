import { prisma } from '../../config/database.js';

export async function listar({ recurso, usuarioId, limit } = {}) {
  return prisma.auditLog.findMany({
    where: {
      ...(recurso    && { recurso }),
      ...(usuarioId  && { usuarioId }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit ? parseInt(limit, 10) : 100,
    include: {
      usuario: { select: { id: true, nombre: true, rol: true } },
    },
  });
}
