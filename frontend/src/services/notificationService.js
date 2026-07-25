import api from './api';

const notificationService = {
  list:        () => api.get('/institutions/notifications/').then(r => r.data),
  markRead:    (id) => api.post(`/institutions/notifications/${id}/read/`).then(r => r.data),
  markAllRead: () => api.post('/institutions/notifications/read-all/').then(r => r.data),
};

export default notificationService;
