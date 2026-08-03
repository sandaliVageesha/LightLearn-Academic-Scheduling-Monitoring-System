import React, { useState, useEffect } from 'react';
import { X, Calendar, Save, AlertCircle } from 'lucide-react';

export function ActivityForm({
    initialData = null,
    courses = [],
    onSubmit,
    onCancel,
    isLoading = false,
    mode = 'create',
}) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        courses: '',
        due_date: '',
        optional: false,
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                courses: initialData.courses || '',
                due_date: initialData.due_date ? initialData.due_date.split('T')[0] : '',
                optional: initialData.optional || false,
            });
        }
    }, [initialData]);

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Activity name is required';
        if (!formData.courses) newErrors.courses = 'Please select a course';
        if (!formData.due_date) newErrors.due_date = 'Due date is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            const payload = {
                ...formData,
                courses: parseInt(formData.courses),
                optional: Boolean(formData.optional),
            };
            if (payload.due_date && !payload.due_date.includes('T')) {
                payload.due_date = `${payload.due_date}T00:00:00`;
            }
            onSubmit(payload);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto bg-[#F0F3FA]">
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[#B1C9EF] bg-[#F0F3FA]">
                    <h2 className="text-xl font-bold text-[#395886]">
                        {mode === 'create' ? 'Create New Activity' : 'Edit Activity'}
                    </h2>
                    <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-[#D5DEEF] transition-colors">
                        <X className="w-5 h-5 text-[#628ECB]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-[#395886] mb-1">
                            Activity Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter activity name"
                            className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-colors bg-white ${
                                errors.name ? 'border-red-500' : 'border-[#B1C9EF]'
                            } focus:border-[#628ECB]`}
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="courses" className="block text-sm font-medium text-[#395886] mb-1">
                            Course <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="courses"
                            name="courses"
                            value={formData.courses}
                            onChange={handleChange}
                            className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-colors bg-white appearance-none ${
                                errors.courses ? 'border-red-500' : 'border-[#B1C9EF]'
                            } focus:border-[#628ECB]`}
                        >
                            <option value="">Select a course...</option>
                            {courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.name} {course.code ? `(${course.code})` : ''}
                                </option>
                            ))}
                        </select>
                        {errors.courses && (
                            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {errors.courses}
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="due_date" className="block text-sm font-medium text-[#395886] mb-1">
                            Due Date <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8AAEE0]" />
                            <input
                                id="due_date"
                                name="due_date"
                                type="date"
                                value={formData.due_date}
                                onChange={handleChange}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-colors bg-white ${
                                    errors.due_date ? 'border-red-500' : 'border-[#B1C9EF]'
                                } focus:border-[#628ECB]`}
                            />
                        </div>
                        {errors.due_date && (
                            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {errors.due_date}
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-[#395886] mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows="3"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter activity description (optional)"
                            className="w-full px-4 py-2.5 rounded-xl border border-[#B1C9EF] outline-none transition-colors bg-white resize-none focus:border-[#628ECB]"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            id="optional"
                            name="optional"
                            type="checkbox"
                            checked={formData.optional}
                            onChange={handleChange}
                            className="w-5 h-5 rounded border-[#B1C9EF] text-[#628ECB] focus:ring-[#628ECB]"
                        />
                        <label htmlFor="optional" className="text-sm font-medium text-[#395886]">
                            Mark as Optional Activity
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#B1C9EF]">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2.5 rounded-xl font-medium transition-colors bg-[#D5DEEF] text-[#395886] hover:bg-[#B1C9EF]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2.5 rounded-xl font-medium text-white transition-colors bg-[#628ECB] hover:bg-[#395886] flex items-center gap-2 disabled:opacity-70"
                        >
                            {isLoading ? (
                                <>
                                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {mode === 'create' ? 'Create Activity' : 'Update Activity'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}