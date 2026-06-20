import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
};

export const profilesAPI = {
  submit: (data) => api.post('/api/profiles/submit', data),
  fetchProfile: (platform, username) => api.post('/api/profiles/fetch-profile', { platform, username }),
  myProfiles: () => api.get('/api/profiles/my'),
  allProfiles: () => api.get('/api/profiles/all'),
  getProfile: (id) => api.get(`/api/profiles/${id}`),
  deleteProfile: (id) => api.delete(`/api/profiles/${id}`),
};

export const analysisAPI = {
  analyze: (profileId) => api.post(`/api/analysis/analyze/${profileId}`),
  getStats: () => api.get('/api/analysis/stats'),
};

export const reportsAPI = {
  getByProfile: (profileId) => api.get(`/api/reports/profile/${profileId}`),
  getAll: () => api.get('/api/reports/all'),
  getById: (id) => api.get(`/api/reports/${id}`),
};

export default api;
