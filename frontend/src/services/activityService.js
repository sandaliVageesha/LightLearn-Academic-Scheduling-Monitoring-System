import api from './api';

const ACTIVITY_BASE = '/activities';

export const activityService = {
    // Get all activities (optionally filter by course)
    getAll: async (courseId = null, status = null) => {
        const params = new URLSearchParams();
        if (courseId) params.append('courseId', courseId);
        if (status && status !== 'all') params.append('status', status);
        
        const url = params.toString() ? `${ACTIVITY_BASE}/?${params}` : ACTIVITY_BASE;
        const response = await api.get(url);
        return response.data;
    },

    // Get activity by ID with progress
    getById: async (id) => {
        const response = await api.get(`${ACTIVITY_BASE}/${id}/`);
        return response.data;
    },

    // Create new activity
    create: async (activityData) => {
        const response = await api.post(ACTIVITY_BASE, activityData);
        return response.data;
    },

    // Update existing activity
    update: async (id, activityData) => {
        const response = await api.put(`${ACTIVITY_BASE}/${id}/`, activityData);
        return response.data;
    },

    // Delete activity
    delete: async (id) => {
        const response = await api.delete(`${ACTIVITY_BASE}/${id}/`);
        return response.data;
    },

    // Get activities with progress for a specific student
    getWithProgressForStudent: async (studentId, courseId = null) => {
        const params = new URLSearchParams();
        if (courseId) params.append('courseId', courseId);
        const url = params.toString() 
            ? `${ACTIVITY_BASE}/student/${studentId}/?${params}`
            : `${ACTIVITY_BASE}/student/${studentId}/`;
        const response = await api.get(url);
        return response.data;
    },

    // Get all activities for a course with progress for all students
    getCourseActivitiesWithProgress: async (courseId) => {
        const response = await api.get(`${ACTIVITY_BASE}/course/${courseId}/progress`);
        return response.data;
    },

    // Get progress summary for an activity
    getProgressSummary: async (activityId) => {
        const response = await api.get(`${ACTIVITY_BASE}/${activityId}/progress_summary/`);
        return response.data;
    },

    // Bulk update progress for an activity
    bulkUpdateProgress: async (activityId, updates) => {
        const response = await api.post(`${ACTIVITY_BASE}/${activityId}/bulk_update_progress/`, { updates });
        return response.data;
    }
};