import api from './api';

const PROGRESS_BASE = '/progress';

export const progressService = {
    // Get all progress records (with filters)
    getAll: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        const url = params.toString() ? `${PROGRESS_BASE}/?${params}` : PROGRESS_BASE;
        const response = await api.get(url);
        return response.data;
    },

    // Get progress for a specific student
    getByStudent: async (studentId) => {
        const response = await api.get(`${PROGRESS_BASE}/student/${studentId}/`);
        return response.data;
    },

    // Get progress for a specific activity
    getByActivity: async (activityId) => {
        const response = await api.get(`${PROGRESS_BASE}/activity/${activityId}/`);
        return response.data;
    },

    // Get progress for a student on a specific activity
    getByStudentAndActivity: async (studentId, activityId) => {
        const response = await api.get(`${PROGRESS_BASE}/?student_id=${studentId}&activity_id=${activityId}`);
        return response.data;
    },

    // Create or update progress (upsert)
    upsert: async (progressData) => {
        const response = await api.post(PROGRESS_BASE, progressData);
        return response.data;
    },

    // Update progress value
    update: async (id, value) => {
        const response = await api.put(`${PROGRESS_BASE}/${id}/`, { value });
        return response.data;
    },

    // Delete progress record
    delete: async (id) => {
        const response = await api.delete(`${PROGRESS_BASE}/${id}/`);
        return response.data;
    },

    // Bulk update progress for an activity
    bulkUpdate: async (activityId, progressUpdates) => {
        const response = await api.post(`${PROGRESS_BASE}/activities/${activityId}/bulk_update_progress/`, { updates: progressUpdates });
        return response.data;
    }
};