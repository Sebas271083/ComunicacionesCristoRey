import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware, requireRol } from '../../middleware/auth.js';
import { validateInput } from '../../middleware/validateInput.js';
import { PRIVILEGIADOS } from '../../utils/roles.js';
import * as controller from './alumnos.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/', requireRol('admin', 'docente', 'director', 'secretaria'), controller.listar);
router.post('/', requireRol(...PRIVILEGIADOS),
  [body('nombre').trim().notEmpty(), body('cursoId').notEmpty()], validateInput,
  controller.crear);
router.put('/:id', requireRol(...PRIVILEGIADOS), controller.actualizar);
router.delete('/:id', requireRol(...PRIVILEGIADOS), controller.eliminar);

router.post('/vincular',
  requireRol(...PRIVILEGIADOS),
  [body('alumnoId').notEmpty(), body('papaId').notEmpty()], validateInput,
  controller.vincularPapa);
router.delete('/:alumnoId/papa/:papaId', requireRol(...PRIVILEGIADOS), controller.desvincularPapa);

router.get('/curso/:cursoId/papas', requireRol('docente', ...PRIVILEGIADOS), controller.papasDeCurso);

export default router;
