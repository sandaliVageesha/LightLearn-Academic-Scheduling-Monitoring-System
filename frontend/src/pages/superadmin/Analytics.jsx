import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Download, ClipboardList, LogIn } from "lucide-react";
import maintenanceService from "../../services/maintenanceService";
import { ACTION_BADGE, MODULE_LABEL, formatTimestamp } from "../../utils/maintenanceFormat";
import usePagination from "../../hooks/usePagination";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import { SkeletonRows } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";

const PAGE_SIZE = 10;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Analytics() {
  const toast = useToast();
  const [downloading, setDownloading] = useState(null);

  const [institutionRows, setInstitutionRows] = useState([]);
  const [institutionRowsLoading, setInstitutionRowsLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [logins, setLogins] = useState([]);
  const [loginsLoading, setLoginsLoading] = useState(true);

  const institutionPager = usePagination(institutionRows, PAGE_SIZE);
  const auditPager = usePagination(auditLogs, PAGE_SIZE);
  const loginPager = usePagination(logins, PAGE_SIZE);

  useEffect(() => {
    let ignore = false;
    maintenanceService.getInstitutionDetails()
      .then((rows) => { if (!ignore) setInstitutionRows(rows); })
      .catch(() => { if (!ignore) toast.error('Failed to load institution details.'); })
      .finally(() => { if (!ignore) setInstitutionRowsLoading(false); });
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let ignore = false;
    maintenanceService.getAuditLogs()
      .then((rows) => { if (!ignore) setAuditLogs(rows); })
      .catch(() => { if (!ignore) toast.error('Failed to load audit logs.'); })
      .finally(() => { if (!ignore) setAuditLoading(false); });
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let ignore = false;
    maintenanceService.getLoginActivity()
      .then((rows) => { if (!ignore) setLogins(rows); })
      .catch(() => { if (!ignore) toast.error('Failed to load login activity.'); })
      .finally(() => { if (!ignore) setLoginsLoading(false); });
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const downloadActions = (
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
  );

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <PageHeader
        title="Analytics"
        subtitle="System-wide metrics across all institutions"
        actions={downloadActions}
      />

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
            <Building2 className="w-4 h-4 text-ink-faint" />
            Institution Details
          </h2>
          <span className="text-xs text-ink-faint">{institutionRows.length} institutions</span>
        </div>

        {institutionRowsLoading ? (
          <SkeletonRows rows={4} />
        ) : institutionRows.length === 0 ? (
          <Card padding="p-0">
            <EmptyState icon={Building2} title="No institutions yet" />
          </Card>
        ) : (
          <Card padding="p-0" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ink/[0.02] border-b border-ink/[0.06]">
                    {['Institution', 'Owner', 'Status', 'Managers', 'Educators', 'Students', 'Parents', 'Courses', 'Created At'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/[0.05]">
                  {institutionPager.pageItems.map((inst, i) => (
                    <motion.tr
                      key={inst.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(i, 8) * 0.02 }}
                      className="hover:bg-ink/[0.02] transition-colors"
                    >
                      <td className="px-6 py-3 text-ink-soft font-medium whitespace-nowrap">{inst.name}</td>
                      <td className="px-6 py-3 text-ink-faint whitespace-nowrap">{inst.owner_name} · {inst.owner_email}</td>
                      <td className="px-6 py-3">
                        <Badge tone={inst.status === 'APPROVED' ? 'success' : inst.status === 'PENDING' ? 'warning' : 'danger'}>
                          {inst.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-ink-faint">{inst.managers}</td>
                      <td className="px-6 py-3 text-ink-faint">{inst.educators}</td>
                      <td className="px-6 py-3 text-ink-faint">{inst.students}</td>
                      <td className="px-6 py-3 text-ink-faint">{inst.parents}</td>
                      <td className="px-6 py-3 text-ink-faint">{inst.courses}</td>
                      <td className="px-6 py-3 text-ink-faint whitespace-nowrap">{formatTimestamp(inst.created_at)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={institutionPager.page} totalPages={institutionPager.totalPages} onChange={institutionPager.setPage} />
          </Card>
        )}
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1} className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-ink-faint" />
            Audit Logs
          </h2>
          <span className="text-xs text-ink-faint">{auditLogs.length} entries</span>
        </div>

        {auditLoading ? (
          <SkeletonRows rows={4} />
        ) : auditLogs.length === 0 ? (
          <Card padding="p-0">
            <EmptyState icon={ClipboardList} title="No audit log entries" />
          </Card>
        ) : (
          <Card padding="p-0" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ink/[0.02] border-b border-ink/[0.06]">
                    {['Actor', 'Email', 'Action', 'Module', 'Date & Time'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
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
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
            <LogIn className="w-4 h-4 text-ink-faint" />
            Login Activity
          </h2>
          <span className="text-xs text-ink-faint">{logins.length} entries</span>
        </div>

        {loginsLoading ? (
          <SkeletonRows rows={4} />
        ) : logins.length === 0 ? (
          <Card padding="p-0">
            <EmptyState icon={LogIn} title="No login activity" />
          </Card>
        ) : (
          <Card padding="p-0" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ink/[0.02] border-b border-ink/[0.06]">
                    {['Email', 'Action', 'IP Address', 'Date & Time'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
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
      </motion.div>
    </div>
  );
}
