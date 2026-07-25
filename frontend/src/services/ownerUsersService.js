import api from './api';

const ownerUsersService = {
  getAll: () => api.get('/institutions/owner-users/').then(r => r.data),
};

export default ownerUsersService;
