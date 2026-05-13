import * as authService from './auth.service.js';

export async function registrar(req, res, next) {
  try {
    const resultado = await authService.registrar(req.body);
    res.status(201).json({ ok: true, data: resultado });
  } catch (err) {
    if (err.message === 'El email ya está registrado') {
      return res.status(409).json({ ok: false, error: err.message });
    }
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const resultado = await authService.login(req.body);
    res.json({ ok: true, data: resultado });
  } catch (err) {
    if (err.message === 'Credenciales inválidas') {
      return res.status(401).json({ ok: false, error: err.message });
    }
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ ok: false, error: 'refreshToken requerido' });
    const resultado = await authService.refreshToken(refreshToken);
    res.json({ ok: true, data: resultado });
  } catch {
    res.status(401).json({ ok: false, error: 'Refresh token inválido' });
  }
}

export async function getMe(req, res, next) {
  try {
    const usuario = await authService.getMe(req.user.userId);
    res.json({ ok: true, data: usuario });
  } catch (err) {
    next(err);
  }
}

export function logout(_req, res) {
  res.json({ ok: true, message: 'Sesión cerrada' });
}
