import api from './api.js';

export const cursosService = {
  listar: () => api.get('/cursos').then((r) => r.data.data),
  misCursos: () => api.get('/cursos/mis-cursos').then((r) => r.data.data),         // papa
  misAsignaciones: () => api.get('/cursos/mis-asignaciones').then((r) => r.data.data), // docente
  listarMaterias: () => api.get('/cursos/materias').then((r) => r.data.data),
};
