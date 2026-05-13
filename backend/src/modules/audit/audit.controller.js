import * as auditService from './audit.service.js';

export async function listar(req, res, next) {
  try {
    const data = await auditService.listar(req.query);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
}
