import api from './api.js';

export const alumnosService = {
  listar:         (cursoId) => api.get('/alumnos', { params: cursoId ? { cursoId } : {} }).then((r) => r.data.data),
  papasDeCurso:   (cursoId) => api.get(`/alumnos/curso/${cursoId}/papas`).then((r) => r.data.data),
};
