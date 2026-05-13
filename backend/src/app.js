import './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

import authRoutes from './modules/auth/auth.routes.js';
import usuariosRoutes from './modules/usuarios/usuarios.routes.js';
import mensajesRoutes from './modules/mensajes/mensajes.routes.js';
import tareasRoutes from './modules/tareas/tareas.routes.js';
import calendarioRoutes from './modules/calendario/calendario.routes.js';
import notificacionesRoutes from './modules/notificaciones/notificaciones.routes.js';
import cursosRoutes from './modules/cursos/cursos.routes.js';
import alumnosRoutes from './modules/alumnos/alumnos.routes.js';
import anunciosRoutes from './modules/anuncios/anuncios.routes.js';

const app = express();

// Seguridad
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

// Rate limiting global
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));

// Logging
if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '10kb' }));

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, env: env.NODE_ENV }));

// Rutas por módulo
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/mensajes', mensajesRoutes);
app.use('/api/tareas', tareasRoutes);
app.use('/api/eventos', calendarioRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/cursos', cursosRoutes);
app.use('/api/alumnos', alumnosRoutes);
app.use('/api/anuncios', anunciosRoutes);

// 404 y error handler
app.use(notFound);
app.use(errorHandler);

// Arranque
app.listen(env.PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${env.PORT}`);
  console.log(`📦 Ambiente: ${env.NODE_ENV}`);
});

// Cierre limpio
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
