// src/pages/superadmin/Settings.jsx
import { useState } from "react";
import {
  Globe, Mail, Shield,
  Palette, Database, Save, RefreshCw,
  CheckCircle,
  Server, Zap, FileText,
} from "lucide-react";

const TABS = [
  { id: "general", label: "General", icon: Globe },
  { id: "email", label: "Email", icon: Mail },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "system", label: "System", icon: Server },
];

function SectionCard({ title, description, children }) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-ink/[0.06] overflow-hidden">
      {(title || description) && (
        <div className="px-6 py-4 border-b border-ink/[0.06]">
          {title && <h3 className="text-base font-semibold text-ink">{title}</h3>}
          {description && <p className="text-sm text-ink-faint mt-0.5">{description}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-ink/[0.04] last:border-0">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && <p className="text-xs text-ink-faint mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${checked ? "bg-brand-600" : "bg-ink/10"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-surface rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function InputRow({ label, description, value, onChange, type = "text", placeholder }) {
  return (
    <div className="py-3 border-b border-ink/[0.04] last:border-0">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{label}</p>
          {description && <p className="text-xs text-ink-faint mt-0.5">{description}</p>}
        </div>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full sm:w-64 px-3 py-2 text-sm rounded-xl border border-ink/10 bg-paper-soft focus:outline-none focus:ring-2 focus:ring-[#395886]/30"
        />
      </div>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // State per section
  const [general, setGeneral] = useState({
    platformName: "EduPlatform",
    supportEmail: "support@eduplatform.io",
    website: "https://eduplatform.io",
    timezone: "UTC",
    maintenanceMode: false,
    registrationOpen: true,
    requireEmailVerification: true,
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: "smtp.sendgrid.net",
    smtpPort: "587",
    smtpUser: "apikey",
    fromName: "EduPlatform",
    fromEmail: "no-reply@eduplatform.io",
    welcomeEmail: true,
    subscriptionReminders: true,
    paymentReceipts: true,
  });

  const [security, setSecurity] = useState({
    twoFactorRequired: false,
    sessionTimeout: "30",
    maxLoginAttempts: "5",
    ipWhitelist: false,
    auditLog: true,
    passwordExpiry: false,
  });

  const [appearance, setAppearance] = useState({
    primaryColor: "#395886",
    accentColor: "#F0F3FA",
    logoUrl: "",
    faviconUrl: "",
    darkMode: false,
    customCss: false,
  });

  return (
    <div className="min-h-screen bg-paper-soft p-4 md:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white animate-fade-in
          ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
          <CheckCircle className="w-4 h-4" />
          {toast.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-ink">Platform Settings</h1>
          <p className="text-sm text-ink-faint mt-1">Configure and manage your platform-wide settings</p>
        </div>

        <div className="flex gap-6 flex-col md:flex-row">
          {/* Sidebar Nav */}
          <div className="md:w-52 shrink-0">
            <div className="bg-surface rounded-2xl shadow-sm border border-ink/[0.06] p-2 md:sticky md:top-6">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                    activeTab === id
                      ? "bg-brand-600 text-white"
                      : "text-ink-soft hover:bg-paper-soft hover:text-ink"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-5">

            {/* ── General ── */}
            {activeTab === "general" && (
              <>
                <SectionCard title="Platform Identity" description="Basic information about your platform">
                  <div className="space-y-0">
                    <InputRow
                      label="Platform Name"
                      value={general.platformName}
                      onChange={(e) => setGeneral(g => ({ ...g, platformName: e.target.value }))}
                      placeholder="My Platform"
                    />
                    <InputRow
                      label="Support Email"
                      type="email"
                      value={general.supportEmail}
                      onChange={(e) => setGeneral(g => ({ ...g, supportEmail: e.target.value }))}
                    />
                    <InputRow
                      label="Website URL"
                      value={general.website}
                      onChange={(e) => setGeneral(g => ({ ...g, website: e.target.value }))}
                    />
                  </div>
                </SectionCard>

                <SectionCard title="Registration & Access" description="Control who can join the platform">
                  <ToggleRow
                    label="Open Registration"
                    description="Allow new institutions to register on their own"
                    checked={general.registrationOpen}
                    onChange={(v) => setGeneral(g => ({ ...g, registrationOpen: v }))}
                  />
                  <ToggleRow
                    label="Require Email Verification"
                    description="New accounts must verify their email before access"
                    checked={general.requireEmailVerification}
                    onChange={(v) => setGeneral(g => ({ ...g, requireEmailVerification: v }))}
                  />
                  <ToggleRow
                    label="Maintenance Mode"
                    description="Show maintenance page to all visitors except admins"
                    checked={general.maintenanceMode}
                    onChange={(v) => setGeneral(g => ({ ...g, maintenanceMode: v }))}
                  />
                </SectionCard>

                <div className="flex justify-end">
                  <button
                    onClick={() => showToast("General settings saved.")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </>
            )}

            {/* ── Email ── */}
            {activeTab === "email" && (
              <>
                <SectionCard title="SMTP Configuration" description="Outgoing mail server settings">
                  <div className="space-y-0">
                    <InputRow label="SMTP Host" value={emailSettings.smtpHost} onChange={(e) => setEmailSettings(s => ({ ...s, smtpHost: e.target.value }))} />
                    <InputRow label="SMTP Port" value={emailSettings.smtpPort} onChange={(e) => setEmailSettings(s => ({ ...s, smtpPort: e.target.value }))} />
                    <InputRow label="SMTP Username" value={emailSettings.smtpUser} onChange={(e) => setEmailSettings(s => ({ ...s, smtpUser: e.target.value }))} />
                    <InputRow label="From Name" value={emailSettings.fromName} onChange={(e) => setEmailSettings(s => ({ ...s, fromName: e.target.value }))} />
                    <InputRow label="From Email" type="email" value={emailSettings.fromEmail} onChange={(e) => setEmailSettings(s => ({ ...s, fromEmail: e.target.value }))} />
                  </div>
                </SectionCard>

                <SectionCard title="Automated Emails" description="Control which emails are sent automatically">
                  <ToggleRow label="Welcome Email" description="Send welcome email when institution registers" checked={emailSettings.welcomeEmail} onChange={(v) => setEmailSettings(s => ({ ...s, welcomeEmail: v }))} />
                  <ToggleRow label="Subscription Reminders" description="Remind institutions before their plan expires" checked={emailSettings.subscriptionReminders} onChange={(v) => setEmailSettings(s => ({ ...s, subscriptionReminders: v }))} />
                  <ToggleRow label="Payment Receipts" description="Send receipt after successful payment" checked={emailSettings.paymentReceipts} onChange={(v) => setEmailSettings(s => ({ ...s, paymentReceipts: v }))} />
                </SectionCard>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => showToast("Test email sent to your inbox.")}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-brand-700 border border-brand-200 hover:bg-brand-50 transition-colors"
                  >
                    <Zap className="w-4 h-4" /> Send Test Email
                  </button>
                  <button
                    onClick={() => showToast("Email settings saved.")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </>
            )}

            {/* ── Security ── */}
            {activeTab === "security" && (
              <>
                <SectionCard title="Authentication" description="Login and session security settings">
                  <ToggleRow label="Require 2FA for Admins" description="All admin accounts must use two-factor authentication" checked={security.twoFactorRequired} onChange={(v) => setSecurity(s => ({ ...s, twoFactorRequired: v }))} />
                  <ToggleRow label="IP Whitelist" description="Restrict admin access to specific IP addresses" checked={security.ipWhitelist} onChange={(v) => setSecurity(s => ({ ...s, ipWhitelist: v }))} />
                  <ToggleRow label="Password Expiry (90 days)" description="Force password reset every 90 days" checked={security.passwordExpiry} onChange={(v) => setSecurity(s => ({ ...s, passwordExpiry: v }))} />
                  <InputRow label="Session Timeout (minutes)" value={security.sessionTimeout} onChange={(e) => setSecurity(s => ({ ...s, sessionTimeout: e.target.value }))} type="number" />
                  <InputRow label="Max Login Attempts" value={security.maxLoginAttempts} onChange={(e) => setSecurity(s => ({ ...s, maxLoginAttempts: e.target.value }))} type="number" />
                </SectionCard>

                <SectionCard title="Audit & Compliance" description="Logging and compliance settings">
                  <ToggleRow label="Audit Log" description="Track all admin actions with timestamps" checked={security.auditLog} onChange={(v) => setSecurity(s => ({ ...s, auditLog: v }))} />
                  <div className="py-3">
                    <button
                      onClick={() => showToast("Audit log exported.")}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-ink-soft border border-ink/10 hover:bg-ink/[0.03] transition-colors"
                    >
                      <FileText className="w-4 h-4" /> Export Audit Log
                    </button>
                  </div>
                </SectionCard>

                <div className="flex justify-end">
                  <button
                    onClick={() => showToast("Security settings saved.")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </>
            )}

            {/* ── Appearance ── */}
            {activeTab === "appearance" && (
              <>
                <SectionCard title="Branding" description="Customize the platform's visual identity">
                  <div className="space-y-0">
                    <div className="py-3 border-b border-ink/[0.04]">
                      <p className="text-sm font-medium text-ink mb-3">Primary Color</p>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={appearance.primaryColor}
                          onChange={(e) => setAppearance(a => ({ ...a, primaryColor: e.target.value }))}
                          className="w-10 h-10 rounded-xl border-2 border-ink/10 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={appearance.primaryColor}
                          onChange={(e) => setAppearance(a => ({ ...a, primaryColor: e.target.value }))}
                          className="w-32 px-3 py-2 text-sm rounded-xl border border-ink/10 bg-paper-soft focus:outline-none focus:ring-2 focus:ring-[#395886]/30 font-mono"
                        />
                        <div className="flex gap-2">
                          {["#395886", "#4a7c59", "#7b4f9e", "#c0392b", "#2c3e50"].map((c) => (
                            <button
                              key={c}
                              onClick={() => setAppearance(a => ({ ...a, primaryColor: c }))}
                              className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110"
                              style={{
                                backgroundColor: c,
                                borderColor: appearance.primaryColor === c ? c : "transparent",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <InputRow label="Logo URL" placeholder="https://…/logo.png" value={appearance.logoUrl} onChange={(e) => setAppearance(a => ({ ...a, logoUrl: e.target.value }))} />
                    <InputRow label="Favicon URL" placeholder="https://…/favicon.ico" value={appearance.faviconUrl} onChange={(e) => setAppearance(a => ({ ...a, faviconUrl: e.target.value }))} />
                    <ToggleRow label="Dark Mode" description="Enable dark theme across the platform" checked={appearance.darkMode} onChange={(v) => setAppearance(a => ({ ...a, darkMode: v }))} />
                    <ToggleRow label="Custom CSS" description="Allow injecting custom CSS overrides" checked={appearance.customCss} onChange={(v) => setAppearance(a => ({ ...a, customCss: v }))} />
                  </div>
                </SectionCard>

                {/* Live preview */}
                <SectionCard title="Preview" description="See how your primary color looks">
                  <div className="flex flex-wrap gap-3">
                    <button
                      className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors"
                      style={{ backgroundColor: appearance.primaryColor }}
                    >
                      Primary Button
                    </button>
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ backgroundColor: `${appearance.primaryColor}18`, color: appearance.primaryColor }}
                    >
                      Badge
                    </span>
                    <div
                      className="w-6 h-6 rounded-lg"
                      style={{ backgroundColor: appearance.primaryColor }}
                    />
                  </div>
                </SectionCard>

                <div className="flex justify-end">
                  <button
                    onClick={() => showToast("Appearance settings saved.")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </>
            )}

            {/* ── System ── */}
            {activeTab === "system" && (
              <>
                <SectionCard title="System Information" description="Platform health and version info">
                  <div className="space-y-3">
                    {[
                      { label: "Platform Version", value: "v2.4.1" },
                      { label: "Node.js", value: "20.11.0 LTS" },
                      { label: "Database", value: "PostgreSQL 15.2" },
                      { label: "Storage Used", value: "14.3 GB / 100 GB" },
                      { label: "Last Backup", value: "Today at 3:00 AM" },
                      { label: "Uptime", value: "99.98% (30 days)" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-2 border-b border-ink/[0.04] last:border-0">
                        <span className="text-sm text-ink-faint">{label}</span>
                        <span className="text-sm font-medium text-ink font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Maintenance Actions" description="System maintenance and data operations">
                  <div className="space-y-3">
                    {[
                      { icon: Database, label: "Backup Database", desc: "Create a full database snapshot", action: () => showToast("Backup started…") },
                      { icon: RefreshCw, label: "Clear Cache", desc: "Flush all server-side caches", action: () => showToast("Cache cleared.") },
                      { icon: FileText, label: "Download Logs", desc: "Export system logs as .zip", action: () => showToast("Logs downloaded.") },
                    ].map(({ icon: Icon, label, desc, action }) => (
                      <div key={label} className="flex items-center justify-between p-3 rounded-xl border border-ink/[0.06] hover:bg-paper-soft/60 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-brand-700" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-ink">{label}</p>
                            <p className="text-xs text-ink-faint">{desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={action}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-brand-700 border border-brand-600/20 hover:bg-brand-50 transition-colors"
                        >
                          Run
                        </button>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Danger Zone" description="Irreversible platform actions">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-red-100 dark:border-red-500/20 bg-red-50/40 dark:bg-red-500/10">
                      <div>
                        <p className="text-sm font-medium text-red-700 dark:text-red-400">Reset All Settings</p>
                        <p className="text-xs text-red-500 dark:text-red-400/80">Restore all settings to factory defaults</p>
                      </div>
                      <button
                        onClick={() => showToast("Settings reset to defaults.", "warning")}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/15 transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </SectionCard>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}