import api from './api.js';

export const taskService = {
  listar: (params) => api.get('/tareas', { params }).then((r) => r.data.data),
  crear: (data) => api.post('/tareas', data).then((r) => r.data.data),
  actualizar: (id, data) => api.put(`/tareas/${id}`, data).then((r) => r.data.data),
  eliminar: (id) => api.delete(`/tareas/${id}`),
  toggleCompletada: (id) => api.put(`/tareas/${id}/complete`).then((r) => r.data.data),
};
