import { useReducer, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import Skeleton from '../ui/Skeleton';
import Badge from '../ui/Badge';

const initialState = { detail: null, loading: true, error: null };

function reducer(state, action) {
  switch (action.type) {
    case 'LOADING': return { detail: null, loading: true, error: null };
    case 'SUCCESS': return { detail: action.payload, loading: false, error: null };
    case 'ERROR':   return { detail: null, loading: false, error: action.payload };
    default: return state;
  }
}

export default function EducatorInlineDetail({ educatorId, educatorName, onClose }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { detail, loading, error } = state;

  useEffect(() => {
    if (!educatorId) return;
    let ignore = false;
    dispatch({ type: 'LOADING' });

    dashboardService.getEducatorDetail(educatorId)
      .then((data) => { if (!ignore) dispatch({ type: 'SUCCESS', payload: data }); })
      .catch(() => { if (!ignore) dispatch({ type: 'ERROR', payload: 'Failed to load educator details.' }); });

    return () => { ignore = true; };
  }, [educatorId]);

  const initials = detail?.initials
    || (educatorName ? educatorName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : '??');

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-paper-soft border border-ink/[0.06] rounded-xl p-4 mt-3"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center">
            <span className="text-xs font-bold text-brand-700">{initials}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">{detail?.name || educatorName}</p>
            {detail?.email && <p className="text-[11px] text-ink-faint">{detail.email}</p>}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md border border-ink/10 bg-surface text-ink-faint hover:text-ink hover:border-ink/20 flex items-center justify-center cursor-pointer transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {loading && (
        <div className="flex flex-col gap-2 py-1">
          <Skeleton className="h-3 w-32" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      {detail && !loading && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { label: 'Courses', value: detail.total_courses },
              { label: 'Students', value: detail.total_students },
            ].map((s, i) => (
              <div key={i} className="bg-surface border border-ink/[0.06] rounded-lg px-3 py-2.5">
                <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-ink-faint">{s.label}</p>
                <p className="text-2xl font-display font-light text-ink leading-none mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-ink-faint mb-2">
            Courses Taught
          </p>
          <div className="flex flex-col gap-1">
            {detail.courses.map((c, i) => (
              <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-md ${i % 2 === 0 ? 'bg-surface' : 'bg-transparent'}`}>
                <div>
                  <p className="text-[13px] text-ink">{c.course_name}</p>
                  <p className="text-[11px] text-ink-faint">{c.course_code} · {c.institution}</p>
                </div>
                <Badge tone="brand">{c.batch}</Badge>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
