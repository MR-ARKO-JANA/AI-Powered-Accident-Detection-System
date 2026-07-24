import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ═══ Auth ═══
export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
    updatePassword: (data) => api.patch('/auth/password', data),
};

// ═══ Accidents ═══
export const accidentAPI = {
    getAll: (params) => api.get('/accidents', { params }),
    getById: (id) => api.get(`/accidents/${id}`),
    updateStatus: (id, status) => api.patch(`/accidents/${id}/status`, { status }),
    addFeedback: (id, data) => api.patch(`/accidents/${id}/feedback`, data),
    delete: (id) => api.delete(`/accidents/${id}`),
};

// ═══ Cameras ═══
export const cameraAPI = {
    getAll: (params) => api.get('/cameras', { params }),
    getById: (id) => api.get(`/cameras/${id}`),
    create: (data) => api.post('/cameras', data),
    update: (id, data) => api.put(`/cameras/${id}`, data),
    delete: (id) => api.delete(`/cameras/${id}`),
};

// ═══ Locations ═══
export const locationAPI = {
    getAll: (params) => api.get('/locations', { params }),
    getNearby: (lat, lng) => api.get('/locations/nearby', { params: { lat, lng } }),
    create: (data) => api.post('/locations', data),
    update: (id, data) => api.put(`/locations/${id}`, data),
    delete: (id) => api.delete(`/locations/${id}`),
};

// ═══ Contacts ═══
export const contactAPI = {
    getAll: () => api.get('/contacts'),
    create: (data) => api.post('/contacts', data),
    update: (id, data) => api.put(`/contacts/${id}`, data),
    delete: (id) => api.delete(`/contacts/${id}`),
};

// ═══ Alerts ═══
export const alertAPI = {
    getAll: (params) => api.get('/alerts', { params }),
    getStatus: (accidentId) => api.get(`/alerts/${accidentId}/status`),
};

// ═══ Stats ═══
export const statsAPI = {
    getDashboard: () => api.get('/stats/dashboard'),
    getAnalytics: (days) => api.get('/stats/analytics', { params: { days } }),
    getUsers: () => api.get('/stats/users'),
};

// ═══ Audit Logs ═══
export const auditAPI = {
    getAll: (params) => api.get('/audit-logs', { params }),
};

// ═══ SOS ═══
export const sosAPI = {
    getAll: (params) => api.get('/sos', { params }),
};

export default api;