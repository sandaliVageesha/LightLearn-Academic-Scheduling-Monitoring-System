import React from 'react';
import { Search, X } from 'lucide-react';

export function ActivityFilters({
    filters,
    onFilterChange,
    onClearFilters,
    courses = [],
    className = '',
}) {
    const statusOptions = [
        { value: 'all', label: 'All Activities' },
        { value: 'upcoming', label: 'Upcoming' },
        { value: 'overdue', label: 'Overdue' },
        { value: 'completed', label: 'Completed' },
    ];

    const handleSearchChange = (e) => onFilterChange({ search: e.target.value });
    const handleCourseChange = (e) => onFilterChange({ courseId: e.target.value || null });
    const handleStatusChange = (e) => onFilterChange({ status: e.target.value });

    const hasActiveFilters =
        filters?.search || filters?.courseId || (filters?.status && filters.status !== 'all');

    return (
        <div className={`flex flex-wrap items-center gap-3 ${className}`}>
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8AAEE0]" />
                <input
                    type="text"
                    placeholder="Search activities..."
                    value={filters?.search || ''}
                    onChange={handleSearchChange}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#B1C9EF] bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#628ECB] transition-all text-sm"
                />
            </div>

            <select
                value={filters?.courseId || ''}
                onChange={handleCourseChange}
                className="px-4 py-2 rounded-xl border border-[#B1C9EF] bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#628ECB] transition-all text-sm appearance-none min-w-[150px]"
            >
                <option value="">All Courses</option>
                {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                        {course.name}
                    </option>
                ))}
            </select>

            <select
                value={filters?.status || 'all'}
                onChange={handleStatusChange}
                className="px-4 py-2 rounded-xl border border-[#B1C9EF] bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#628ECB] transition-all text-sm appearance-none min-w-[140px]"
            >
                {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>

            {hasActiveFilters && (
                <button
                    onClick={onClearFilters}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-[#628ECB] hover:bg-[#D5DEEF] transition-colors"
                >
                    <X className="w-4 h-4" />
                    Clear
                </button>
            )}
        </div>
    );
}