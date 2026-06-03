import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wewash_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
