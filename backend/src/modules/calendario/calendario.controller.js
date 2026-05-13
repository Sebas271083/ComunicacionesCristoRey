import * as calendarioService from './calendario.service.js';

export async function listar(req, res, next) {
  try {
    const data = await calendarioService.listar(req.query, req.user.userId, req.user.rol);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}

export async function crear(req, res, next) {
  try {
    const evento = await calendarioService.crear({ ...req.body, creadorId: req.user.userId });
    res.status(201).json({ ok: true, data: evento });
  } catch (err) { next(err); }
}

export async function actualizar(req, res, next) {
  try {
    const evento = await calendarioService.actualizar(req.params.id, req.body, req.user.userId, req.user.rol);
    res.json({ ok: true, data: evento });
  } catch (err) {
    if (['Evento no encontrado', 'Sin permiso'].includes(err.message))
      return res.status(403).json({ ok: false, error: err.message });
    next(err);
  }
}

export async function eliminar(req, res, next) {
  try {
    await calendarioService.eliminar(req.params.id, req.user.userId, req.user.rol);
    res.json({ ok: true, message: 'Evento eliminado' });
  } catch (err) {
    if (['Evento no encontrado', 'Sin permiso'].includes(err.message))
      return res.status(403).json({ ok: false, error: err.message });
    next(err);
  }
}
