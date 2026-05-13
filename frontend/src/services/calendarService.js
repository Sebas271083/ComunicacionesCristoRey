import api from './api.js';

export const calendarService = {
  listar: (params) => api.get('/eventos', { params }).then((r) => r.data.data),
  crear: (data) => api.post('/eventos', data).then((r) => r.data.data),
  actualizar: (id, data) => api.put(`/eventos/${id}`, data).then((r) => r.data.data),
  eliminar: (id) => api.delete(`/eventos/${id}`),
};
