import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware, requireRol } from '../../middleware/auth.js';
import { validateInput } from '../../middleware/validateInput.js';
import * as controller from './alumnos.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/', requireRol('admin', 'docente', 'director', 'secretaria'), controller.listar);
router.post('/', requireRol('admin'),
  [body('nombre').trim().notEmpty(), body('cursoId').notEmpty()], validateInput,
  controller.crear);
router.put('/:id', requireRol('admin'), controller.actualizar);
router.delete('/:id', requireRol('admin'), controller.eliminar);

// Vincular/desvincular papá ↔ alumno
router.post('/vincular',
  requireRol('admin'),
  [body('alumnoId').notEmpty(), body('papaId').notEmpty()], validateInput,
  controller.vincularPapa);
router.delete('/:alumnoId/papa/:papaId', requireRol('admin'), controller.desvincularPapa);

// Papás de un curso (docentes lo usan para elegir a quién escribir)
router.get('/curso/:cursoId/papas', requireRol('docente', 'admin', 'director', 'secretaria'), controller.papasDeCurso);

export default router;
