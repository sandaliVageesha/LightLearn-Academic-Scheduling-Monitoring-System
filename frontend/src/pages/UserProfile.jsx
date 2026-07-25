// src/pages/UserProfile.jsx
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Shield, Save, Lock,
  Eye, EyeOff, Pencil, X, Camera
} from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";

function InputField({ label, icon: Icon, type = "text", value, onChange, disabled, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-soft mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-ink/10 bg-surface
                     outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500
                     disabled:bg-paper-soft disabled:text-ink-faint transition-all"
        />
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-ink-soft mb-1.5">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-ink/10 bg-surface
                     outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-soft"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState("profile");
  const [editMode, setEditMode]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const fileRef                   = useRef();
  const toast = useToast();

  const [profile, setProfile] = useState({ username: "", email: "", role: "", profile_picture: null });
  const [form, setForm] = useState({ username: "", email: "" });
  const [previewUrl, setPreviewUrl]     = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

  useEffect(() => {
    api.get("/user/profile/")
      .then((res) => {
        setProfile({
          username:        res.data.username,
          email:           res.data.email,
          role:            res.data.role,
          profile_picture: res.data.profile_picture,
        });
        setForm({ username: res.data.username, email: res.data.email });
        if (res.data.profile_picture) setPreviewUrl(res.data.profile_picture);
      })
      .catch(() => toast.error("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleCancelEdit = () => {
    setForm({ username: profile.username, email: profile.email });
    setPreviewUrl(profile.profile_picture || null);
    setSelectedFile(null);
    setEditMode(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.patch("/user/profile/", { username: form.username, email: form.email });
      const updated = res.data.user;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('profile_picture', selectedFile);
        const picRes = await api.post("/user/profile/picture/", formData);
        if (picRes.data.profile_picture) {
          setPreviewUrl(picRes.data.profile_picture);
          setProfile((p) => ({ ...p, profile_picture: picRes.data.profile_picture }));
        }
      }

      setProfile((p) => ({ ...p, username: updated.username, email: updated.email }));
      setForm({ username: updated.username, email: updated.email });
      setSelectedFile(null);
      setEditMode(false);
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return toast.error("New passwords do not match.");
    if (passwords.new.length < 8) return toast.error("Password must be at least 8 characters.");

    setSaving(true);
    try {
      await api.post("/user/profile/change-password/", {
        current_password: passwords.current,
        new_password:     passwords.new,
        confirm_password: passwords.confirm,
      });
      setPasswords({ current: "", new: "", confirm: "" });
      toast.success("Password changed successfully.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  const passwordStrength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8)           s++;
    if (/[A-Z]/.test(pw))        s++;
    if (/[0-9]/.test(pw))        s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const strength      = passwordStrength(passwords.new);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", "bg-danger", "bg-warning", "bg-brand-400", "bg-success"];

  const tabs = [
    { id: "profile",  label: "Profile",  icon: User },
    { id: "security", label: "Security", icon: Lock },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-ink-faint text-sm">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-paper-soft p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <PageHeader title="My profile" subtitle="View and manage your account information" />

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Card className="mb-6">
            <div className="flex items-center gap-5 flex-wrap">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-xl font-display font-bold overflow-hidden">
                  {editMode && previewUrl
                    ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    : profile.profile_picture
                      ? <img src={profile.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                      : profile.username?.slice(0, 2).toUpperCase()}
                </div>
                {editMode && (
                  <>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-brand-600 text-white rounded-lg flex items-center justify-center shadow-lift hover:bg-brand-700 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-display font-bold text-ink">{profile.username}</h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700">
                    <Shield className="w-3 h-3" /> {profile.role}
                  </span>
                </div>
                <p className="text-sm text-ink-faint mt-0.5">{profile.email}</p>
              </div>

              <Button
                variant={editMode ? 'outline' : 'brand'}
                size="md"
                icon={editMode ? X : Pencil}
                onClick={() => (editMode ? handleCancelEdit() : setEditMode(true))}
              >
                {editMode ? 'Cancel' : 'Edit profile'}
              </Button>
            </div>
          </Card>

          <Card padding="p-0" className="overflow-hidden">
            <div className="flex border-b border-ink/[0.06]">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === id
                      ? "border-brand-600 text-brand-700 bg-brand-50/60"
                      : "border-transparent text-ink-faint hover:text-ink-soft hover:bg-ink/[0.02]"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "profile" && (
                <div className="space-y-5 max-w-md">
                  <InputField label="Username" icon={User} value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} disabled={!editMode} />
                  <InputField label="Email address" icon={Mail} type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} disabled={!editMode} />
                  <InputField label="Role" icon={Shield} value={profile.role} disabled />
                  {editMode && (
                    <Button variant="brand" size="md" icon={Save} disabled={saving} onClick={handleSaveProfile}>
                      {saving ? "Saving…" : "Save changes"}
                    </Button>
                  )}
                </div>
              )}

              {activeTab === "security" && (
                <div className="max-w-md">
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <h3 className="text-sm font-semibold text-ink-soft mb-4">Change password</h3>
                    <PasswordField label="Current password" value={passwords.current} onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} placeholder="Enter current password" />
                    <PasswordField label="New password" value={passwords.new} onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))} placeholder="Min. 8 characters" />
                    {passwords.new && (
                      <div>
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : "bg-ink/10"}`} />
                          ))}
                        </div>
                        <p className="text-xs text-ink-faint">{strengthLabel[strength]}</p>
                      </div>
                    )}
                    <PasswordField label="Confirm new password" value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password" />
                    <Button type="submit" variant="brand" size="md" icon={Lock} disabled={saving}>
                      {saving ? "Updating…" : "Update password"}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
