import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware, requireRol } from '../../middleware/auth.js';
import { validateInput } from '../../middleware/validateInput.js';
import { PRIVILEGIADOS } from '../../utils/roles.js';
import * as controller from './usuarios.controller.js';

const router = Router();

router.use(authMiddleware);

router.put('/cambiar-password', controller.cambiarPassword);
router.get('/docentes', controller.listarDocentes);
router.get('/', requireRol(...PRIVILEGIADOS), controller.listarUsuarios);
router.post('/',
  requireRol(...PRIVILEGIADOS),
  [
    body('nombre').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('rol').isIn(['docente', 'papa', 'admin', 'director', 'secretaria']),
  ],
  validateInput,
  controller.crearUsuario
);
router.get('/:id', controller.obtenerUsuario);
router.put('/:id', requireRol(...PRIVILEGIADOS), controller.actualizarUsuario);
router.delete('/:id', requireRol(...PRIVILEGIADOS), controller.desactivarUsuario);

export default router;
