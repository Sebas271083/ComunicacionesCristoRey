import api from './api.js';

export const anunciosService = {
  listar: () => api.get('/anuncios').then((r) => r.data.data),
  crear: (data) => api.post('/anuncios', data).then((r) => r.data.data),
  eliminar: (id) => api.delete(`/anuncios/${id}`),
};
