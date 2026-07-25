import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Sun, Moon } from 'lucide-react';
import { getStoredUser } from '../services/authStorage';
import notificationService from '../services/notificationService';
import usePolling from '../hooks/usePolling';
import { useTheme } from '../hooks/useTheme';

const POLL_MS = 10000;

const PAGE_TITLES = {
  '/dashboard/super-admin':   'Dashboard',
  '/dashboard/manager':       'Dashboard',
  '/dashboard/educator':      'Dashboard',
  '/dashboard/student':       'Dashboard',
  '/dashboard/owner':         'Dashboard',
  '/dashboard/parent':        'Dashboard',
  '/institutions':            'Institutions',
  '/courses':                 'Courses',
  '/educators':                'Educators',
  '/students':                 'Students',
  '/batches':                  'Batches',
  '/managers':                  'Managers',
  '/superadmin/institutions':   'Institutions',
  '/superadmin/profile':        'Profile',
  '/superadmin/settings':       'Settings',
  '/profile':                   'Profile',
  '/roles':                     'Roles & Permissions',
  '/progress':                  'Progress',
  '/my-courses':                 'My Courses',
  '/educator/activities':        'Activities',
  '/help':                       'Help',
  '/superadmin/messages':        'Complaints & Help',
  '/superadmin/maintenance':     'Maintenance',
  '/superadmin/analytics':       'Analytics',
  '/superadmin/roles':           'Roles',
  '/notifications':              'Notifications',
};

function pageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const last = pathname.split('/').filter(Boolean).pop() ?? '';
  return last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Dashboard';
}

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const user = getStoredUser() ?? {};

  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationService.list();
      setUnreadCount(data.unread_count ?? 0);
    } catch {
      // silent on background polls
    }
  }, []);

  usePolling(fetchUnreadCount, POLL_MS);

  function goToProfile() {
    navigate(user.role === 'SUPER_ADMIN' ? '/superadmin/profile' : '/profile');
  }

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'GU';
  const displayName = user?.username || user?.email || 'Guest';

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 py-4 bg-surface/70 backdrop-blur-xl border-b border-ink/[0.06]">
      <h1 className="font-display text-lg font-semibold text-ink truncate">
        {pageTitle(location.pathname)}
      </h1>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-faint hover:text-ink hover:bg-ink/[0.05] transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <button
          onClick={() => navigate('/notifications')}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-ink-faint hover:text-ink hover:bg-ink/[0.05] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[9px] font-semibold flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={goToProfile}
          className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-ink/[0.05] transition-colors"
        >
          <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[11px] font-bold shrink-0">
            {initials}
          </span>
          <span className="text-sm font-medium text-ink-soft truncate max-w-[140px]">{displayName}</span>
        </button>
      </div>
    </div>
  );
}
