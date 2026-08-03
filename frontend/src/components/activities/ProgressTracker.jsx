import React, { useState, useEffect } from 'react';
import { X, Check, Clock, TrendingUp } from 'lucide-react';

const statusMap = {
    notStarted: { label: 'Not Started', color: 'bg-[#B1C9EF] text-[#395886]', icon: Clock },
    inProgress: { label: 'In Progress', color: 'bg-[#8AAEE0] text-white', icon: TrendingUp },
    almostDone: { label: 'Almost Done', color: 'bg-[#628ECB] text-white', icon: TrendingUp },
    completed: { label: 'Completed', color: 'bg-[#395886] text-white', icon: Check },
};

const getProgressStatus = (value) => {
    if (value == null || value === 0) return statusMap.notStarted;
    if (value < 50) return statusMap.inProgress;
    if (value < 100) return statusMap.almostDone;
    return statusMap.completed;
};

export function ProgressTracker({
    activity,
    students = [],
    progressData = [],
    onUpdateProgress,
    onClose,
    isLoading = false,
}) {
    const [progressMap, setProgressMap] = useState({});
    const [editingStudent, setEditingStudent] = useState(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        const map = {};
        progressData.forEach((p) => {
            const studentId = p.students || p.students_id;
            map[studentId] = p.value;
        });
        setProgressMap(map);
    }, [progressData]);

    const handleValueChange = (studentId, value) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0 || numValue > 100) return;
        setProgressMap((prev) => ({ ...prev, [studentId]: numValue }));
        onUpdateProgress(studentId, numValue);
    };

    const handleEditStart = (studentId, currentValue) => {
        setEditingStudent(studentId);
        setEditValue(currentValue != null ? String(currentValue) : '');
    };

    const handleEditSave = (studentId) => {
        const numValue = parseFloat(editValue);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
            handleValueChange(studentId, numValue);
        }
        setEditingStudent(null);
        setEditValue('');
    };

    const getStudentName = (studentId) => {
        const student = students.find((s) => s.id === studentId);
        return student ? student.name : `Student #${studentId}`;
    };

    const sortedStudents = [...students].sort((a, b) => {
        const valA = progressMap[a.id] ?? -1;
        const valB = progressMap[b.id] ?? -1;
        return valB - valA;
    });

    const totalStudents = students.length;
    const completedCount = Object.values(progressMap).filter((v) => v >= 100).length;
    const avgProgress =
        totalStudents > 0
            ? Math.round(Object.values(progressMap).reduce((sum, v) => sum + (v || 0), 0) / totalStudents)
            : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto bg-[#F0F3FA]">
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[#B1C9EF] bg-[#F0F3FA]">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-[#395886]">Progress: {activity?.name}</h2>
                        <p className="text-sm text-[#628ECB] mt-0.5">
                            {totalStudents} students • {avgProgress}% average • {completedCount} completed
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#D5DEEF] transition-colors">
                        <X className="w-5 h-5 text-[#628ECB]" />
                    </button>
                </div>

                <div className="px-6 py-3 flex items-center gap-6 border-b border-[#D5DEEF]">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-[#628ECB]">Progress:</span>
                        <div className="w-32 h-2 bg-[#D5DEEF] rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${avgProgress}%`,
                                    backgroundColor: avgProgress >= 70 ? '#395886' : '#8AAEE0',
                                }}
                            />
                        </div>
                        <span className="text-sm font-medium text-[#395886]">{avgProgress}%</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#628ECB]">
                        <span>✅ {completedCount} done</span>
                        <span>⏳ {totalStudents - completedCount} pending</span>
                    </div>
                </div>

                <div className="p-4 space-y-2">
                    {sortedStudents.length === 0 ? (
                        <div className="text-center py-8 text-[#628ECB]">
                            <p>No students enrolled in this course yet.</p>
                        </div>
                    ) : (
                        sortedStudents.map((student) => {
                            const value = progressMap[student.id];
                            const status = getProgressStatus(value);
                            const StatusIcon = status.icon;

                            return (
                                <div
                                    key={student.id}
                                    className="flex items-center gap-4 p-3 rounded-xl bg-white/70 hover:bg-white transition-colors border border-[#D5DEEF]"
                                >
                                    <div className="flex-1 flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 bg-[#628ECB]">
                                            {getStudentName(student.id).charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-[#395886] truncate">
                                            {getStudentName(student.id)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                            <StatusIcon className="w-3.5 h-3.5" />
                                            {status.label}
                                        </span>

                                        {editingStudent === student.id ? (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="w-16 px-2 py-1 text-sm rounded-lg border border-[#B1C9EF] bg-white text-center focus:outline-none focus:ring-2 focus:ring-[#628ECB]"
                                                    autoFocus
                                                />
                                                <span className="text-xs text-[#628ECB]">%</span>
                                                <button
                                                    onClick={() => handleEditSave(student.id)}
                                                    className="p-1 rounded bg-[#628ECB] text-white hover:bg-[#395886] transition-colors"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingStudent(null);
                                                        setEditValue('');
                                                    }}
                                                    className="p-1 rounded bg-[#D5DEEF] text-[#628ECB] hover:bg-[#B1C9EF] transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleEditStart(student.id, value)}
                                                className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors bg-[#D5DEEF] text-[#395886] hover:bg-[#B1C9EF]"
                                            >
                                                {value != null ? `${value}%` : 'Set Score'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="sticky bottom-0 px-6 py-3 border-t border-[#B1C9EF] bg-[#F0F3FA] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl font-medium text-[#395886] hover:bg-[#D5DEEF] transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}