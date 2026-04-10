import api from '../api/axios';

export const sendAIMessage = (message, history = []) =>
  api.post('/api/ai/chat', { message, history });

export const getAIContext = () => api.get('/api/ai/context');
