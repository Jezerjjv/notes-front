import api from './api';

export const usersService = {
    getAll: async () => {
        const response = await api.get('/users');
        return response.data;
    },

    create: async (userData, isAdmin) => {
        const response = await api.post('/users', { ...userData, isAdmin });
        return response.data;
    },

    update: async (id, userData, requestingUserIsAdmin) => {
        const body = { ...userData };
        if (typeof requestingUserIsAdmin !== 'undefined') {
            body.requestingUserIsAdmin = requestingUserIsAdmin;
        }
        const response = await api.put(`/users/${id}`, body);
        return response.data;
    },

    delete: async (id, isAdmin) => {
        const response = await api.delete(`/users/${id}`, { data: { isAdmin } });
        return response.data;
    }
}; 