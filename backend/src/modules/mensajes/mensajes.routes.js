import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware, requireRol, requirePermiso } from '../../middleware/auth.js';
import { validateInput } from '../../middleware/validateInput.js';
import * as controller from './mensajes.controller.js';

const router = Router();
router.use(authMiddleware);
router.use(requirePermiso('puedeChat'));

router.get('/conversaciones',  controller.getConversaciones);
router.get('/contactos',       controller.getContactosDisponibles);
router.get('/grupos-masivo',   requireRol('docente', 'admin', 'director', 'secretaria'), controller.getGruposMasivo);
router.get('/:userId',         controller.getHistorial);

router.post('/',
  [body('contenido').trim().notEmpty().isLength({ max: 1000 }), body('receptorId').notEmpty()],
  validateInput,
  controller.enviar,
);

router.post('/masivo',
  requireRol('docente', 'admin', 'director', 'secretaria'),
  [
    body('contenido').trim().notEmpty().isLength({ max: 1000 }),
    body('receptorIds').isArray({ min: 1 }),
  ],
  validateInput,
  controller.enviarMasivo,
);

router.put('/:id/read',                    controller.marcarLeido);
router.put('/conversacion/:userId/read',   controller.marcarLeidosConversacion);
router.delete('/:id',                      controller.eliminar);

export default router;
