import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ActivityFeed from "../components/ActivityFeed";
import StatCard from "../components/StatCard";
import dashboardService from "../services/dashboardService";

export default function ManagerDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const result = await dashboardService.getManagerDashboard();
        console.log(result);
        if (!ignore) setData(result);
      } catch (err) {
        console.error(err);
        if (!ignore) setError('Failed to load dashboard.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      Loading dashboard...
    </div>
  );

  if (error) return (
    <div className="p-6 text-red-500">{error}</div>
  );

  const { summary, courses_per_institution, educators_per_course, recent_activity } = data;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Manager Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Institutions" value={summary.total_institutions} color="blue"  icon="🏫" />
        <StatCard label="Courses"      value={summary.total_courses}       color="green"  icon="📚" />
        <StatCard label="Educators"    value={summary.total_educators}     color="purple" icon="👨‍🏫" />
        <StatCard label="Batches"      value={summary.total_batches}       color="orange" icon="🎓" />
        <StatCard label="Students"     value={summary.total_students}      color="red"    icon="👤" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">
            Courses per Institution
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={courses_per_institution}
              margin={{ top: 0, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="institution__name" tick={{ fontSize: 11 }}
                angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="course_count" name="Courses"
                fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">
            Educators per Course
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={educators_per_course}
              margin={{ top: 0, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="course__name" tick={{ fontSize: 11 }}
                angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="educator_count" name="Educators"
                fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">
          Recent Activity
        </h2>
        
        {recent_activity && recent_activity.length > 0 ? (
          <ActivityFeed activities={recent_activity} />
        ) : (
          <div className="text-center py-6 text-gray-400">
            <p>No activity recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}