import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bell, Check } from "lucide-react";
import notificationService from "../services/notificationService";
import { formatTimestamp } from "../utils/maintenanceFormat";
import usePagination from "../hooks/usePagination";
import usePolling from "../hooks/usePolling";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import Pagination from "../components/ui/Pagination";
import { SkeletonRows } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";

const POLL_MS = 10000;
const PAGE_SIZE = 10;

export default function Notifications() {
  const navigate = useNavigate();
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const pager = usePagination(notifications, PAGE_SIZE);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationService.list();
      setNotifications(data.results);
      setUnreadCount(data.unread_count);
    } catch {
      // silent on background polls; first-load failure surfaces via loading below
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(fetchNotifications, POLL_MS);

  async function handleClick(n) {
    if (!n.is_read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      notificationService.markRead(n.id).catch(() => {});
    }
    if (n.link) navigate(n.link);
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllRead();
    } catch {
      toast.error('Failed to mark all as read.');
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Notifications"
        subtitle="Everything that needs your attention, in one place"
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" icon={Check} onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <SkeletonRows rows={6} />
      ) : notifications.length === 0 ? (
        <Card padding="p-0">
          <EmptyState icon={Bell} title="No notifications yet" message="You're all caught up." />
        </Card>
      ) : (
        <Card padding="p-0" className="overflow-hidden">
          <ul className="divide-y divide-ink/[0.05]">
            {pager.pageItems.map((n, i) => (
              <motion.li
                key={n.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i, 8) * 0.02 }}
              >
                <button
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-6 py-4 flex items-start gap-3 hover:bg-ink/[0.02] transition-colors ${
                    !n.is_read ? 'bg-brand-50/40' : ''
                  }`}
                >
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!n.is_read ? 'bg-brand-500' : 'bg-transparent'}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{n.title}</span>
                    {n.message && (
                      <span className="block text-sm text-ink-faint mt-0.5">{n.message}</span>
                    )}
                    <span className="block text-xs text-ink-faint mt-1.5">{formatTimestamp(n.created_at)}</span>
                  </span>
                </button>
              </motion.li>
            ))}
          </ul>
          <Pagination page={pager.page} totalPages={pager.totalPages} onChange={pager.setPage} />
        </Card>
      )}
    </div>
  );
}
