import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Grid3X3, List, AlertCircle, X } from 'lucide-react';
import { useActivity } from '../context/ActivityContext';
import { ActivityCard, ActivityForm, ProgressTracker, ActivityFilters } from '../components/activities';

// Replace with real API calls - fetch from your course service
const mockCourses = [
    { id: 1, name: 'Mathematics 101', code: 'MATH101' },
    { id: 2, name: 'Physics 101', code: 'PHYS101' },
    { id: 3, name: 'Chemistry 101', code: 'CHEM101' },
];

// Replace with real API calls - fetch from your student service
const mockStudents = [
    { id: 1, name: 'Alice Johnson' },
    { id: 2, name: 'Bob Smith' },
    { id: 3, name: 'Carol White' },
    { id: 4, name: 'David Brown' },
];

export function ActivityManagement() {
    const {
        activities,
        loading,
        error,
        filters,
        progressData,
        loadActivities,
        createActivity,
        updateActivity,
        deleteActivity,
        loadProgress,
    } = useActivity();

    
    useEffect(() => {
        loadActivities();
        loadProgress();
    }, [loadActivities, loadProgress]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Activity Management</h1>
           {/* {error && <div className="text-red-500 mb-4">{error}</div>}*/}
            {loading ? (
                <div>Loading...</div>
            ) : (
                <div>
                    {/* ඔබේ Component මෙතනට එකතු කරන්න */}
                    <ActivityFilters />
                    <div className="grid grid-cols-1 gap-4">
                        {activities.map(activity => (
                            <ActivityCard 
                                key={activity.id} 
                                activity={activity} 
                                onUpdate={updateActivity}
                                onDelete={deleteActivity}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}