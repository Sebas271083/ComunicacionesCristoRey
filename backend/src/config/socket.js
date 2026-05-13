import { Server } from 'socket.io';
import { verifyToken } from './jwt.js';
import { env } from './env.js';

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  });

  // Verificar JWT en el handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token requerido'));
    try {
      socket.user = verifyToken(token);
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    // Cada usuario se une a su propia sala (su userId)
    socket.join(socket.user.userId);
  });

  return io;
}

export const getIo = () => io;
