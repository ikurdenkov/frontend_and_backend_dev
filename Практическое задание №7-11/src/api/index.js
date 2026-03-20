import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post('http://localhost:3000/api/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  register: (email, password, firstName, lastName) =>
    apiClient.post('/auth/register', { email, password, first_name: firstName, last_name: lastName }).then(res => res.data),
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }).then(res => res.data),
  getMe: () =>
    apiClient.get('/auth/me').then(res => res.data),
  getProducts: () =>
    apiClient.get('/products').then(res => res.data),
  getProduct: (id) =>
    apiClient.get(`/products/${id}`).then(res => res.data),
  createProduct: (product) =>
    apiClient.post('/products', product).then(res => res.data),
  updateProduct: (id, product) =>
    apiClient.patch(`/products/${id}`, product).then(res => res.data),
  deleteProduct: (id) =>
    apiClient.delete(`/products/${id}`),
  getUsers: () =>
    apiClient.get('/users').then(res => res.data),
  getUser: (id) =>
    apiClient.get(`/users/${id}`).then(res => res.data),
  updateUser: (id, userData) =>
    apiClient.patch(`/users/${id}`, userData).then(res => res.data),
  deleteUser: (id) =>
    apiClient.delete(`/users/${id}`),
};