import * as usuariosService from './usuarios.service.js';

export async function cambiarPassword(req, res, next) {
  try {
    await usuariosService.cambiarPassword(req.user.userId, req.body);
    res.json({ ok: true, message: 'Contraseña actualizada' });
  } catch (err) {
    if (err.message === 'Contraseña actual incorrecta') return res.status(400).json({ ok: false, error: err.message });
    next(err);
  }
}

export async function listarDocentes(req, res, next) {
  try {
    const docentes = await usuariosService.listarDocentes();
    res.json({ ok: true, data: docentes });
  } catch (err) { next(err); }
}

export async function listarUsuarios(req, res, next) {
  try {
    const usuarios = await usuariosService.listarUsuarios();
    res.json({ ok: true, data: usuarios });
  } catch (err) { next(err); }
}

export async function obtenerUsuario(req, res, next) {
  try {
    const usuario = await usuariosService.obtenerUsuario(req.params.id);
    res.json({ ok: true, data: usuario });
  } catch (err) {
    if (err.message === 'Usuario no encontrado') return res.status(404).json({ ok: false, error: err.message });
    next(err);
  }
}

export async function desactivarUsuario(req, res, next) {
  try {
    const usuario = await usuariosService.desactivarUsuario(req.params.id);
    res.json({ ok: true, data: usuario });
  } catch (err) { next(err); }
}
