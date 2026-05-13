import * as tareasService from './tareas.service.js';

export async function listar(req, res, next) {
  try {
    const data = await tareasService.listar(req.query, req.user.userId, req.user.rol);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}

export async function crear(req, res, next) {
  try {
    const tarea = await tareasService.crear({ ...req.body, creadorId: req.user.userId }, req.user.rol);
    res.status(201).json({ ok: true, data: tarea });
  } catch (err) {
    if (err.message === 'No tenés asignación en ese curso') return res.status(403).json({ ok: false, error: err.message });
    next(err);
  }
}

export async function actualizar(req, res, next) {
  try {
    const tarea = await tareasService.actualizar(req.params.id, req.body, req.user.userId, req.user.rol);
    res.json({ ok: true, data: tarea });
  } catch (err) {
    if (['Tarea no encontrada', 'Sin permiso', 'No se puede editar una tarea vencida'].includes(err.message))
      return res.status(403).json({ ok: false, error: err.message });
    next(err);
  }
}

export async function eliminar(req, res, next) {
  try {
    await tareasService.eliminar(req.params.id, req.user.userId, req.user.rol);
    res.json({ ok: true, message: 'Tarea eliminada' });
  } catch (err) {
    if (['Tarea no encontrada', 'Sin permiso'].includes(err.message))
      return res.status(403).json({ ok: false, error: err.message });
    next(err);
  }
}

export async function toggleCompletada(req, res, next) {
  try {
    const tarea = await tareasService.toggleCompletada(req.params.id);
    res.json({ ok: true, data: tarea });
  } catch (err) {
    if (err.message === 'Tarea no encontrada') return res.status(404).json({ ok: false, error: err.message });
    next(err);
  }
}
