import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`, 
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Interceptor de Request - Agrega el token automáticamente
axiosInstance.interceptors.request.use(
  (config) => {
    // No agregar token si es endpoint de crear conversación
    const isCreateConversation = config.url?.includes('/conversations/v0') && config.method === 'post';
    if (isCreateConversation) {
      // No modificar headers
      return config;
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Interceptor de Response - Maneja errores 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el token es inválido o expiró (401 Unauthorized)
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Limpiar localStorage en ambos casos
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('customer_id');
      localStorage.removeItem('auth'); // Elimina también el objeto 'auth' JSON
      // Redirigir al login
      window.location.href = '/auth/signin';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;