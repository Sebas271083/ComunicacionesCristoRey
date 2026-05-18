import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware, requireRol } from '../../middleware/auth.js';
import { validateInput } from '../../middleware/validateInput.js';
import * as controller from './tareas.controller.js';

const router = Router();
router.use(authMiddleware);

const PUEDE_PUBLICAR   = ['docente', 'admin', 'director', 'secretaria'];
const PUEDE_APROBAR    = ['admin', 'director', 'secretaria'];

router.get('/pendientes', requireRol(...PUEDE_APROBAR), controller.listarPendientes);
router.get('/', controller.listar);
router.post(
  '/',
  requireRol(...PUEDE_PUBLICAR),
  [
    body('titulo').trim().notEmpty().withMessage('Título requerido'),
    body('fechaVencimiento').isISO8601().withMessage('Fecha inválida'),
  ],
  validateInput,
  controller.crear,
);
router.put('/:id',          requireRol(...PUEDE_PUBLICAR), controller.actualizar);
router.delete('/:id',       requireRol(...PUEDE_PUBLICAR), controller.eliminar);
router.put('/:id/aprobar',  requireRol(...PUEDE_APROBAR), controller.aprobar);
router.put('/:id/complete', controller.toggleCompletada);

export default router;
