import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, ShieldCheck, KeyRound } from "lucide-react";
import RoleForm from "../../components/roles/RoleForm";
import { fetchRoles, fetchPermissions, deleteRole } from "../../services/roleService";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import Tabs from "../../components/ui/Tabs";
import StatCard from "../../components/StatCard";
import { SkeletonRows } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import { usePermissions } from "../../auth/PermissionsContext";

function formatName(name) {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Roles() {
  const toast = useToast();
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState("roles");

  const [roles, setRoles] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [r, p] = await Promise.all([fetchRoles(), fetchPermissions()]);
        if (!ignore) {
          setRoles(r);
          setPermissionGroups(p);
        }
      } catch {
        if (!ignore) toast.error('Failed to load roles.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPermissions = useMemo(
    () => permissionGroups.reduce((sum, g) => sum + g.permissions.length, 0),
    [permissionGroups]
  );

  function openCreate() {
    setEditingRole(null);
    setFormOpen(true);
  }

  function openEdit(role) {
    setEditingRole(role);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingRole(null);
  }

  function handleFormSuccess(saved) {
    setRoles((prev) => {
      const exists = prev.find((r) => r.id === saved.id);
      return exists ? prev.map((r) => (r.id === saved.id ? saved : r)) : [...prev, saved];
    });
    toast.success(editingRole ? 'Role updated.' : 'Role created.');
    closeForm();
  }

  async function handleDelete() {
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
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Roles"
        subtitle="Every role in the system and the permissions assigned to it"
        actions={
          activeTab === 'roles' && !loading && can('create_role') ? (
            <Button variant="brand" icon={Plus} onClick={openCreate}>
              New role
            </Button>
          ) : undefined
        }
      />

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <StatCard label="Total roles" value={roles.length} tone="brand" icon={ShieldCheck} />
        <StatCard label="Total permissions" value={totalPermissions} tone="ocean" icon={KeyRound} />
      </div>

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        layoutId="roles-tabs"
        items={[
          { value: 'roles', label: 'Roles', icon: ShieldCheck },
          { value: 'permissions', label: 'Permissions', icon: KeyRound },
        ]}
        className="mb-5"
      />

      {loading ? (
        <SkeletonRows rows={5} />
      ) : (
        <>
          {activeTab === 'roles' && (
            roles.length === 0 ? (
              <Card padding="p-0">
                <EmptyState icon={ShieldCheck} title="No roles yet" message="Create the first role to get started." />
              </Card>
            ) : (
              <Card padding="p-0" className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ink/[0.02] border-b border-ink/[0.06]">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider">Permissions</th>
                      <th className="px-6 py-3 w-24" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/[0.05]">
                    {roles.map((role, i) => (
                      <motion.tr
                        key={role.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(i, 8) * 0.02 }}
                        className="group hover:bg-ink/[0.02] transition-colors"
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                              <ShieldCheck size={14} />
                            </div>
                            <span className="font-medium text-ink capitalize">{role.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-ink-faint tabular-nums">
                          {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {can('edit_role') && (
                              <button
                                onClick={() => openEdit(role)}
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
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )
          )}

          {activeTab === 'permissions' && (
            permissionGroups.length === 0 ? (
              <Card padding="p-0">
                <EmptyState icon={KeyRound} title="No permissions defined" />
              </Card>
            ) : (
              <div className="space-y-4">
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
              </div>
            )
          )}
        </>
      )}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingRole ? 'Edit role' : 'Create new role'}
        width="max-w-2xl"
      >
        <RoleForm
          key={editingRole?.id ?? 'new'}
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
