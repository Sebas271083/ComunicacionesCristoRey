import { Router } from 'express';
import { body } from 'express-validator';
import { validateInput } from '../../middleware/validateInput.js';
import { authMiddleware } from '../../middleware/auth.js';
import * as controller from './auth.controller.js';

const router = Router();

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
