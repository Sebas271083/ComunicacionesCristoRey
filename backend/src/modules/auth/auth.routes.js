import { Router } from 'express';
import { body } from 'express-validator';
import { validateInput } from '../../middleware/validateInput.js';
import { authMiddleware } from '../../middleware/auth.js';
import * as controller from './auth.controller.js';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Contraseña mínimo 6 caracteres'),
    body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
    body('rol').isIn(['papa', 'docente', 'admin']).withMessage('Rol inválido'),
  ],
  validateInput,
  controller.registrar
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Contraseña requerida'),
  ],
  validateInput,
  controller.login
);

router.post('/refresh', controller.refresh);
router.post('/logout', authMiddleware, controller.logout);
router.get('/me', authMiddleware, controller.getMe);

export default router;
