import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Users as UsersIcon, UserCog, Presentation, GraduationCap, Heart, Search } from 'lucide-react';
import ownerUsersService from '../../services/ownerUsersService';
import { formatTimestamp } from '../../utils/maintenanceFormat';
import usePagination from '../../hooks/usePagination';
import StatCard from '../../components/StatCard';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import Tabs from '../../components/ui/Tabs';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';

const PAGE_SIZE = 10;

const CATEGORIES = {
  managers: {
    label: 'Managers',
    icon: UserCog,
    emptyMessage: 'Managers added to your institution will show up here.',
    columns: ['Name', 'Email', 'Institution', 'Joined'],
    matches: (row, q) => row.name?.toLowerCase().includes(q) || row.user?.email?.toLowerCase().includes(q),
    row: (m) => (
      <>
        <td className="px-6 py-3 text-ink-soft font-medium">{m.name}</td>
        <td className="px-6 py-3 text-ink-faint">{m.user?.email ?? '—'}</td>
        <td className="px-6 py-3 text-ink-faint">{m.institution?.name ?? '—'}</td>
        <td className="px-6 py-3 text-ink-faint whitespace-nowrap">{m.created_at ? formatTimestamp(m.created_at) : '—'}</td>
      </>
    ),
  },
  educators: {
    label: 'Educators',
    icon: Presentation,
    emptyMessage: 'Educators added to your institution will show up here.',
    columns: ['Educator ID', 'Name', 'Email', 'Phone', 'Joined'],
    matches: (row, q) => row.name?.toLowerCase().includes(q) || row.email?.toLowerCase().includes(q) || row.edu_id?.toLowerCase().includes(q),
    row: (e) => (
      <>
        <td className="px-6 py-3 text-ink-faint">{e.edu_id}</td>
        <td className="px-6 py-3 text-ink-soft font-medium">{e.name}</td>
        <td className="px-6 py-3 text-ink-faint">{e.email || e.user_email || '—'}</td>
        <td className="px-6 py-3 text-ink-faint">{e.phone || '—'}</td>
        <td className="px-6 py-3 text-ink-faint whitespace-nowrap">{e.created_at ? formatTimestamp(e.created_at) : '—'}</td>
      </>
    ),
  },
  students: {
    label: 'Students',
    icon: GraduationCap,
    emptyMessage: 'Students enrolled in your institution will show up here.',
    columns: ['Registration No.', 'Name', 'Email', 'Phone', 'Batch', 'Guardians'],
    matches: (row, q) => row.name?.toLowerCase().includes(q) || row.email?.toLowerCase().includes(q) || row.registration_no?.toLowerCase().includes(q),
    row: (s) => (
      <>
        <td className="px-6 py-3 text-ink-faint">{s.registration_no}</td>
        <td className="px-6 py-3 text-ink-soft font-medium">{s.name}</td>
        <td className="px-6 py-3 text-ink-faint">{s.email || '—'}</td>
        <td className="px-6 py-3 text-ink-faint">{s.phone || '—'}</td>
        <td className="px-6 py-3 text-ink-faint">{s.batch_name ?? '—'}</td>
        <td className="px-6 py-3 text-ink-faint">{s.guardian_count}</td>
      </>
    ),
  },
  guardians: {
    label: 'Parents / Guardians',
    icon: Heart,
    emptyMessage: "Parents/guardians linked to your institution's students will show up here.",
    columns: ['Name', 'Email', 'Phone'],
    matches: (row, q) => row.name?.toLowerCase().includes(q) || row.email?.toLowerCase().includes(q),
    row: (g) => (
      <>
        <td className="px-6 py-3 text-ink-soft font-medium">{g.name}</td>
        <td className="px-6 py-3 text-ink-faint">{g.email || '—'}</td>
        <td className="px-6 py-3 text-ink-faint">{g.phone || '—'}</td>
      </>
    ),
  },
};

export default function Users() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('managers');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ managers: [], educators: [], students: [], guardians: [] });
  const [search, setSearch] = useState('');

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const result = await ownerUsersService.getAll();
        if (!ignore) setData(result);
      } catch {
        if (!ignore) toast.error('Failed to load users.');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const category = CATEGORIES[activeTab];

  const filteredRows = useMemo(() => {
    const rows = data[activeTab] ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => category.matches(row, q));
  }, [data, activeTab, search, category]);

  const pager = usePagination(filteredRows, PAGE_SIZE);

  function handleTabChange(tab) {
    setActiveTab(tab);
    setSearch('');
    pager.setPage(1);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Users"
        subtitle="Everyone enrolled in your institution, grouped by category"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard label="Managers" value={data.managers.length} tone="brand" icon={UserCog} />
        <StatCard label="Educators" value={data.educators.length} tone="accent" icon={Presentation} />
        <StatCard label="Students" value={data.students.length} tone="success" icon={GraduationCap} />
        <StatCard label="Parents / Guardians" value={data.guardians.length} tone="violet" icon={Heart} />
      </div>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        layoutId="owner-users-tabs"
        items={Object.entries(CATEGORIES).map(([value, c]) => ({ value, label: c.label, icon: c.icon }))}
        className="mb-5"
      />

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); pager.setPage(1); }}
            placeholder={`Search ${category.label.toLowerCase()}…`}
            className="pl-8 pr-3 py-2 text-sm rounded-xl border border-ink/10 bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/30 w-64"
          />
        </div>
        <span className="text-xs text-ink-faint ml-auto">{filteredRows.length} {filteredRows.length === 1 ? 'user' : 'users'}</span>
      </div>

      {loading ? (
        <SkeletonRows rows={6} />
      ) : filteredRows.length === 0 ? (
        <Card padding="p-0">
          <EmptyState icon={UsersIcon} title={`No ${category.label.toLowerCase()} found`} message={category.emptyMessage} />
        </Card>
      ) : (
        <Card padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink/[0.02] border-b border-ink/[0.06]">
                  {category.columns.map((col) => (
                    <th key={col} className="px-6 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.05]">
                {pager.pageItems.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i, 8) * 0.02 }}
                    className="hover:bg-ink/[0.02] transition-colors"
                  >
                    {category.row(row)}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pager.page} totalPages={pager.totalPages} onChange={pager.setPage} />
        </Card>
      )}
    </div>
  );
}
