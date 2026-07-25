import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, ClipboardList, LogIn, Search, Download } from 'lucide-react';
import maintenanceService from '../../services/maintenanceService';
import { ACTION_BADGE, MODULE_LABEL, formatTimestamp } from '../../utils/maintenanceFormat';
import usePagination from '../../hooks/usePagination';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import Tabs from '../../components/ui/Tabs';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';

const PAGE_SIZE = 10;

export default function Maintenance() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('audit-logs');

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditSearch, setAuditSearch] = useState('');

  const [logins, setLogins] = useState([]);
  const [loginsLoading, setLoginsLoading] = useState(true);
  const [loginSearch, setLoginSearch] = useState('');
  const [loginActionFilter, setLoginActionFilter] = useState('');

  const [downloading, setDownloading] = useState(null);

  const auditPager = usePagination(auditLogs, PAGE_SIZE);
  const loginPager = usePagination(logins, PAGE_SIZE);

  useEffect(() => {
    if (activeTab !== 'audit-logs') return;
    let ignore = false;
    const timer = setTimeout(async () => {
      setAuditLoading(true);
      try {
        const data = await maintenanceService.getAuditLogs({ search: auditSearch || undefined });
        if (!ignore) {
          setAuditLogs(data);
          auditPager.setPage(1);
        }
      } catch {
        if (!ignore) toast.error('Failed to load audit logs.');
      } finally {
        if (!ignore) setAuditLoading(false);
      }
    }, 250);
    return () => { ignore = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, auditSearch]);

  useEffect(() => {
    if (activeTab !== 'login-activity') return;
    let ignore = false;
    const timer = setTimeout(async () => {
      setLoginsLoading(true);
      try {
        const data = await maintenanceService.getLoginActivity({
          search: loginSearch || undefined,
          action: loginActionFilter || undefined,
        });
        if (!ignore) {
          setLogins(data);
          loginPager.setPage(1);
        }
      } catch {
        if (!ignore) toast.error('Failed to load login activity.');
      } finally {
        if (!ignore) setLoginsLoading(false);
      }
    }, 250);
    return () => { ignore = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, loginSearch, loginActionFilter]);

  async function handleDownloadReport(type) {
    setDownloading(type);
    try {
      const res = await maintenanceService.downloadReport(type);
      const disposition = res.headers?.['content-disposition'] ?? '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `lightlearn-maintenance-report.${type}`;

      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded.');
    } catch {
      toast.error('Failed to download report.');
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Maintenance"
        subtitle="Audit logs and login activity across the platform"
        actions={
          <>
            <Button
              variant="outline"
              icon={Download}
              onClick={() => handleDownloadReport('csv')}
              disabled={Boolean(downloading)}
            >
              {downloading === 'csv' ? 'Preparing…' : 'Download CSV'}
            </Button>
            <Button
              variant="outline"
              icon={Download}
              onClick={() => handleDownloadReport('pdf')}
              disabled={Boolean(downloading)}
            >
              {downloading === 'pdf' ? 'Preparing…' : 'Download PDF'}
            </Button>
          </>
        }
      />

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        layoutId="maintenance-tabs"
        items={[
          { value: 'audit-logs', label: 'Audit Logs', icon: ClipboardList },
          { value: 'login-activity', label: 'Login Activity', icon: LogIn },
        ]}
        className="mb-5"
      />

      {activeTab === 'audit-logs' && (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search by actor or email…"
                className="pl-8 pr-3 py-2 text-sm rounded-xl border border-ink/10 bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/30 w-64"
              />
            </div>
            <span className="text-xs text-ink-faint ml-auto">{auditLogs.length} entries</span>
          </div>

          {auditLoading ? (
            <SkeletonRows rows={6} />
          ) : auditLogs.length === 0 ? (
            <Card padding="p-0">
              <EmptyState
                icon={Wrench}
                title="No audit log entries"
                message="Institution create, update, delete, and approval actions will show up here."
              />
            </Card>
          ) : (
            <Card padding="p-0" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ink/[0.02] border-b border-ink/[0.06]">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider">Actor</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider">Module</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider">Date &amp; Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/[0.05]">
                    {auditPager.pageItems.map((log, i) => {
                      const badge = ACTION_BADGE[log.action] ?? { tone: 'neutral', label: log.action };
                      return (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: Math.min(i, 8) * 0.02 }}
                          className="hover:bg-ink/[0.02] transition-colors"
                        >
                          <td className="px-6 py-3 text-ink-soft font-medium">{log.actor_name}</td>
                          <td className="px-6 py-3 text-ink-faint">{log.actor_email ?? '—'}</td>
                          <td className="px-6 py-3"><Badge tone={badge.tone}>{badge.label}</Badge></td>
                          <td className="px-6 py-3 text-ink-faint">{MODULE_LABEL[log.module] ?? log.module}</td>
                          <td className="px-6 py-3 text-ink-faint whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={auditPager.page} totalPages={auditPager.totalPages} onChange={auditPager.setPage} />
            </Card>
          )}
        </>
      )}

      {activeTab === 'login-activity' && (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={loginSearch}
                onChange={(e) => setLoginSearch(e.target.value)}
                placeholder="Search by email…"
                className="pl-8 pr-3 py-2 text-sm rounded-xl border border-ink/10 bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/30 w-64"
              />
            </div>
            <select
              value={loginActionFilter}
              onChange={(e) => setLoginActionFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-ink/10 bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="">All actions</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>
            <span className="text-xs text-ink-faint ml-auto">{logins.length} entries</span>
          </div>

          {loginsLoading ? (
            <SkeletonRows rows={6} />
          ) : logins.length === 0 ? (
            <Card padding="p-0">
              <EmptyState
                icon={LogIn}
                title="No login activity"
                message="Sign-ins and sign-outs across all accounts will show up here."
              />
            </Card>
          ) : (
            <Card padding="p-0" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ink/[0.02] border-b border-ink/[0.06]">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider">IP Address</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider">Date &amp; Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/[0.05]">
                    {loginPager.pageItems.map((entry, i) => {
                      const badge = ACTION_BADGE[entry.action] ?? { tone: 'neutral', label: entry.action };
                      return (
                        <motion.tr
                          key={entry.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: Math.min(i, 8) * 0.02 }}
                          className="hover:bg-ink/[0.02] transition-colors"
                        >
                          <td className="px-6 py-3 text-ink-soft font-medium">{entry.email}</td>
                          <td className="px-6 py-3"><Badge tone={badge.tone}>{badge.label}</Badge></td>
                          <td className="px-6 py-3 text-ink-faint">{entry.ip_address ?? '—'}</td>
                          <td className="px-6 py-3 text-ink-faint whitespace-nowrap">{formatTimestamp(entry.timestamp)}</td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={loginPager.page} totalPages={loginPager.totalPages} onChange={loginPager.setPage} />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
