import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware, requireRol } from '../../middleware/auth.js';
import { validateInput } from '../../middleware/validateInput.js';
import { env } from '../../config/env.js';
import * as controller from './notificaciones.controller.js';

const router = Router();

// Pública: el frontend necesita la public key para suscribirse
router.get('/vapid-public-key', (_req, res) => {
  res.json({ ok: true, data: env.VAPID_PUBLIC_KEY });
});

router.use(authMiddleware);

router.post(
  '/subscribe',
  [
    body('endpoint').notEmpty(),
    body('p256dh').notEmpty(),
    body('auth').notEmpty(),
  ],
  validateInput,
  controller.suscribir
);
router.delete('/subscribe', controller.desuscribir);
router.post('/send', requireRol('admin', 'docente'), controller.enviarNotificacion);

export default router;
