import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware, requireRol } from '../../middleware/auth.js';
import { validateInput } from '../../middleware/validateInput.js';
import { PRIVILEGIADOS } from '../../utils/roles.js';
import * as controller from './cursos.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/', controller.listarCursos);
router.post('/', requireRol(...PRIVILEGIADOS),
  [body('nombre').trim().notEmpty()], validateInput,
  controller.crearCurso);
router.delete('/:id', requireRol(...PRIVILEGIADOS), controller.eliminarCurso);

router.get('/materias', controller.listarMaterias);
router.post('/materias', requireRol(...PRIVILEGIADOS),
  [body('nombre').trim().notEmpty()], validateInput,
  controller.crearMateria);

router.post('/asignar', requireRol(...PRIVILEGIADOS),
  [body('cursoId').notEmpty(), body('docenteId').notEmpty()], validateInput,
  controller.asignarDocente);
router.delete('/asignar/:id', requireRol(...PRIVILEGIADOS), controller.quitarDocente);

router.get('/mis-cursos', requireRol('papa'), controller.cursosDelPapa);
router.get('/mis-asignaciones', requireRol('docente', ...PRIVILEGIADOS), controller.cursosDelDocente);
router.get('/ciclo/:anio', requireRol(...PRIVILEGIADOS), controller.resumenNuevoCiclo);

export default router;
