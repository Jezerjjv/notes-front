import api from './api';

export const notesService = {
    getAll: async () => {
        const response = await api.get('/notes');
        return response.data;
    },

    getNote: async (id) => {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await api.get(`/notes/${id}`, {
            params: { isAdmin: user?.isAdmin === 1 ? 'true' : 'false' }
        });
        return response.data;
    },

    create: async (noteData) => {
        const response = await api.post('/notes', noteData);
        return response.data;
    },

    update: async (id, noteData) => {
        if (noteData.isProjectUpdate) {
            return await api.put(`/notes/global`, noteData);
        } else {
            return await api.put(`/notes/${id}`, noteData);
        }
    },

    delete: async (id) => {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await api.delete(`/notes/${id}`, {
            data: { isAdmin: user?.isAdmin === 1 }
        });
        return response.data;
    },

    addAttachment: async (noteId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/notes/${noteId}/attachments`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
}; 