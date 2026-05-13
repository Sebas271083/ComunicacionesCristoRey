import api from './api.js';

export const usuariosService = {
  listar:       ()           => api.get('/usuarios').then((r) => r.data.data),
  getDocentes:  ()           => api.get('/usuarios/docentes').then((r) => r.data.data),
  getUsuario:   (id)         => api.get(`/usuarios/${id}`).then((r) => r.data.data),
  crear:        (data)       => api.post('/usuarios', data).then((r) => r.data.data),
  desactivar:   (id)         => api.delete(`/usuarios/${id}`).then((r) => r.data.data),
};
