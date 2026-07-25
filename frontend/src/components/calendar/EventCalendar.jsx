import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Pencil, Lock, CalendarDays, AlertTriangle } from 'lucide-react';
import calendarService from '../../services/calendarService';
import usePolling from '../../hooks/usePolling';
import { useToast } from '../ui/Toast';
import { usePermissions } from '../../auth/PermissionsContext';
import { findOverlaps } from '../../utils/eventConflicts';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';
import EventFormModal from './EventFormModal';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const TYPE_COLOR = {
  class:      '#3B82F6',
  assignment: '#F59E0B',
  exam:       '#EF4444',
  holiday:    '#22C55E',
  meeting:    '#A78BFA',
  personal:   '#64748B',
};

const POLL_MS = 9000;

export default function EventCalendar({ role }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [direction, setDirection] = useState(0);
  const [selDay, setSelDay] = useState(now.getDate());

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();
  const { user } = usePermissions();

  const fetchEvents = useCallback(async () => {
    try {
      const data = await calendarService.listEvents(year, month + 1);
      setEvents(data);
    } catch {
      // silent on background polls; loading state below covers first load
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { setLoading(true); }, [year, month]);
  usePolling(fetchEvents, POLL_MS, modalOpen || Boolean(deleteTarget));

  useEffect(() => {
    if (role === 'EDUCATOR') {
      calendarService.listMyCourses().then(setCourses).catch(() => setCourses([]));
    }
  }, [role]);

  const byDate = useMemo(() => {
    const map = {};
    for (const ev of events) {
      const d = new Date(ev.start).getDate();
      (map[d] ||= []).push(ev);
    }
    return map;
  }, [events]);

  const conflictIds = useMemo(() => findOverlaps(events).conflictIds, [events]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const todayNum = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : null;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goto = (delta) => {
    setDirection(delta);
    setSelDay(null);
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m);
    setYear(y);
  };

  const openCreate = (day) => {
    const d = day ?? selDay ?? now.getDate();
    setDefaultDate(new Date(year, month, d, 9, 0));
    setEditingEvent(null);
    setModalOpen(true);
  };

  const openEdit = (ev) => {
    setEditingEvent(ev);
    setDefaultDate(null);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      if (editingEvent) {
        await calendarService.updateEvent(editingEvent.id, payload);
        toast.success('Event updated.');
      } else {
        await calendarService.createEvent(payload);
        toast.success('Event created.');
      }
      setModalOpen(false);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await calendarService.deleteEvent(deleteTarget.id);
      toast.success('Event deleted.');
      setDeleteTarget(null);
      setModalOpen(false);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete event.');
    } finally {
      setDeleting(false);
    }
  };

  const selEvents = selDay ? byDate[selDay] || [] : [];

  return (
    <div className="rounded-2xl border border-ink/[0.06] bg-surface overflow-hidden shadow-soft">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-ink/[0.06]">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-brand-600" />
          <p className="text-xs uppercase tracking-widest text-ink-faint font-semibold">
            Schedule
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => goto(-1)}
            className="w-7 h-7 rounded-lg border border-ink/10 flex items-center justify-center text-ink-soft hover:bg-ink/[0.04] transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-semibold text-ink font-display w-[130px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={() => goto(1)}
            className="w-7 h-7 rounded-lg border border-ink/10 flex items-center justify-center text-ink-soft hover:bg-ink/[0.04] transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <Button variant="brand" size="sm" icon={Plus} onClick={() => openCreate()}>
          New event
        </Button>
      </div>

      <div className="p-5">
        {/* Weekday labels */}
        <div className="grid grid-cols-7 mb-2 text-[11px] font-semibold text-ink-faint">
          {DAYS.map((d) => (
            <div key={d} className="text-center">{d}</div>
          ))}
        </div>

        {/* Month grid */}
        <div className="overflow-hidden relative min-h-[240px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`${year}-${month}`}
              custom={direction}
              initial={{ opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 24 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-7 gap-1"
            >
              {cells.map((day, idx) => {
                if (!day) return <div key={`e-${idx}`} className="h-11" />;

                const dayEvts = byDate[day] || [];
                const isToday = day === todayNum;
                const isSel = day === selDay;
                const hasConflict = dayEvts.some((e) => conflictIds.has(e.id));

                return (
                  <button
                    key={day}
                    onClick={() => setSelDay(isSel ? null : day)}
                    className={`h-11 rounded-lg text-sm font-medium transition-all relative
                      ${isSel
                        ? 'bg-brand-600 text-white shadow-soft'
                        : isToday
                        ? 'bg-accent-50 text-accent-700 font-bold'
                        : 'text-ink-soft hover:bg-ink/[0.04]'
                      }
                      ${hasConflict ? 'ring-2 ring-danger/60' : ''}`}
                  >
                    {hasConflict && (
                      <AlertTriangle
                        size={10}
                        className={`absolute top-0.5 right-0.5 ${isSel ? 'text-white' : 'text-danger'}`}
                      />
                    )}
                    {day}
                    {dayEvts.length > 0 && (
                      <div className="flex justify-center gap-0.5 mt-0.5">
                        {dayEvts.slice(0, 3).map((e, i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: isSel ? '#fff' : (TYPE_COLOR[e.event_type] || TYPE_COLOR.personal) }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Agenda for selected day */}
        <AnimatePresence mode="wait">
          {selDay !== null && (
            <motion.div
              key={selDay}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="mt-4 pt-4 border-t border-ink/[0.06]"
            >
              <p className="text-xs uppercase tracking-widest text-ink-faint font-semibold mb-2.5">
                {MONTHS[month]} {selDay}
              </p>

              {loading ? (
                <p className="text-sm text-ink-faint">Loading…</p>
              ) : selEvents.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="No events"
                  message="Nothing scheduled for this day."
                  action={
                    <Button variant="outline" size="sm" icon={Plus} onClick={() => openCreate(selDay)}>
                      Add event
                    </Button>
                  }
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {selEvents.map((ev) => {
                    const isOthersPersonal = !ev.course && ev.created_by?.id !== user?.id;
                    const label = isOthersPersonal
                      ? `Personal — ${ev.created_by?.name}`
                      : ev.course?.name || 'Personal';

                    return (
                    <button
                      key={ev.id}
                      onClick={() => openEdit(ev)}
                      className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:bg-ink/[0.03] border border-transparent hover:border-ink/[0.06] group
                        ${conflictIds.has(ev.id) ? 'border-danger/30 bg-red-50/40 dark:bg-red-500/10' : ''}`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: TYPE_COLOR[ev.event_type] || TYPE_COLOR.personal }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate flex items-center gap-1.5">
                          {ev.title}
                          {conflictIds.has(ev.id) && <AlertTriangle size={12} className="text-danger shrink-0" />}
                        </p>
                        <p className="text-xs text-ink-faint truncate">
                          {label}
                          {!ev.all_day && ` · ${new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      </div>
                      {ev.can_edit ? (
                        <Pencil size={13} className="text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      ) : (
                        <Lock size={12} className="text-ink-faint/50 shrink-0" />
                      )}
                    </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-ink/[0.06] flex gap-4 flex-wrap">
          {Object.entries(TYPE_COLOR).map(([k, c]) => (
            <div key={k} className="flex items-center gap-1.5 text-[11px] text-ink-faint capitalize">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
              {k}
            </div>
          ))}
        </div>
      </div>

      <EventFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={editingEvent ? () => setDeleteTarget(editingEvent) : undefined}
        role={role}
        courses={courses}
        initial={editingEvent}
        defaultDate={defaultDate}
        saving={saving}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this event?"
        message={deleteTarget ? `"${deleteTarget.title}" will be removed for everyone who can see it.` : ''}
        loading={deleting}
      />
    </div>
  );
}
