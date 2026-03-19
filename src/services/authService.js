import api from './api';

const authService = {
    async login(username, password) {
        const response = await api.post('/auth/login', { username, password });
        const user = response.data;
        localStorage.setItem('user', JSON.stringify(user));
        return user;
    },

    async register(username, password) {
        try {
            const response = await api.post('/auth/register', { username, password });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error al registrar usuario');
        }
    },

    logout() {
        localStorage.removeItem('user');
    },

    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    async getMe() {
        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error al obtener información del usuario');
        }
    }
};

export default authService; 