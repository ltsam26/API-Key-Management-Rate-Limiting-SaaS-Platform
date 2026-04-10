import api from '../api/axios';

export const getSystemStats = () => api.get('/api/admin/system-stats');
export const getUsers = () => api.get('/api/admin/users');
export const getProjects = () => api.get('/api/admin/projects');
export const getApiKeys = () => api.get('/api/admin/api-keys');
export const getUsageLogs = () => api.get('/api/admin/usage-logs');
export const toggleApiKey = (id, activate) => api.post(`/api/admin/api-keys/${id}/toggle`, { activate });
