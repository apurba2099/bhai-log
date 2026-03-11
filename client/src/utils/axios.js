// utils/axios.js
import axios from 'axios';

const getBaseURL = () => {
  const envURL = import.meta.env.VITE_SERVER_URL;
  const browserHost = window.location.hostname;

  if (envURL) {
    try {
      const envHost = new URL(envURL).hostname;
      if (
        (envHost === 'localhost' || envHost === '127.0.0.1') &&
        browserHost !== 'localhost' &&
        browserHost !== '127.0.0.1'
      ) {
        // skip env, use auto-detect
      } else {
        return `${envURL}/api`;
      }
    } catch { /* fall through */ }
  }

  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:5000/api`;
};

const api = axios.create({ baseURL: getBaseURL() });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[API]', err.config?.url, err.response?.status, err.response?.data);
    return Promise.reject(err);
  }
);

export default api;
