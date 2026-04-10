import api from '../api/axios';

export const getProjects = () => api.get('/api/projects');
export const createProject = (name) => api.post('/api/projects', { name });