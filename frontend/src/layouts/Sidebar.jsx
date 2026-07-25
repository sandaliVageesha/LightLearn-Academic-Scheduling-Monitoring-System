import { useState, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Building2, BookOpen, Users,
  GraduationCap, Layers3, Settings, User, LogOut,
  FileText, TrendingUp, Menu, X, ShieldCheck,
  HelpCircle, MessageSquare, ClipboardList, Wrench, BarChart3, Bell,
} from 'lucide-react';
import logo from '../assets/logoll.png';
import { getStoredUser, clearSession } from '../services/authStorage';
import complaintService from '../services/complaintService';
import contactService from '../services/contactService';
import notificationService from '../services/notificationService';
import usePolling from '../hooks/usePolling';

const MESSAGES_POLL_MS = 10000;
const NOTIFICATIONS_POLL_MS = 10000;

const NAV_ITEMS = {
  SUPER_ADMIN: [
    { label: 'Dashboard',        path: '/dashboard/super-admin' },
    { label: 'Institutions',     path: '/institutions' },
    { label: 'Analytics',        path: '/superadmin/analytics' },
    { label: 'Roles',            path: '/superadmin/roles' },
    { label: 'Complaints & Help', path: '/superadmin/messages' },
    { label: 'Maintenance',      path: '/superadmin/maintenance' },
    { label: 'Notifications',    path: '/notifications' },
    { label: 'Settings',         path: '/superadmin/settings' },
    { label: 'Profile',          path: '/superadmin/profile' },
  ],
  OWNER: [
    { label: 'Dashboard',     path: '/dashboard/owner' },
    { label: 'Managers',      path: '/managers' },
    { label: 'Users',         path: '/owner/users' },
    { label: 'Roles',         path: '/roles' },
    { label: 'Maintenance',   path: '/owner/maintenance' },
    { label: 'Notifications', path: '/notifications' },
    { label: 'Help',          path: '/help' },
    { label: 'Profile',       path: '/profile' },
  ],
  MANAGER: [
    { label: 'Dashboard',     path: '/dashboard/manager' },
    { label: 'Courses',       path: '/courses' },
    { label: 'Educators',     path: '/educators' },
    { label: 'Students',      path: '/students' },
    { label: 'Batches',       path: '/batches' },
    { label: 'Notifications', path: '/notifications' },
    { label: 'Help',          path: '/help' },
    { label: 'Profile',       path: '/profile' },
  ],
  EDUCATOR: [
    { label: 'Dashboard',     path: '/dashboard/educator' },
    { label: 'Activities',    path: '/educator/activities' },
    { label: 'Notifications', path: '/notifications' },
    { label: 'Help',          path: '/help' },
    { label: 'Profile',       path: '/profile' },
  ],
  STUDENT: [
    { label: 'Dashboard',     path: '/dashboard/student' },
    { label: 'My Courses',    path: '/my-courses' },
    { label: 'Progress',      path: '/progress' },
    { label: 'Notifications', path: '/notifications' },
    { label: 'Help',          path: '/help' },
    { label: 'Profile',       path: '/profile' },
  ],
  PARENT: [
    { label: 'Dashboard',     path: '/dashboard/parent' },
    { label: 'Notifications', path: '/notifications' },
    { label: 'Help',          path: '/help' },
    { label: 'Profile',       path: '/profile' },
  ],
};

const ROLE_LABEL = {
  SUPER_ADMIN: 'Super Admin',
  OWNER:       'Owner',
  MANAGER:     'Manager',
  EDUCATOR:    'Educator',
  STUDENT:     'Student',
  PARENT:      'Parent',
};

const ICONS = {
  Dashboard:     LayoutDashboard,
  Institutions:  Building2,
  Courses:       BookOpen,
  'My Courses':  BookOpen,
  Educators:     Users,
  Students:      GraduationCap,
  Batches:       Layers3,
  Reports:       FileText,
  Settings:      Settings,
  Profile:       User,
  Progress:      TrendingUp,
  Schedule:      LayoutDashboard,
  Managers:      Users,
  Users:         Users,
  Roles:         ShieldCheck,
  Help:          HelpCircle,
  'Complaints & Help': MessageSquare,
  Activities:    ClipboardList,
  Maintenance:   Wrench,
  Analytics:     BarChart3,
  Notifications: Bell,
};

const SECONDARY = new Set(['Profile', 'Settings', 'Help', 'Notifications']);

