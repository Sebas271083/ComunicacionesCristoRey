import api from './api.js';

export const authService = {
  login: (data) => api.post('/auth/login', data).then((r) => r.data.data),
  register: (data) => api.post('/auth/register', data).then((r) => r.data.data),
  getMe: () => api.get('/auth/me').then((r) => r.data.data),
  logout: () => api.post('/auth/logout'),
};
