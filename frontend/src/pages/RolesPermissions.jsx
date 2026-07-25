import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Pencil, Trash2, ShieldCheck, KeyRound } from "lucide-react";
import RoleForm from "../components/roles/RoleForm";
import { fetchRoles, fetchPermissions, deleteRole } from "../services/roleService";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import StatCard from "../components/StatCard";
import { SkeletonRows } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import { usePermissions } from "../auth/PermissionsContext";

export default function RolesPermissions() {
  const { can } = usePermissions();
  const [roles, setRoles] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [activeTab, setActiveTab] = useState("roles");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [r, p] = await Promise.all([fetchRoles(), fetchPermissions()]);
        if (!ignore) {
          setRoles(r);
          setPermissionGroups(p);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  const visibleRoles = useMemo(
    () => roles.filter((r) => r.name.toUpperCase() !== 'SUPER_ADMIN'),
    [roles]
  );

  const stats = useMemo(() => {
    const totalPermissions = permissionGroups.reduce((sum, g) => sum + g.permissions.length, 0);
    return { roles: roles.length, permissions: totalPermissions };
  }, [roles, permissionGroups]);

  const handleFormSuccess = (saved) => {
    setRoles((prev) => {
      const exists = prev.find((r) => r.id === saved.id);
      return exists ? prev.map((r) => (r.id === saved.id ? saved : r)) : [...prev, saved];
    });
    closeForm();
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingRole(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRole(deleteTarget.id);
      setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast.success('Role deleted.');
      setDeleteTarget(null);
    } catch {
      toast.error('Could not delete role.');
    } finally {
      setDeleting(false);
    }
  };

  const formatName = (name) => name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const TABS = ["roles", "permissions"];

  return (
    <div className="min-h-screen bg-paper-soft p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          title="Roles & permissions"
          subtitle="Define roles and control what each one can access"
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <StatCard label="Total roles" value={stats.roles} tone="brand" icon={ShieldCheck} />
          <StatCard label="Total permissions" value={stats.permissions} tone="ocean" icon={KeyRound} />
        </div>

        <div className="flex gap-1 border-b border-ink/[0.06]">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-ink-faint hover:text-ink-soft"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <SkeletonRows rows={4} />
        ) : (
          <>
            {activeTab === "roles" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <Card padding="p-0" className="overflow-hidden">
                  <div className="px-6 py-4 border-b border-ink/[0.06]">
                    <p className="text-xs font-semibold tracking-widest text-ink-faint uppercase">
                      {visibleRoles.length} role{visibleRoles.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-ink/[0.02] border-b border-ink/[0.06]">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider">Permissions</th>
                        <th className="px-6 py-3 w-24" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/[0.05]">
                      {visibleRoles.map((role) => (
                        <tr key={role.id} className="group hover:bg-ink/[0.02] transition-colors">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                                <ShieldCheck size={14} />
                              </div>
                              <span className="font-medium text-ink capitalize">{role.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-ink-faint tabular-nums">
                            {role.permissions.length} permission{role.permissions.length !== 1 ? "s" : ""}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {can('edit_role') && (
                                <button
                                  onClick={() => handleEdit(role)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-brand-700 hover:bg-brand-50 transition-colors"
                                  aria-label="Edit role"
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                              {can('delete_role') && (
                                <button
                                  onClick={() => setDeleteTarget(role)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-danger hover:bg-red-50 transition-colors"
                                  aria-label="Delete role"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </motion.div>
            )}

            {activeTab === "permissions" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-4">
                {permissionGroups.map((group) => (
                  <Card key={group.module} padding="p-0" className="overflow-hidden">
                    <div className="px-5 py-3 bg-brand-50 border-b border-ink/[0.06] flex items-center gap-2">
                      <ShieldCheck size={13} className="text-brand-600" />
                      <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">{group.module}</span>
                    </div>
                    <div className="px-5 py-3 flex flex-wrap gap-2">
                      {group.permissions.map((p) => (
                        <Badge key={p.id} tone="brand">{formatName(p.name)}</Badge>
                      ))}
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title="Edit role"
        width="max-w-2xl"
      >
        <RoleForm
          key={editingRole?.id ?? "new"}
          editingRole={editingRole}
          permissionGroups={permissionGroups}
          onSuccess={handleFormSuccess}
          onCancel={closeForm}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this role?"
        message={deleteTarget ? `"${deleteTarget.name}" will be permanently removed.` : ''}
        loading={deleting}
      />
    </div>
  );
}
