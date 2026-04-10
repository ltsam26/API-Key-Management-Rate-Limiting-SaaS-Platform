import api from '../api/axios';

export const getKeys = () => api.get('/api/keys/list');
export const generateKey = (projectId, data) => api.post('/api/keys/generate', { projectId, ...data });
export const revokeKey = (keyId) => api.post(`/api/keys/revoke/${keyId}`);
export const rotateKey = (keyId) => api.post(`/api/keys/rotate/${keyId}`);
export const setSecurity = (keyId, allowedIps) => api.post(`/api/keys/${keyId}/set-ip-restriction`, { allowedIps });
export const setSettings = (keyId, data) => api.post(`/api/keys/${keyId}/set-permissions`, data);
export const getKeyUsage = (keyId) => api.get(`/api/keys/${keyId}/usage`);
export const getKeyLogs = (keyId) => api.get(`/api/keys/${keyId}/logs`);