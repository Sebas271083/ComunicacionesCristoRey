import api from './api.js';

export const messageService = {
  getConversaciones:       ()       => api.get('/mensajes/conversaciones').then((r) => r.data.data),
  getHistorial:            (userId, params) => api.get(`/mensajes/${userId}`, { params }).then((r) => r.data.data),
  enviar:                  (data)   => api.post('/mensajes', data).then((r) => r.data.data),
  enviarMasivo:            (data)   => api.post('/mensajes/masivo', data).then((r) => r.data.data),
  marcarLeido:             (id)     => api.put(`/mensajes/${id}/read`),
  marcarLeidosConversacion:(userId) => api.put(`/mensajes/conversacion/${userId}/read`),
  eliminar:                (id)     => api.delete(`/mensajes/${id}`),
  getContactos:            ()       => api.get('/mensajes/contactos').then((r) => r.data.data),
  getGruposMasivo:         ()       => api.get('/mensajes/grupos-masivo').then((r) => r.data.data),
};
