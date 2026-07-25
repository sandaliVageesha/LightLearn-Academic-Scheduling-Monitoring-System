import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Users, UserCog } from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import StatCard from "../components/StatCard";
import { Input, Select } from "../components/ui/Field";
import { SkeletonRows } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import { usePermissions } from "../auth/PermissionsContext";

const initialForm = { name: "", email: "", password: "", institution_id: "" };

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

export default function ManagerManagement() {
  const { can } = usePermissions();
  const toast = useToast();

  const [managers, setManagers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchManagers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/managers/');
      setManagers(res.data);
    } catch {
      toast.error("Could not load managers. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const res = await api.get('/institutions/');
      setInstitutions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Institutions error:', e);
    }
  };

  useEffect(() => {
    fetchManagers();
    fetchInstitutions();
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const stats = useMemo(() => ({ total: managers.length }), [managers]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      name: m.name,
      email: m.user?.email || "",
      password: "",
      institution_id: m.institution?.id || "",
    });
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormError("");
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.institution_id || (!editing && !form.password)) {
      setFormError("Name, email, institution" + (editing ? "" : " and password") + " are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        name: form.name,
        email: form.email,
        institution_id: parseInt(form.institution_id, 10),
      };
      if (form.password) payload.password = form.password;

      if (editing) {
        await api.put(`/managers/${editing.id}/`, payload);
        toast.success('Manager updated.');
      } else {
        await api.post('/managers/', payload);
        toast.success('Manager created.');
      }
      closeForm();
      await fetchManagers();
    } catch (e) {
      setFormError(e.response?.data ? JSON.stringify(e.response.data) : e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/managers/${deleteTarget.id}/`);
      toast.success('Manager deleted.');
      setDeleteTarget(null);
      await fetchManagers();
    } catch (e) {
      toast.error("Delete failed: " + e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper-soft p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          title="Manager management"
          subtitle="Institution managers who oversee day-to-day operations"
          actions={can('create_manager') && (
            <Button variant="brand" size="md" icon={Plus} onClick={openCreate}>
              Add manager
            </Button>
          )}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <StatCard label="Total managers" value={stats.total} tone="brand" icon={UserCog} />
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Card padding="p-0" className="overflow-hidden">
            <div className="px-6 py-4 border-b border-ink/[0.06]">
              <p className="text-xs font-semibold tracking-widest text-ink-faint uppercase">Manager list</p>
            </div>

            {loading ? (
              <div className="p-6"><SkeletonRows rows={5} /></div>
            ) : managers.length === 0 ? (
              <EmptyState icon={Users} title="No managers found" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ink/[0.02] border-b border-ink/[0.06]">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider">Institution</th>
                    {(can('edit_manager') || can('delete_manager')) && <th className="px-6 py-3 w-24" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/[0.05]">
                  {managers.map((m) => (
                    <tr key={m.id} className="group hover:bg-ink/[0.02] transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
                            {initials(m.name)}
                          </div>
                          <span className="text-ink font-medium">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-ink-soft">{m.user?.email}</td>
                      <td className="px-6 py-3 text-ink-faint">{m.institution?.name}</td>
                      {(can('edit_manager') || can('delete_manager')) && (
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {can('edit_manager') && (
                              <button
                                onClick={() => openEdit(m)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-brand-700 hover:bg-brand-50 transition-colors"
                                aria-label="Edit manager"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            {can('delete_manager') && (
                              <button
                                onClick={() => setDeleteTarget(m)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-danger hover:bg-red-50 transition-colors"
                                aria-label="Delete manager"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </motion.div>
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? "Edit manager" : "Add manager"}
        footer={(
          <>
            <Button variant="outline" size="md" onClick={closeForm}>Cancel</Button>
            <Button variant="brand" size="md" onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create manager"}
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Name" required value={form.name} onChange={set("name")} />
            <Input label="Email" type="email" required value={form.email} onChange={set("email")} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label={editing ? "Password" : "Password"}
              type="password"
              placeholder={editing ? "Leave blank to keep current" : ""}
              required={!editing}
              value={form.password}
              onChange={set("password")}
            />
            <Select label="Institution" required value={form.institution_id} onChange={set("institution_id")}>
              <option value="">Select institution…</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </Select>
          </div>
          {formError && <p className="text-sm text-danger break-words">{formError}</p>}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete manager"
        message={deleteTarget ? `Delete "${deleteTarget.name}"? This cannot be undone.` : ""}
        loading={deleting}
      />
    </div>
  );
}
