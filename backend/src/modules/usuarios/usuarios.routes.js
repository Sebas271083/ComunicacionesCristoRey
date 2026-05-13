import { Router } from 'express';
import { authMiddleware, requireRol } from '../../middleware/auth.js';
import * as controller from './usuarios.controller.js';

const router = Router();

router.use(authMiddleware);

router.put('/cambiar-password', controller.cambiarPassword);
router.get('/docentes', controller.listarDocentes);
router.get('/', requireRol('admin'), controller.listarUsuarios);
router.get('/:id', controller.obtenerUsuario);
router.delete('/:id', requireRol('admin'), controller.desactivarUsuario);

export default router;
