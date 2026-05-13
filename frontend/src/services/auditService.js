import api from './api.js';

export const auditService = {
  listar: (params = {}) => api.get('/audit', { params }).then((r) => r.data.data),
};
