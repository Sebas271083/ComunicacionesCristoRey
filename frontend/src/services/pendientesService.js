import api from './api.js';

export const pendientesService = {
  listar: () => Promise.all([
    api.get('/tareas/pendientes').then((r) => r.data.data.map((t) => ({ ...t, _tipo: 'tarea' }))),
    api.get('/anuncios/pendientes').then((r) => r.data.data.map((a) => ({ ...a, _tipo: 'anuncio' }))),
    api.get('/eventos/pendientes').then((r) => r.data.data.map((e) => ({ ...e, _tipo: 'evento' }))),
  ]).then(([tareas, anuncios, eventos]) => ({ tareas, anuncios, eventos })),

  aprobarTarea:   (id) => api.put(`/tareas/${id}/aprobar`).then((r) => r.data.data),
  aprobarAnuncio: (id) => api.put(`/anuncios/${id}/aprobar`).then((r) => r.data.data),
  aprobarEvento:  (id) => api.put(`/eventos/${id}/aprobar`).then((r) => r.data.data),

  eliminarTarea:   (id) => api.delete(`/tareas/${id}`),
  eliminarAnuncio: (id) => api.delete(`/anuncios/${id}`),
  eliminarEvento:  (id) => api.delete(`/eventos/${id}`),
};
