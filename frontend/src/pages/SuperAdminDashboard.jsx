import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Building2, Users, GraduationCap, BookOpen, Activity, MessageSquareWarning, Inbox, ArrowRight } from "lucide-react";
import dashboardService from "../services/dashboardService";
import complaintService from "../services/complaintService";
import usePolling from "../hooks/usePolling";
import StatCard from "../components/StatCard";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import BarChartCard from "../components/charts/BarChartCard";
import DonutChartCard from "../components/charts/DonutChartCard";
import ActivityFeed from "../components/ActivityFeed";
import { SkeletonRows } from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";

const MESSAGES_POLL_MS = 10000;

const TYPE_BADGE = {
  COMPLAINT: { tone: 'danger', label: 'Complaint' },
  HELP:      { tone: 'brand',  label: 'Help Request' },
};

const TONES = ['ocean', 'success', 'violet', 'warning', 'danger', 'accent'];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function SuperAdminDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [openComplaints, setOpenComplaints] = useState(null);
  const [recentMessages, setRecentMessages] = useState([]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const result = await dashboardService.getSuperAdminDashboard();
        if (!ignore) setData(result);
      } catch {
        if (!ignore) setError("Failed to load dashboard.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  // Live refresh, independent of the (heavier, one-shot) dashboard summary
  // load above — keeps the "Open complaints" stat and the message preview
  // current without re-querying every institution/course/student count.
  const fetchComplaintStats = useCallback(async () => {
    try {
      const stats = await complaintService.getStats();
      setOpenComplaints(stats.open ?? 0);
    } catch {
      // silent on background polls
    }
  }, []);

  const fetchRecentMessages = useCallback(async () => {
    try {
      const data = await complaintService.list({ status: 'OPEN' });
      setRecentMessages(data.slice(0, 5));
    } catch {
      // silent on background polls
    }
  }, []);

  usePolling(fetchComplaintStats, MESSAGES_POLL_MS);
  usePolling(fetchRecentMessages, MESSAGES_POLL_MS);

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        <SkeletonRows rows={5} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        <ErrorState message={error} />
      </div>
    );
  }

  const { summary, institutions, recent_activity } = data;

  const activeCount = (institutions ?? []).filter((i) => i.is_active !== false).length;
  const inactiveCount = (institutions ?? []).length - activeCount;

  const statusChart = [
    { name: 'Active', value: activeCount, color: '#00A0F5' },
    { name: 'Inactive', value: inactiveCount, color: '#CBD5E1' },
  ];

  const studentsPerInstitution = [...(institutions ?? [])]
    .sort((a, b) => b.student_count - a.student_count)
    .slice(0, 8)
    .map((i) => ({ name: i.name, value: i.student_count }));

  const stats = [
    { label: 'Institutions', value: summary.total_institutions, icon: Building2 },
    { label: 'Students',     value: summary.total_students,     icon: Users },
    { label: 'Educators',    value: summary.total_educators,    icon: GraduationCap },
    { label: 'Courses',      value: summary.total_courses,      icon: BookOpen },
    { label: 'Active users', value: summary.total_users,        icon: Activity },
    { label: 'Open complaints', value: openComplaints ?? summary.total_complaints, icon: MessageSquareWarning },
  ];

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <PageHeader title="Super admin dashboard" subtitle="System-wide overview across all institutions" />

      <motion.div
        variants={fadeUp} initial="hidden" animate="show" custom={0}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10"
      >
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} tone={TONES[i]} />
        ))}
      </motion.div>

      <motion.div
        variants={fadeUp} initial="hidden" animate="show" custom={1}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"
      >
        <BarChartCard title="Students per institution" icon={Users} data={studentsPerInstitution} color="#00A0F5" />
        <DonutChartCard title="Institution status" data={statusChart} />
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">Institutions</h2>
          <span className="text-xs text-ink-faint">{institutions?.length ?? 0} total</span>
        </div>

        <Card padding="p-0" className="overflow-hidden">
          {institutions?.length === 0 ? (
            <EmptyState icon={Building2} title="No institutions yet" />
          ) : (
            <>
              <div className="grid gap-3 px-5 py-3 border-b border-ink/[0.06] grid-cols-[1fr_70px_80px_90px] max-sm:grid-cols-[1fr_90px]">
                {['Institution', 'Courses', 'Students', 'Status'].map((h, i) => (
                  <span
                    key={h}
                    className={`text-[11px] font-medium text-ink-faint uppercase tracking-wide
                      ${i > 0 ? 'text-right' : ''} ${(i === 1 || i === 2) ? 'max-sm:hidden' : ''}`}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {institutions?.map((inst) => (
                <div
                  key={inst.id}
                  className="grid gap-3 px-5 py-3.5 border-b border-ink/[0.06] last:border-0 items-center hover:bg-brand-50/50 transition-colors cursor-pointer grid-cols-[1fr_70px_80px_90px] max-sm:grid-cols-[1fr_90px]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <Building2 size={13} className="text-brand-700" />
                    </div>
                    <span className="text-sm font-medium text-ink truncate">{inst.name}</span>
                  </div>
                  <span className="text-sm text-ink-faint text-right max-sm:hidden">{inst.course_count}</span>
                  <span className="text-sm text-ink-faint text-right max-sm:hidden">{inst.student_count}</span>
                  <div className="flex justify-end">
                    <Badge tone={inst.is_active !== false ? 'success' : 'neutral'}>
                      {inst.is_active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
            </>
          )}
        </Card>
      </motion.div>

      <motion.div
        variants={fadeUp} initial="hidden" animate="show" custom={3}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10"
      >
        <Card padding="p-0" className="overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink/[0.06]">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <Inbox className="w-4 h-4 text-ink-faint" />
              Recent messages
            </h2>
            <Link to="/superadmin/messages" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recentMessages.length === 0 ? (
            <EmptyState icon={Inbox} title="No open messages" message="Complaints and help requests will show up here." />
          ) : (
            <div className="divide-y divide-ink/[0.05]">
              {recentMessages.map((m) => {
                const typeBadge = TYPE_BADGE[m.type] ?? TYPE_BADGE.HELP;
                return (
                  <Link
                    key={m.id}
                    to="/superadmin/messages"
                    className="flex items-start justify-between gap-3 px-5 py-3 hover:bg-ink/[0.02] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-ink truncate">{m.subject}</p>
                        <Badge tone={typeBadge.tone}>{typeBadge.label}</Badge>
                      </div>
                      <p className="text-xs text-ink-faint truncate">
                        {m.submitted_by.username} · {m.submitted_by.email}
                      </p>
                    </div>
                    <span className="text-[11px] text-ink-faint whitespace-nowrap shrink-0">
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-ink-faint" />
            Recent activity
          </h2>
          <ActivityFeed activities={recent_activity} />
        </Card>
      </motion.div>
    </div>
  );
}
