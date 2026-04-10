import api from '../api/axios';

export const getAnalytics = (projectId) =>
  api.get(`/api/analytics/${projectId}`);