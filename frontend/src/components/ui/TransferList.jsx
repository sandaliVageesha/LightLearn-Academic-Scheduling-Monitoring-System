import { useMemo, useState } from 'react';
import { Search, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from 'lucide-react';

function Panel({ title, list, checked, setChecked, empty }) {
  const toggle = (id) => {
    setChecked(checked.includes(id) ? checked.filter((c) => c !== id) : [...checked, id]);
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col border border-ink/10 rounded-xl overflow-hidden bg-surface">
      <div className="px-3 py-2 border-b border-ink/[0.06] bg-ink/[0.02] flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-soft">{title}</span>
        <span className="text-[10px] text-ink-faint">{list.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin max-h-56 p-1.5">
        {list.length === 0 ? (
          <p className="text-xs text-ink-faint text-center py-6">{empty}</p>
        ) : (
          list.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-ink
                         hover:bg-brand-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={checked.includes(item.id)}
                onChange={() => toggle(item.id)}
                className="accent-brand-600"
              />
              {item.label}
            </label>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Generic dual-listbox picker.
 *
 * items:     [{ id, label, group? }]
 * value:     array of selected ids
 * onChange:  (nextIds: any[]) => void
 */
export default function TransferList({
  items,
  value,
  onChange,
  leftTitle = 'Available',
  rightTitle = 'Selected',
  searchable = true,
  groupBy = null,
}) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const [leftChecked, setLeftChecked] = useState([]);
  const [rightChecked, setRightChecked] = useState([]);

  const groups = useMemo(() => {
    if (!groupBy) return [];
    return [...new Set(items.map((i) => i[groupBy]).filter(Boolean))];
  }, [items, groupBy]);

  const available = items.filter((i) => !value.includes(i.id));
  const assigned = items.filter((i) => value.includes(i.id));

  const filter = (list) =>
    list.filter((i) => {
      const matchesQuery = i.label.toLowerCase().includes(query.toLowerCase());
      const matchesGroup = group === 'all' || i[groupBy] === group;
      return matchesQuery && matchesGroup;
    });

  const leftList = filter(available);
  const rightList = filter(assigned);

  const moveRight = (ids) => {
    onChange([...value, ...ids]);
    setLeftChecked([]);
  };
  const moveLeft = (ids) => {
    onChange(value.filter((id) => !ids.includes(id)));
    setRightChecked([]);
  };

  return (
    <div className="flex flex-col gap-3">
      {(searchable || groupBy) && (
        <div className="flex gap-2">
          {searchable && (
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full pl-8 pr-3 py-2 border border-ink/10 rounded-lg text-xs
                           outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
              />
            </div>
          )}
          {groupBy && groups.length > 0 && (
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="px-2.5 py-2 border border-ink/10 rounded-lg text-xs outline-none cursor-pointer"
            >
              <option value="all">All</option>
              {groups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="flex items-stretch gap-2">
        <Panel
          title={leftTitle}
          list={leftList}
          checked={leftChecked}
          setChecked={setLeftChecked}
          empty="Nothing available"
        />

        <div className="flex flex-col justify-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => moveRight(leftChecked.length ? leftChecked : leftList.map((i) => i.id))}
            className="w-8 h-8 rounded-lg border border-ink/10 flex items-center justify-center
                       text-ink-soft hover:bg-brand-50 hover:text-brand-700 transition-colors"
            title="Move selected right"
          >
            {leftChecked.length ? <ChevronRight size={14} /> : <ChevronsRight size={14} />}
          </button>
          <button
            type="button"
            onClick={() => moveLeft(rightChecked.length ? rightChecked : rightList.map((i) => i.id))}
            className="w-8 h-8 rounded-lg border border-ink/10 flex items-center justify-center
                       text-ink-soft hover:bg-red-50 hover:text-danger transition-colors"
            title="Move selected left"
          >
            {rightChecked.length ? <ChevronLeft size={14} /> : <ChevronsLeft size={14} />}
          </button>
        </div>

        <Panel
          title={rightTitle}
          list={rightList}
          checked={rightChecked}
          setChecked={setRightChecked}
          empty="Nothing assigned"
        />
      </div>
    </div>
  );
}
