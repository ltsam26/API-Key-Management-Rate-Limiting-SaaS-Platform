import api from '../api/axios';

export const loginUser = (email, password) =>
  api.post('/api/auth/login', { email, password });

export const signupUser = (email, password) =>
  api.post('/api/auth/signup', { email, password });