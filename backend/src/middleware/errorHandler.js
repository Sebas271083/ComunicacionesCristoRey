export function errorHandler(err, _req, res, _next) {
  console.error('[Error]', err.message);
  res.status(500).json({ ok: false, error: 'Error interno del servidor' });
}

export function notFound(_req, res) {
  res.status(404).json({ ok: false, error: 'Ruta no encontrada' });
}
