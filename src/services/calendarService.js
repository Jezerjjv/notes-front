import api from './api';

/**
 * @param {number} year
 * @param {number} month 1-12 (enero = 1)
 */
export const calendarService = {
    getMonth: async (year, month) => {
        const response = await api.get('/calendar/month', {
            params: { year, month },
        });
        return response.data;
    },

    createEntry: async ({ workDate, projectId, hours, description }) => {
        const response = await api.post('/calendar/entries', {
            workDate,
            projectId,
            hours,
            description: description ?? '',
        });
        return response.data;
    },

    updateEntry: async (id, payload) => {
        const response = await api.put(`/calendar/entries/${id}`, payload);
        return response.data;
    },

    deleteEntry: async (id) => {
        const response = await api.delete(`/calendar/entries/${id}`);
        return response.data;
    },

    /** status: 'normal' | 'vacaciones' | 'festivo' */
    setDayStatus: async (workDate, status) => {
        const response = await api.put('/calendar/day-status', { workDate, status });
        return response.data;
    },
};
