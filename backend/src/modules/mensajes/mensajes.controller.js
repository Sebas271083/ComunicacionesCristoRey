import * as mensajesService from './mensajes.service.js';
import { getIo } from '../../config/socket.js';

export async function getConversaciones(req, res, next) {
  try {
    res.json({ ok: true, data: await mensajesService.getConversaciones(req.user.userId) });
  } catch (err) { next(err); }
}

export async function getHistorial(req, res, next) {
  try {
    const { limit, before } = req.query;
    const data = await mensajesService.getHistorial(
      req.user.userId, req.params.userId,
      limit ? parseInt(limit) : 50, before
    );
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}

export async function enviar(req, res, next) {
  try {
    const mensaje = await mensajesService.enviar({
      contenido: req.body.contenido,
      enviadorId: req.user.userId,
      receptorId: req.body.receptorId,
    });
    // Notificar al receptor en tiempo real
    getIo()?.to(req.body.receptorId).emit('nuevo_mensaje', mensaje);
    res.status(201).json({ ok: true, data: mensaje });
  } catch (err) {
    if (err.message === 'Receptor no encontrado') return res.status(404).json({ ok: false, error: err.message });
    next(err);
  }
}

export async function enviarMasivo(req, res, next) {
  try {
    const result = await mensajesService.enviarMasivo({
      contenido: req.body.contenido,
      enviadorId: req.user.userId,
      receptorIds: req.body.receptorIds,
    });
    res.status(201).json({ ok: true, data: result });
  } catch (err) {
    if (err.message === 'Sin destinatarios') return res.status(400).json({ ok: false, error: err.message });
    next(err);
  }
}

export async function marcarLeido(req, res, next) {
  try {
    res.json({ ok: true, data: await mensajesService.marcarLeido(req.params.id, req.user.userId) });
  } catch (err) {
    if (['Mensaje no encontrado', 'Sin permiso'].includes(err.message))
      return res.status(403).json({ ok: false, error: err.message });
    next(err);
  }
}

export async function marcarLeidosConversacion(req, res, next) {
  try {
    res.json({ ok: true, data: await mensajesService.marcarLeidosConversacion(req.params.userId, req.user.userId) });
  } catch (err) { next(err); }
}

export async function eliminar(req, res, next) {
  try {
    await mensajesService.eliminar(req.params.id, req.user.userId);
    res.json({ ok: true, message: 'Mensaje eliminado' });
  } catch (err) {
    if (['Mensaje no encontrado', 'Sin permiso'].includes(err.message))
      return res.status(403).json({ ok: false, error: err.message });
    next(err);
  }
}

export async function getContactosDisponibles(req, res, next) {
  try {
    const data = await mensajesService.contactosDisponibles(req.user.userId, req.user.rol);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}

export async function getGruposMasivo(req, res, next) {
  try {
    const data = await mensajesService.gruposMasivo(req.user.userId, req.user.rol);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}
