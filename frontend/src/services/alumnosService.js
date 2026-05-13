import api from './api.js';

export const alumnosService = {
  listar:         (cursoId)              => api.get('/alumnos', { params: cursoId ? { cursoId } : {} }).then((r) => r.data.data),
  crear:          (data)                 => api.post('/alumnos', data).then((r) => r.data.data),
  actualizar:     (id, data)             => api.put(`/alumnos/${id}`, data).then((r) => r.data.data),
  eliminar:       (id)                   => api.delete(`/alumnos/${id}`).then((r) => r.data.data),
  vincularPapa:   (alumnoId, papaId)     => api.post('/alumnos/vincular', { alumnoId, papaId }).then((r) => r.data.data),
  desvincularPapa:(alumnoId, papaId)     => api.delete(`/alumnos/${alumnoId}/papa/${papaId}`).then((r) => r.data.data),
  papasDeCurso:   (cursoId)              => api.get(`/alumnos/curso/${cursoId}/papas`).then((r) => r.data.data),
};
