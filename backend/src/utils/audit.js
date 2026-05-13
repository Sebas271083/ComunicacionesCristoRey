import { prisma } from '../config/database.js';

export async function registrarAudit({ usuarioId, recurso, recursoId, titulo, antes, despues }) {
  const campos = Object.keys(despues).reduce((acc, key) => {
    const vAntes = antes[key];
    const vDespues = despues[key];
    if (String(vAntes) !== String(vDespues)) {
      acc[key] = { antes: vAntes ?? null, despues: vDespues ?? null };
    }
    return acc;
  }, {});

  if (Object.keys(campos).length === 0) return null;

  return prisma.auditLog.create({
    data: { usuarioId, accion: 'editar', recurso, recursoId, titulo, detalle: campos },
  }).catch(() => null); // nunca falla la operación principal
}
