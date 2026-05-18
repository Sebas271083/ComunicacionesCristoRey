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

export async function crearUsuario(req, res, next) {
  try {
    const usuario = await usuariosService.crearUsuario(req.body);
    res.status(201).json({ ok: true, data: usuario });
  } catch (err) {
    if (err.message === 'El email ya está registrado') return res.status(409).json({ ok: false, error: err.message });
    next(err);
  }
}

export async function actualizarUsuario(req, res, next) {
  try {
    const usuario = await usuariosService.actualizarUsuario(req.params.id, req.body);
    res.json({ ok: true, data: usuario });
  } catch (err) {
    if (err.message === 'El email ya está registrado') return res.status(409).json({ ok: false, error: err.message });
    next(err);
  }
}

export async function actualizarPermisos(req, res, next) {
  try {
    res.json({ ok: true, data: await usuariosService.actualizarPermisos(req.params.id, req.body) });
  } catch (err) { next(err); }
}

export async function desactivarUsuario(req, res, next) {
  try {
    const usuario = await usuariosService.desactivarUsuario(req.params.id);
    res.json({ ok: true, data: usuario });
  } catch (err) { next(err); }
}
