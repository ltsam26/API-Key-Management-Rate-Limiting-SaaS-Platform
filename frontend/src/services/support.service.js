import api from '../api/axios';

export const submitTicket = (data) => api.post('/api/support/submit', data);
