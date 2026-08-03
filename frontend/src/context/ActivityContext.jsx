import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { activityService } from '../services/activityService';
import { progressService } from '../services/progressService';

const ActivityContext = createContext();

const initialState = {
    activities: [],
    selectedActivity: null,
    loading: false,
    error: null,
    progressData: {},
    filters: {
        courseId: null,
        status: 'all',
        search: ''
    }
};

function activityReducer(state, action) {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_ACTIVITIES':
            return { ...state, activities: action.payload, loading: false };
        case 'SET_SELECTED_ACTIVITY':
            return { ...state, selectedActivity: action.payload };
        case 'ADD_ACTIVITY':
            return {
                ...state,
                activities: [action.payload, ...state.activities],
                loading: false
            };
        case 'UPDATE_ACTIVITY':
            return {
                ...state,
                activities: state.activities.map(a =>
                    a.id === action.payload.id ? action.payload : a
                ),
                selectedActivity: state.selectedActivity?.id === action.payload.id
                    ? action.payload
                    : state.selectedActivity,
                loading: false
            };
        case 'REMOVE_ACTIVITY':
            return {
                ...state,
                activities: state.activities.filter(a => a.id !== action.payload),
                selectedActivity: state.selectedActivity?.id === action.payload
                    ? null
                    : state.selectedActivity,
                loading: false
            };
        case 'SET_PROGRESS':
            return {
                ...state,
                progressData: {
                    ...state.progressData,
                    [action.payload.activityId]: action.payload.data
                }
            };
        case 'UPDATE_PROGRESS':
            const { studentId, activityId, value } = action.payload;
            const existing = state.progressData[activityId] || [];
            const updated = existing.map(p =>
                p.students_id === studentId ? { ...p, value } : p
            );
            if (!existing.find(p => p.students_id === studentId)) {
                updated.push({ students_id: studentId, activities_id: activityId, value });
            }
            return {
                ...state,
                progressData: {
                    ...state.progressData,
                    [activityId]: updated
                }
            };
        case 'SET_FILTERS':
            return { ...state, filters: { ...state.filters, ...action.payload } };
        case 'CLEAR_ERROR':
            return { ...state, error: null };
        default:
            return state;
    }
}

export function ActivityProvider({ children }) {
    const [state, dispatch] = useReducer(activityReducer, initialState);


 // ActivityContext.jsx එකේ loadActivities function එක මෙහෙම වෙනස් කරන්න
const loadActivities = useCallback(async (courseId = null) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    
    // --- මෙතනින් පල්ලෙහාට වෙනස් කළා ---
    try {
        // const data = await activityService.getAll(courseId, state.filters.status); // මේක comment කළා
        
        // මේ තියෙන්නේ dummy data, backend එක හදනකම් මේක පේනවා
        const data = [
            { id: 1, title: "Sample Activity 1", description: "This is a test activity" },
            { id: 2, title: "Sample Activity 2", description: "This is another test activity" }
        ];

        dispatch({ type: 'SET_ACTIVITIES', payload: data });
        if (courseId !== undefined) {
            dispatch({ type: 'SET_FILTERS', payload: { courseId } });
        }
        return data;
    } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || error.message || 'Failed to load activities' });
        dispatch({ type: 'SET_LOADING', payload: false });
        throw error;
    }
    // --- මෙතනින් උඩට වෙනස් කළා ---

}, [state.filters.status]);
    const loadActivity = useCallback(async (id) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const data = await activityService.getById(id);
            dispatch({ type: 'SET_SELECTED_ACTIVITY', payload: data });
            dispatch({ type: 'SET_LOADING', payload: false });
            return data;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || error.message || 'Failed to load activity' });
            dispatch({ type: 'SET_LOADING', payload: false });
            throw error;
        }
    }, []);

    const createActivity = useCallback(async (activityData) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const data = await activityService.create(activityData);
            dispatch({ type: 'ADD_ACTIVITY', payload: data });
            return data;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || error.message || 'Failed to create activity' });
            dispatch({ type: 'SET_LOADING', payload: false });
            throw error;
        }
    }, []);

    const updateActivity = useCallback(async (id, activityData) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const data = await activityService.update(id, activityData);
            dispatch({ type: 'UPDATE_ACTIVITY', payload: data });
            return data;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || error.message || 'Failed to update activity' });
            dispatch({ type: 'SET_LOADING', payload: false });
            throw error;
        }
    }, []);

    const deleteActivity = useCallback(async (id) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            await activityService.delete(id);
            dispatch({ type: 'REMOVE_ACTIVITY', payload: id });
            dispatch({ type: 'SET_LOADING', payload: false });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || error.message || 'Failed to delete activity' });
            dispatch({ type: 'SET_LOADING', payload: false });
            throw error;
        }
    }, []);

    const loadProgress = useCallback(async (activityId) => {
        try {
            const data = await progressService.getByActivity(activityId);
            dispatch({ type: 'SET_PROGRESS', payload: { activityId, data } });
            return data;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || error.message || 'Failed to load progress' });
            throw error;
        }
    }, []);

    const updateProgress = useCallback(async (studentId, activityId, value) => {
        try {
            const data = await progressService.upsert({
                students_id: studentId,
                activities_id: activityId,
                value: parseFloat(value)
            });
            dispatch({
                type: 'UPDATE_PROGRESS',
                payload: { studentId, activityId, value: parseFloat(value) }
            });
            return data;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || error.message || 'Failed to update progress' });
            throw error;
        }
    }, []);

    const setFilters = useCallback((filters) => {
        dispatch({ type: 'SET_FILTERS', payload: filters });
    }, []);

    const clearError = useCallback(() => {
        dispatch({ type: 'CLEAR_ERROR' });
    }, []);

    const value = {
        ...state,
        loadActivities,
        loadActivity,
        createActivity,
        updateActivity,
        deleteActivity,
        loadProgress,
        updateProgress,
        setFilters,
        clearError
    };

    return (
        <ActivityContext.Provider value={value}>
            {children}
        </ActivityContext.Provider>
    );
}

export function useActivity() {
    const context = useContext(ActivityContext);
    if (!context) {
        throw new Error('useActivity must be used within an ActivityProvider');
    }
    return context;
}