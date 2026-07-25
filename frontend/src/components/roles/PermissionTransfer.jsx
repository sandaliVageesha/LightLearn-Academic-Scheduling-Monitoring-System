import { useState, useMemo } from "react";
import { ChevronDown, Check, X } from "lucide-react";

const formatName = (name) =>
  name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const Panel = ({ title, items, checkedSet, setChecked, search, setSearch, count, onToggle }) => (
  <div className="flex-1 flex flex-col border border-ink/10 rounded-xl overflow-hidden bg-surface">
    <div className="px-4 py-3 bg-brand-50 border-b border-ink/[0.06] flex items-center justify-between">
      <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">{title}</span>
      <span className="text-xs text-brand-500 tabular-nums">{count}</span>
    </div>
    <div className="px-3 py-2 border-b border-ink/[0.06]">
      <input
        type="text"
        placeholder="Search…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full text-sm px-2 py-1.5 border border-ink/10 rounded-lg outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-surface"
      />
    </div>
    <div className="flex-1 overflow-y-auto scroll-thin max-h-64">
      {items.length === 0 ? (
        <p className="text-xs text-ink-faint text-center py-8">No permissions</p>
      ) : (
        <ul>
          {items.map((p) => (
            <li
              key={p.id}
              onClick={() => onToggle(p.id, checkedSet, setChecked)}
              className={`flex items-center gap-2 px-4 py-2 cursor-pointer text-sm select-none transition-colors ${
                checkedSet.has(p.id) ? "bg-brand-50 text-brand-700" : "hover:bg-ink/[0.02] text-ink-soft"
              }`}
            >
              <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                checkedSet.has(p.id) ? "bg-brand-600 border-brand-600" : "border-ink/20"
              }`}>
                {checkedSet.has(p.id) && <Check size={10} className="text-white" strokeWidth={3} />}
              </div>
              {formatName(p.name)}
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

export default function PermissionTransfer({ groups = [], selected, onChange }) {
  const [activeModule, setActiveModule] = useState("__all__");
  const [leftSearch,   setLeftSearch]   = useState("");
  const [rightSearch,  setRightSearch]  = useState("");
  const [leftChecked,  setLeftChecked]  = useState(new Set());
  const [rightChecked, setRightChecked] = useState(new Set());

  const allPerms = useMemo(() => groups.flatMap((g) => g.permissions), [groups]);

  const modulePerms = useMemo(() => {
    if (activeModule === "__all__") return allPerms;
    const group = groups.find((g) => g.module === activeModule);
    return group ? group.permissions : [];
  }, [activeModule, allPerms, groups]);

  const available = useMemo(
    () => modulePerms.filter((p) => !selected.has(p.id) && p.name.toLowerCase().includes(leftSearch.toLowerCase())),
    [modulePerms, selected, leftSearch]
  );

  const assigned = useMemo(
    () => allPerms.filter((p) => selected.has(p.id) && p.name.toLowerCase().includes(rightSearch.toLowerCase())),
    [allPerms, selected, rightSearch]
  );

  const toggle = (id, checkedSet, setChecked) => {
    const next = new Set(checkedSet);
    next.has(id) ? next.delete(id) : next.add(id);
    setChecked(next);
  };

  const moveRight = () => {
    const next = new Set(selected);
    leftChecked.forEach((id) => next.add(id));
    onChange(next);
    setLeftChecked(new Set());
  };

  const moveLeft = () => {
    const next = new Set(selected);
    rightChecked.forEach((id) => next.delete(id));
    onChange(next);
    setRightChecked(new Set());
  };

  const moveAllRight = () => {
    const next = new Set(selected);
    available.forEach((p) => next.add(p.id));
    onChange(next);
    setLeftChecked(new Set());
  };

  const moveAllLeft = () => {
    const next = new Set(selected);
    assigned.forEach((p) => next.delete(p.id));
    onChange(next);
    setRightChecked(new Set());
  };

  const handleModuleChange = (module) => {
    setActiveModule(module);
    setLeftChecked(new Set());
    setLeftSearch("");
  };

  const assignedCountFor = (moduleName) => {
    const group = groups.find((g) => g.module === moduleName);
    if (!group) return 0;
    return group.permissions.filter((p) => selected.has(p.id)).length;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-xs text-ink-faint whitespace-nowrap">Filter by module</label>
        <div className="relative">
          <select
            value={activeModule}
            onChange={(e) => handleModuleChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-ink/10 rounded-lg bg-surface text-brand-700 font-medium
                       outline-none focus:border-brand-500 cursor-pointer transition-colors hover:border-brand-300"
          >
            <option value="__all__">All modules ({allPerms.length})</option>
            {groups.map((g) => {
              const count = assignedCountFor(g.module);
              return (
                <option key={g.module} value={g.module}>
                  {g.module}{count > 0 ? ` (${count} assigned)` : ` (${g.permissions.length})`}
                </option>
              );
            })}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none" />
        </div>

        {activeModule !== "__all__" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-medium rounded-full">
            {activeModule}
            <button onClick={() => handleModuleChange("__all__")} className="hover:text-danger transition-colors" aria-label="Clear filter">
              <X size={11} />
            </button>
          </span>
        )}
      </div>

      <div className="flex gap-3 items-stretch">
        <Panel title="Available" items={available} checkedSet={leftChecked} setChecked={setLeftChecked}
          search={leftSearch} setSearch={setLeftSearch} count={available.length} onToggle={toggle} />

        <div className="flex flex-col items-center justify-center gap-2 pt-4">
          <button onClick={moveAllRight} title="Add all visible"
            className="w-8 h-8 rounded-lg border border-ink/10 bg-surface hover:bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold transition-colors">»</button>
          <button onClick={moveRight} disabled={leftChecked.size === 0} title="Add selected"
            className="w-8 h-8 rounded-lg border border-ink/10 bg-surface hover:bg-brand-50 text-brand-600 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed">›</button>
          <button onClick={moveLeft} disabled={rightChecked.size === 0} title="Remove selected"
            className="w-8 h-8 rounded-lg border border-ink/10 bg-surface hover:bg-brand-50 text-brand-600 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed">‹</button>
          <button onClick={moveAllLeft} title="Remove all visible"
            className="w-8 h-8 rounded-lg border border-ink/10 bg-surface hover:bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold transition-colors">«</button>
        </div>

        <Panel title="Assigned" items={assigned} checkedSet={rightChecked} setChecked={setRightChecked}
          search={rightSearch} setSearch={setRightSearch} count={assigned.length} onToggle={toggle} />
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {groups.map((g) => {
            const count = assignedCountFor(g.module);
            if (count === 0) return null;
            return (
              <span
                key={g.module}
                onClick={() => handleModuleChange(g.module)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[11px] font-medium cursor-pointer hover:bg-brand-100 transition-colors"
                title={`Click to filter by ${g.module}`}
              >
                {g.module}
                <span className="bg-brand-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                  {count}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
