import { verifyToken } from '../config/jwt.js';
import { prisma } from '../config/database.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, error: 'Token no proporcionado' });
  }
  try {
    req.user = verifyToken(authHeader.slice(7));
    next();
  } catch {
    res.status(401).json({ ok: false, error: 'Token inválido o expirado' });
  }
}

export function requireRol(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ ok: false, error: 'Acceso denegado' });
    }
    next();
  };
}

// Verifica un permiso específico del usuario en la DB (para docentes)
// Los roles privilegiados siempre pasan.
export function requirePermiso(campo) {
  const PRIVILEGIADOS = ['admin', 'director', 'secretaria'];
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ ok: false, error: 'No autenticado' });
    if (PRIVILEGIADOS.includes(req.user.rol)) return next();
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: req.user.userId },
        select: { [campo]: true },
      });
      if (!usuario || usuario[campo] === false) {
        return res.status(403).json({ ok: false, error: 'Sin permiso para esta función' });
      }
      next();
    } catch {
      res.status(500).json({ ok: false, error: 'Error al verificar permisos' });
    }
  };
}
