import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware, requireRol } from '../../middleware/auth.js';
import { validateInput } from '../../middleware/validateInput.js';
import * as controller from './cursos.controller.js';

const router = Router();
router.use(authMiddleware);

// Cursos
router.get('/', controller.listarCursos);
router.post('/', requireRol('admin'),
  [body('nombre').trim().notEmpty()], validateInput,
  controller.crearCurso);
router.delete('/:id', requireRol('admin'), controller.eliminarCurso);

// Materias
router.get('/materias', controller.listarMaterias);
router.post('/materias', requireRol('admin'),
  [body('nombre').trim().notEmpty()], validateInput,
  controller.crearMateria);

// Asignaciones docente ↔ curso
router.post('/asignar', requireRol('admin'),
  [body('cursoId').notEmpty(), body('docenteId').notEmpty()], validateInput,
  controller.asignarDocente);
router.delete('/asignar/:id', requireRol('admin'), controller.quitarDocente);

// Para papás: ver cursos/docentes de sus hijos
router.get('/mis-cursos', requireRol('papa'), controller.cursosDelPapa);

// Para docentes: ver sus cursos
router.get('/mis-asignaciones', requireRol('docente', 'admin'), controller.cursosDelDocente);

export default router;
