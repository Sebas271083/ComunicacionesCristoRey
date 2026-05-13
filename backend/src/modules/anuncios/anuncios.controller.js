import * as anunciosService from './anuncios.service.js';

export async function listar(req, res, next) {
  try {
    const { rol, userId } = req.user;
    let data;
    const { isPrivilegiado } = await import('../../utils/roles.js');
    if (isPrivilegiado(rol)) data = await anunciosService.listarTodos();
    else if (rol === 'docente') data = await anunciosService.listarParaDocente(userId);
    else data = await anunciosService.listarParaPapa(userId);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}

export async function crear(req, res, next) {
  try {
    const anuncio = await anunciosService.crear({ ...req.body, creadorId: req.user.userId });
    res.status(201).json({ ok: true, data: anuncio });
  } catch (err) { next(err); }
}

export async function eliminar(req, res, next) {
  try {
    await anunciosService.eliminar(req.params.id, req.user.userId, req.user.rol);
    res.json({ ok: true, message: 'Anuncio eliminado' });
  } catch (err) {
    if (['Anuncio no encontrado', 'Sin permiso'].includes(err.message))
      return res.status(403).json({ ok: false, error: err.message });
    next(err);
  }
}
