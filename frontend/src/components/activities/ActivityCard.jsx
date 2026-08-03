import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, CheckCircle, AlertCircle, Edit2, Trash2, Users } from 'lucide-react';

const statusStyles = {
    upcoming: 'bg-[#D5DEEF] text-[#395886]',
    overdue: 'bg-[#F0D5D5] text-[#883939]',
    completed: 'bg-[#D5F0D5] text-[#398839]',
};

const statusIcons = {
    upcoming: Clock,
    overdue: AlertCircle,
    completed: CheckCircle,
};

export function ActivityCard({
    activity,
    progressSummary,
    onView,
    onEdit,
    onDelete,
    onTrackProgress,
    showProgress = true,
    compact = false,
}) {
    // Safety check: activity එක null නම් පේජ් එක crash නොවී හිස් div එකක් return කරන්න
    if (!activity) return null;

    const dueDate = activity.due_date ? new Date(activity.due_date) : null;
    const isOverdue = dueDate && dueDate < new Date();
    
    // progressSummary තිබේ නම් පමණක් completion status එක බලන්න
    const isCompleted = progressSummary?.completed_count === progressSummary?.total_count && progressSummary?.total_count > 0;

    let status = 'upcoming';
    if (isCompleted) status = 'completed';
    else if (isOverdue) status = 'overdue';

    const StatusIcon = statusIcons[status] || Clock;

    const progressPercent = progressSummary && progressSummary.total_count > 0
        ? Math.round((progressSummary.completed_count / progressSummary.total_count) * 100)
        : 0;

    return (
        <div
            className="rounded-xl p-5 transition-all duration-200 hover:shadow-lg border border-[#B1C9EF]/30 cursor-pointer bg-white shadow-[0_2px_8px_rgba(57,88,134,0.08)]"
            onClick={() => onView?.(activity)}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                        {activity.optional && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#D5DEEF] text-[#395886]">
                                Optional
                            </span>
                        )}
                    </div>
                    <h3 className="text-lg font-semibold text-[#395886] truncate">{activity.name}</h3>
                    {activity.description && !compact && (
                        <p className="text-sm text-[#628ECB] mt-1 line-clamp-2">{activity.description}</p>
                    )}
                </div>

                {!compact && (
                    <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                        <button
                            onClick={(e) => { e.stopPropagation(); onTrackProgress?.(activity); }}
                            className="p-1.5 rounded-lg hover:bg-[#D5DEEF] transition-colors"
                            title="Track Progress"
                        >
                            <Users className="w-4 h-4 text-[#628ECB]" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit?.(activity); }}
                            className="p-1.5 rounded-lg hover:bg-[#D5DEEF] transition-colors"
                            title="Edit"
                        >
                            <Edit2 className="w-4 h-4 text-[#628ECB]" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete?.(activity); }}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                {dueDate && (
                    <div className="flex items-center gap-1 text-[#628ECB]">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {format(dueDate, 'MMM d, yyyy')}</span>
                    </div>
                )}

                {showProgress && progressSummary && progressSummary.total_count > 0 && (
                    <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                        <div className="flex-1 h-1.5 rounded-full bg-[#D5DEEF] overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${progressPercent}%`,
                                    backgroundColor: progressPercent === 100 ? '#628ECB' : '#8AAEE0',
                                }}
                            />
                        </div>
                        <span className="text-xs font-medium text-[#395886] whitespace-nowrap">
                            {progressSummary.completed_count}/{progressSummary.total_count}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}