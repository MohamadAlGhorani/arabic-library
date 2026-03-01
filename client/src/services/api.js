import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// Books
export const getBooks = (params) => api.get('/books', { params });
export const getBook = (id) => api.get(`/books/${id}`);
export const createBook = (data) => api.post('/books', data);
export const updateBook = (id, data) => api.put(`/books/${id}`, data);
export const deleteBook = (id) => api.delete(`/books/${id}`);

// Categories
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Reservations
export const createReservation = (data) => api.post('/reservations', data);
export const getReservations = (params) => api.get('/reservations', { params });
export const updateReservation = (id, data) => api.put(`/reservations/${id}`, data);
export const sendReminder = (id) => api.post(`/reservations/${id}/remind`);
export const extendReservation = (id, data) => api.put(`/reservations/${id}/extend`, data);

// Stats
export const getStats = (params) => api.get('/stats', { params });

// Settings
export const getSettings = (locationId) => api.get('/settings', { params: { locationId } });
export const updateSettings = (data) => api.put('/settings', data);

// Locations
export const getLocations = () => api.get('/locations');
export const createLocation = (data) => api.post('/locations', data);
export const updateLocation = (id, data) => api.put(`/locations/${id}`, data);
export const deleteLocation = (id) => api.delete(`/locations/${id}`);

// Admin Users
export const getAdmins = (params) => api.get('/admins', { params });
export const createAdmin = (data) => api.post('/admins', data);
export const updateAdmin = (id, data) => api.put(`/admins/${id}`, data);
export const toggleAdmin = (id) => api.put(`/admins/${id}/toggle`);
export const deleteAdmin = (id) => api.delete(`/admins/${id}`);

// Pages (CMS)
export const getPage = (slug) => api.get(`/pages/${slug}`);
export const updatePage = (slug, data) => api.put(`/pages/${slug}`, data);

export default api;
