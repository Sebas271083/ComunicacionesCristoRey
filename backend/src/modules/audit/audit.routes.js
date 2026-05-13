import { Router } from 'express';
import { authMiddleware, requireRol } from '../../middleware/auth.js';
import { PRIVILEGIADOS } from '../../utils/roles.js';
import * as controller from './audit.controller.js';

const router = Router();
router.use(authMiddleware);
router.get('/', requireRol(...PRIVILEGIADOS), controller.listar);

export default router;
