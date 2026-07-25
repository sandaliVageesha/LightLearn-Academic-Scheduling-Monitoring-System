import { useState, useEffect } from 'react';
import GuardianForm from './GuardianForm';
import studentService from '../services/studentService';
import Button from './ui/Button';
import { Input, Select } from './ui/Field';

function buildInitialForm(student) {
  if (!student) {
    return {
      name: '', email: '', phone: '',
      registration_no: '', batch_id: '',
      password: '', guardian_ids: [],
    };
  }
  return {
    name:            student.name,
    email:           student.email,
    phone:           student.phone || '',
    registration_no: student.registration_no,
    batch_id:        student.batch || '',
    password:        '',
    guardian_ids: student.guardians?.map((g) => g.id) || [],
  };
}

export default function StudentForm({
  selectedStudent,
  batches,
  onInsert, onUpdate, onCancel,
}) {
  const [form, setForm]                   = useState(() => buildInitialForm(selectedStudent));
  const [guardians, setGuardians]         = useState([]);
  const [showGuardianForm, setShowGuardianForm] = useState(false);
  const [loadingGuardians, setLoadingGuardians] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await studentService.listGuardians();
        if (!ignore) setGuardians(data);
      } finally {
        if (!ignore) setLoadingGuardians(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const toggleGuardian = (id) => {
    setForm((prev) => ({
      ...prev,
      guardian_ids: prev.guardian_ids.includes(id)
        ? prev.guardian_ids.filter((g) => g !== id)
        : [...prev.guardian_ids, id],
    }));
  };

  const handleGuardianCreated = (newGuardian) => {
    setGuardians((prev) => [...prev, newGuardian]);
    setForm((prev) => ({ ...prev, guardian_ids: [...prev.guardian_ids, newGuardian.id] }));
    setShowGuardianForm(false);
  };

  const buildPayload = () => ({
    name:            form.name,
    email:           form.email,
    phone:           form.phone,
    registration_no: form.registration_no,
    batch_id:        form.batch_id,
    password:        form.password,
    guardian_ids:    form.guardian_ids,
  });

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (selectedStudent) {
        await onUpdate(selectedStudent.id, buildPayload());
      } else {
        await onInsert(buildPayload());
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Input label="Full name" name="name" required value={form.name} onChange={handleChange} placeholder="e.g. Kamal Perera" />
        <Input label="Registration no" name="registration_no" required value={form.registration_no} onChange={handleChange} placeholder="e.g. STU2024001" />
        <Input label="Email" type="email" name="email" required value={form.email} onChange={handleChange} placeholder="student@email.com" />
        <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+94771234567" />

        <Select label="Batch" name="batch_id" required value={form.batch_id} onChange={handleChange}>
          <option value="">Select batch</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>

        <Input
          label={selectedStudent ? "Password (leave blank to keep current)" : "Password"}
          type="password"
          name="password"
          required={!selectedStudent}
          value={form.password}
          onChange={handleChange}
          placeholder={selectedStudent ? "Enter new password" : "Set login password"}
        />
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-ink-soft">Guardians</label>
          <button onClick={() => setShowGuardianForm(true)} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            + Add guardian
          </button>
        </div>

        {showGuardianForm && (
          <GuardianForm onCreated={handleGuardianCreated} onCancel={() => setShowGuardianForm(false)} />
        )}

        <div className="max-h-44 overflow-y-auto scroll-thin rounded-xl border border-ink/[0.06] bg-paper-soft p-3">
          {loadingGuardians ? (
            <p className="text-sm text-ink-faint">Loading guardians…</p>
          ) : guardians.length === 0 ? (
            <p className="text-sm text-ink-faint">No guardians yet. Add one above.</p>
          ) : guardians.map((g) => (
            <label key={g.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-ink-soft transition-colors hover:bg-surface">
              <input
                type="checkbox"
                checked={form.guardian_ids.includes(g.id)}
                onChange={() => toggleGuardian(g.id)}
                className="h-4 w-4 rounded border-ink/20 accent-brand-600"
              />
              <div>
                <div className="text-sm font-medium text-ink">{g.name}</div>
                {g.email && <div className="text-xs text-ink-faint">{g.email}</div>}
              </div>
            </label>
          ))}
        </div>
        <p className="text-xs text-ink-faint mt-2">{form.guardian_ids.length} guardian(s) selected</p>
      </div>

      <div className="flex gap-3 pt-4 border-t border-ink/[0.06]">
        <Button variant="outline" size="md" onClick={onCancel}>Cancel</Button>
        <Button variant="brand" size="md" disabled={saving} onClick={handleSubmit}>
          {saving ? 'Saving…' : selectedStudent ? 'Save changes' : 'Create student'}
        </Button>
      </div>
    </div>
  );
}
