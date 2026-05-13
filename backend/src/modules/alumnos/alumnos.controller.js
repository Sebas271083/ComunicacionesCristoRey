import * as alumnosService from './alumnos.service.js';

export async function listar(req, res, next) {
  try {
    res.json({ ok: true, data: await alumnosService.listar(req.query.cursoId) });
  } catch (err) { next(err); }
}

export async function crear(req, res, next) {
  try {
    res.status(201).json({ ok: true, data: await alumnosService.crear(req.body) });
  } catch (err) { next(err); }
}

export async function actualizar(req, res, next) {
  try {
    res.json({ ok: true, data: await alumnosService.actualizar(req.params.id, req.body) });
  } catch (err) { next(err); }
}

export async function eliminar(req, res, next) {
  try {
    res.json({ ok: true, data: await alumnosService.eliminar(req.params.id) });
  } catch (err) { next(err); }
}

export async function vincularPapa(req, res, next) {
  try {
    res.status(201).json({ ok: true, data: await alumnosService.vincularPapa(req.body) });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ ok: false, error: 'Vínculo ya existe' });
    if (err.message === 'Usuario no es papá') return res.status(400).json({ ok: false, error: err.message });
    next(err);
  }
}

export async function desvincularPapa(req, res, next) {
  try {
    await alumnosService.desvincularPapa({ alumnoId: req.params.alumnoId, papaId: req.params.papaId });
    res.json({ ok: true, message: 'Vínculo eliminado' });
  } catch (err) { next(err); }
}

export async function papasDeCurso(req, res, next) {
  try {
    res.json({ ok: true, data: await alumnosService.papasDeCurso(req.params.cursoId) });
  } catch (err) { next(err); }
}
