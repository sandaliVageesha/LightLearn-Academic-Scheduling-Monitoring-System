const fieldClass = `w-full px-3.5 py-2.5 border border-ink/10 rounded-xl text-sm text-ink bg-surface
  outline-none transition-all placeholder-ink-faint/70
  focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10`;

function Label({ children, required }) {
  if (!children) return null;
  return (
    <label className="block text-xs font-semibold text-ink-soft tracking-wide mb-1.5">
      {children}
      {required && <span className="text-danger ml-0.5">*</span>}
    </label>
  );
}

export function Input({ label, required, className = '', wrapperClassName = '', ...props }) {
  return (
    <div className={wrapperClassName}>
      <Label required={required}>{label}</Label>
      <input className={`${fieldClass} ${className}`} required={required} {...props} />
    </div>
  );
}

export function Textarea({ label, required, className = '', wrapperClassName = '', rows = 3, ...props }) {
  return (
    <div className={wrapperClassName}>
      <Label required={required}>{label}</Label>
      <textarea
        rows={rows}
        className={`${fieldClass} resize-none ${className}`}
        required={required}
        {...props}
      />
    </div>
  );
}

export function Select({ label, required, className = '', wrapperClassName = '', children, ...props }) {
  return (
    <div className={wrapperClassName}>
      <Label required={required}>{label}</Label>
      <select className={`${fieldClass} cursor-pointer ${className}`} required={required} {...props}>
        {children}
      </select>
    </div>
  );
}
