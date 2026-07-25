import api from './api';

const maintenanceService = {
  getAuditLogs:         (params) => api.get('/institutions/audit-logs/', { params }).then(r => r.data),
  getLoginActivity:     (params) => api.get('/institutions/login-activity/', { params }).then(r => r.data),
  getInstitutionDetails: () => api.get('/institutions/institution-details/').then(r => r.data),
  downloadReport:       (type = 'csv') => api.get('/institutions/maintenance-report/', { params: { type }, responseType: 'blob' }),
};

export default maintenanceService;
