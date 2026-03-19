import axios from 'axios';

const getStoredUser = () => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return null;

    try {
        return JSON.parse(rawUser);
    } catch (error) {
        localStorage.removeItem('user');
        return null;
    }
};

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
    (config) => {
        const user = getStoredUser();
        if (user?.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
                window.location.assign('/login');
            }
        }
        return Promise.reject(error);
    }
);

export default api;  