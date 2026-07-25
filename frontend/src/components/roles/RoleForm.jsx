import { useState } from "react";
import PermissionTransfer from "./PermissionTransfer";
import { createRole, updateRole } from "../../services/roleService";
import Button from "../ui/Button";
import { Input } from "../ui/Field";

const DEFAULT_ROLES = ["owner", "admin", "manager", "educator", "student", "parent"];

export default function RoleForm({ editingRole, permissionGroups, onSuccess, onCancel }) {
  const isEditing = !!editingRole;

  const initialRoleName = editingRole
    ? (DEFAULT_ROLES.includes(editingRole.name) ? editingRole.name : "custom")
    : "";
  const initialCustomName = editingRole
    ? (DEFAULT_ROLES.includes(editingRole.name) ? "" : editingRole.name)
    : "";
  const initialPerms = editingRole ? new Set(editingRole.permissions) : new Set();

  const [roleName, setRoleName] = useState(initialRoleName);
  const [customName, setCustomName] = useState(initialCustomName);
  const [selectedPerms, setSelectedPerms] = useState(initialPerms);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const resolvedName = roleName === "custom" ? customName.trim() : roleName;

  const handleSubmit = async () => {
    setError(null);
    if (!resolvedName) {
      setError("Please select or enter a role name.");
      return;
    }
    setSaving(true);
    try {
      const payload = { name: resolvedName, permissions: [...selectedPerms] };
      const saved = isEditing
        ? await updateRole(editingRole.id, payload)
        : await createRole(payload);
      onSuccess(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-ink-faint -mt-2">
        {isEditing ? "Update the role name and its permission set." : "Choose a role and assign the permissions it should have."}
      </p>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-ink-faint uppercase tracking-wider">Role</label>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_ROLES.map((r) => (
            <button
              key={r}
              onClick={() => { setRoleName(r); setCustomName(""); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${
                roleName === r
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-surface text-brand-700 border-ink/10 hover:border-brand-300"
              }`}
            >
              {r}
            </button>
          ))}
          <button
            onClick={() => setRoleName("custom")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              roleName === "custom"
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-surface text-brand-700 border-ink/10 hover:border-brand-300"
            }`}
          >
            + Custom
          </button>
        </div>

        {roleName === "custom" && (
          <Input
            placeholder="Enter custom role name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            wrapperClassName="mt-2 max-w-xs"
          />
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-ink-faint uppercase tracking-wider">
          Permissions
          <span className="ml-2 text-brand-500 normal-case font-normal">{selectedPerms.size} assigned</span>
        </label>
        <PermissionTransfer groups={permissionGroups} selected={selectedPerms} onChange={setSelectedPerms} />
      </div>

      {error && (
        <p className="text-sm text-danger bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg px-4 py-2">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-ink/[0.06]">
        <Button variant="outline" size="md" onClick={onCancel}>Cancel</Button>
        <Button variant="brand" size="md" disabled={saving} onClick={handleSubmit}>
          {saving ? "Saving…" : isEditing ? "Save changes" : "Create role"}
        </Button>
      </div>
    </div>
  );
}