function SidebarContent({ onClose }) {
  const navigate = useNavigate();

  const user = getStoredUser() ?? {};

  const role     = user?.role ?? 'MANAGER';
  const items    = NAV_ITEMS[role] ?? NAV_ITEMS.MANAGER;
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'GU';

  const primaryItems   = items.filter((i) => !SECONDARY.has(i.label));
  const secondaryItems = items.filter((i) => SECONDARY.has(i.label));

  const [unopenedMessages, setUnopenedMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchUnopenedMessages = useCallback(async () => {
    try {
      const [complaintStats, inquiryStats] = await Promise.all([
        complaintService.getStats(),
        contactService.getStats(),
      ]);
      setUnopenedMessages((complaintStats.open ?? 0) + (inquiryStats.new ?? 0));
    } catch {
      // silent on background polls
    }
  }, []);

  const fetchUnreadNotifications = useCallback(async () => {
    try {
      const data = await notificationService.list();
      setUnreadNotifications(data.unread_count ?? 0);
    } catch {
      // silent on background polls
    }
  }, []);

  usePolling(fetchUnopenedMessages, MESSAGES_POLL_MS, role !== 'SUPER_ADMIN');
  usePolling(fetchUnreadNotifications, NOTIFICATIONS_POLL_MS);

  function badgeFor(label) {
    if (label === 'Complaints & Help') return unopenedMessages;
    if (label === 'Notifications') return unreadNotifications;
    return 0;
  }

  function handleLogout() {
    clearSession();
    navigate('/login');
  }

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Ocean gradient background */}
      <div className="absolute inset-0 bg-ocean-gradient" />
      {/* Legibility scrim — darker up top where the gradient is brightest */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(8,20,40,0.62) 0%, rgba(8,20,40,0.42) 35%, rgba(6,14,40,0.5) 70%, rgba(4,10,36,0.72) 100%)',
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between gap-3 border-b border-white/15 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src={logo} alt="LightLearn" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <h1 className="text-white text-[13px] font-display font-semibold leading-none mb-1 drop-shadow-sm">
                LightLearn
              </h1>
              <p className="text-[10px] text-white/70 leading-none">Academic Scheduling</p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="px-3 pt-3 pb-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide bg-white/15 text-white border border-white/20 backdrop-blur-sm">
            {ROLE_LABEL[role] ?? role}
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto scroll-thin px-2 py-2">
          <p className="text-[9px] font-semibold text-white/50 uppercase tracking-widest px-2 mb-2">
            Menu
          </p>

          {primaryItems.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              onClose={onClose}
              badge={badgeFor(item.label)}
            />
          ))}

          {secondaryItems.length > 0 && (
            <>
              <div className="h-px bg-white/15 my-2 mx-1" />
              {secondaryItems.map((item) => (
                <NavItem key={item.path} item={item} onClose={onClose} badge={badgeFor(item.label)} />
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-white/15 px-3 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-white">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-white/85 truncate">{user?.email ?? 'Guest'}</p>
              <button
                onClick={handleLogout}
                className="text-[10px] text-white/70 hover:text-white transition-colors flex items-center gap-1 mt-0.5 bg-transparent border-none p-0 cursor-pointer"
              >
                <LogOut size={11} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ item, onClose, badge = 0 }) {
  const Icon = ICONS[item.label] ?? LayoutDashboard;

  return (
    <NavLink
      to={item.path}
      onClick={onClose}
      className={({ isActive }) =>
        `group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium
         transition-colors duration-150 relative mb-0.5
         ${isActive ? 'text-ocean-900' : 'text-white/80 hover:bg-white/10 hover:text-white'}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="sidebar-active"
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 bg-white rounded-lg shadow-lift -z-10"
            />
          )}
          <Icon size={15} className="shrink-0" />
          <span className="truncate flex-1">{item.label}</span>
          {badge > 0 && (
            <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-semibold flex items-center justify-center">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-ocean-gradient border-b border-white/15 flex items-center justify-between px-4">
        <button
          onClick={() => setOpen(true)}
          className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={16} />
        </button>
        <span className="text-white text-[13px] font-display font-semibold drop-shadow-sm">LightLearn</span>
        <div className="w-8" />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden fixed top-0 left-0 z-50 h-screen w-64"
          >
            <SidebarContent onClose={() => setOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      <aside className="hidden md:flex flex-col fixed top-0 left-0 z-50 h-screen w-64">
        <SidebarContent />
      </aside>
    </>
  );
}
