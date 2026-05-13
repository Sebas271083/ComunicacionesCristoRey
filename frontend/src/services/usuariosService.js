import api from './api.js';

export const usuariosService = {
  getDocentes: () => api.get('/usuarios/docentes').then((r) => r.data.data),
  getUsuario: (id) => api.get(`/usuarios/${id}`).then((r) => r.data.data),
};
