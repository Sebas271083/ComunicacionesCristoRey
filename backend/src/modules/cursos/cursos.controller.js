import * as cursosService from './cursos.service.js';

export async function listarCursos(req, res, next) {
  try {
    res.json({ ok: true, data: await cursosService.listarCursos() });
  } catch (err) { next(err); }
}

export async function crearCurso(req, res, next) {
  try {
    res.status(201).json({ ok: true, data: await cursosService.crearCurso(req.body) });
  } catch (err) { next(err); }
}

export async function eliminarCurso(req, res, next) {
  try {
    res.json({ ok: true, data: await cursosService.eliminarCurso(req.params.id) });
  } catch (err) { next(err); }
}

export async function listarMaterias(req, res, next) {
  try {
    res.json({ ok: true, data: await cursosService.listarMaterias() });
  } catch (err) { next(err); }
}

export async function crearMateria(req, res, next) {
  try {
    res.status(201).json({ ok: true, data: await cursosService.crearMateria(req.body) });
  } catch (err) { next(err); }
}

export async function asignarDocente(req, res, next) {
  try {
    res.status(201).json({ ok: true, data: await cursosService.asignarDocente(req.body) });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ ok: false, error: 'Asignación ya existe' });
    next(err);
  }
}

export async function quitarDocente(req, res, next) {
  try {
    res.json({ ok: true, data: await cursosService.quitarDocente(req.params.id) });
  } catch (err) { next(err); }
}

export async function cursosDelPapa(req, res, next) {
  try {
    res.json({ ok: true, data: await cursosService.cursosDelPapa(req.user.userId) });
  } catch (err) { next(err); }
}

export async function cursosDelDocente(req, res, next) {
  try {
    res.json({ ok: true, data: await cursosService.cursosDelDocente(req.user.userId) });
  } catch (err) { next(err); }
}

export async function resumenNuevoCiclo(req, res, next) {
  try {
    const anio = parseInt(req.params.anio);
    if (!anio || anio < 2020 || anio > 2100) return res.status(400).json({ ok: false, error: 'Año inválido' });
    res.json({ ok: true, data: await cursosService.resumenNuevoCiclo(anio) });
  } catch (err) { next(err); }
}
