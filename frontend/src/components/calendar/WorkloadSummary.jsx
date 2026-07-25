import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, AlertTriangle } from 'lucide-react';
import calendarService from '../../services/calendarService';
import { findOverlaps } from '../../utils/eventConflicts';
import StatCard from '../StatCard';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import BarChartCard from '../charts/BarChartCard';
import { SkeletonRows } from '../ui/Skeleton';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function dateKey(d) {
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // Monday-start week
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function WorkloadSummary() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // The week can straddle a month boundary — fetch every month it touches.
    const months = new Set([
      `${now.getFullYear()}-${now.getMonth() + 1}`,
      `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}`,
      `${weekEnd.getFullYear()}-${weekEnd.getMonth() + 1}`,
    ]);

    Promise.all(
      [...months].map((m) => {
        const [y, mo] = m.split('-').map(Number);
        return calendarService.listEvents(y, mo).catch(() => []);
      })
    )
      .then((results) => { if (!ignore) setEvents(results.flat()); })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, []);

  const { todayCount, weekCount, chartData, conflictPairs } = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekEvents = events.filter((e) => {
      const t = new Date(e.start).getTime();
      return t >= weekStart.getTime() && t <= weekEnd.getTime();
    });

    const perDay = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const count = weekEvents.filter((e) => dateKey(e.start) === dateKey(d)).length;
      return { name: WEEKDAY_LABELS[i], value: count };
    });

    return {
      todayCount: events.filter((e) => dateKey(e.start) === dateKey(now)).length,
      weekCount: weekEvents.length,
      chartData: perDay,
      conflictPairs: findOverlaps(weekEvents).pairs,
    };
  }, [events]);

  if (loading) {
    return <SkeletonRows rows={3} />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Today" value={todayCount} tone="ocean" icon={CalendarClock} />
        <StatCard label="This week" value={weekCount} tone="violet" icon={CalendarClock} />
      </div>

      <BarChartCard title="Workload this week" data={chartData} color="#00A0F5" height={180} />

      {conflictPairs.length > 0 && (
        <Card className="border-danger/20 bg-red-50/40 dark:bg-red-500/10">
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-danger" />
            Scheduling conflicts
          </h3>
          <div className="flex flex-col gap-2">
            {conflictPairs.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Badge tone="danger">
                  {new Date(p.a.start).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </Badge>
                <span className="text-ink-soft">
                  <span className="font-medium">{p.a.title}</span> overlaps with{' '}
                  <span className="font-medium">{p.b.title}</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
