import * as notifService from './notificaciones.service.js';

export async function suscribir(req, res, next) {
  try {
    const { endpoint, p256dh, auth } = req.body;
    const data = await notifService.suscribir({ usuarioId: req.user.userId, endpoint, p256dh, auth });
    res.status(201).json({ ok: true, data });
  } catch (err) { next(err); }
}

export async function desuscribir(req, res, next) {
  try {
    await notifService.desuscribir(req.user.userId);
    res.json({ ok: true, message: 'Desuscrito' });
  } catch (err) { next(err); }
}

export async function enviarNotificacion(req, res, next) {
  try {
    const { usuarioId, titulo, cuerpo, url } = req.body;
    const resultado = await notifService.enviarNotificacion(usuarioId, { title: titulo, body: cuerpo, url });
    res.json({ ok: true, data: { enviado: resultado } });
  } catch (err) { next(err); }
}
