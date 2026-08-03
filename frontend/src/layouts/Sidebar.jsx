// src/layouts/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Users,
  GraduationCap,
  Layers3,
  Settings,
  User,
  LogOut,
  ClipboardList, // <-- ADD THIS
} from "lucide-react";
import logo from "../assets/logoll.png";

const NAV_ITEMS = {
  SUPER_ADMIN: [
    { label: 'Dashboard',    path: '/dashboard/super-admin' },
    { label: 'Institutions', path: '/institutions' },
    { label: 'Activities',   path: '/activities' }, // <-- ADDED
    { label: 'Reports',      path: '/reports' },
    { label: 'Settings',     path: '/settings' },
    { label: 'Profile',      path: '/profile' },
    { label: 'Subscriptions', path: '/subscriptions' },
  ],
  OWNER: [
    { label: 'Dashboard',    path: '/dashboard/manager' },
    { label: 'Institutions', path: '/institutions' },
    { label: 'Courses',      path: '/courses' },
    { label: 'Educators',    path: '/educators' },
    { label: 'Students',     path: '/students' },
    { label: 'Batches',      path: '/batches' },
    { label: 'Activities',   path: '/activities' }, // <-- ADDED
    { label: 'Profile',      path: '/profile' },
  ],
  MANAGER: [
    { label: 'Dashboard',    path: '/dashboard/manager' },
    { label: 'Courses',      path: '/courses' },
    { label: 'Educators',    path: '/educators' },
    { label: 'Students',     path: '/students' },
    { label: 'Batches',      path: '/batches' },
    { label: 'Activities',   path: '/activities' }, // <-- ADDED
    { label: 'Profile',      path: '/profile' },
  ],
  EDUCATOR: [
    { label: 'Dashboard',    path: '/dashboard/educator' },
    { label: 'My Courses',   path: '/courses' },
    { label: 'Activities',   path: '/activities' }, // <-- ADDED
    { label: 'Schedule',     path: '/schedule' },
    { label: 'Profile',      path: '/profile' },
  ],
  STUDENT: [
    { label: 'Dashboard',    path: '/dashboard/student' },
    { label: 'My Courses',   path: '/mycourses' },
    { label: 'My Activities', path: '/activities' }, // <-- ADDED (with different label)
    { label: 'Schedule',     path: '/schedule' },
    { label: 'Profile',      path: '/profile' },
  ],
  PARENT: [
    { label: 'Dashboard',    path: '/dashboard/parent' },
    { label: 'Activities',   path: '/activities' }, // <-- ADDED
    { label: 'Profile',      path: '/profile' },
    { label: 'Progress',     path: '/progress' },
  ],
};

const ROLE_BADGE = {
  SUPER_ADMIN: 'bg-red-500/15 text-red-400',
  OWNER:       'bg-yellow-500/15 text-yellow-400',
  MANAGER:     'bg-blue-500/15 text-blue-400',
  EDUCATOR:    'bg-green-500/15 text-green-400',
  STUDENT:     'bg-purple-500/15 text-purple-400',
  PARENT:      'bg-pink-500/15 text-pink-400',
};

const ICONS = {
  Dashboard: LayoutDashboard,
  Institutions: Building2,
  Courses: BookOpen,
  "My Courses": BookOpen,
  Educators: Users,
  Students: GraduationCap,
  Batches: Layers3,
  Reports: LayoutDashboard,
  Settings: Settings,
  Profile: User,
  Activities: ClipboardList,      // <-- ADD THIS
  "My Activities": ClipboardList, // <-- ADD THIS
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const items = NAV_ITEMS[user?.role] || [];
  const roleLabel = user?.role?.replace('_', ' ') || '';
  const badge = ROLE_BADGE[user?.role] || 'bg-gray-500/15 text-gray-400';

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '??';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside
      className={`
        fixed top-0 left-0
        z-50
        h-screen
        w-64
        bg-[#0F1117]
        border-r border-[#1E2130]
        transform transition-transform duration-300
        -translate-x-full
        md:translate-x-0
      `}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-[#1E2130] px-4 py-5">
        <div className="flex items-center gap-3 border-b border-[#1E2130] px-5 py-5">
          <div className="w-13 h-13 rounded-xl bg-white flex items-center justify-center overflow-hidden">
            <img
              src={logo}
              alt="LightLearn"
              className="w-13 h-13 object-contain"
            />
          </div>
          <div>
            <h1 className="text-white text-lg font-bold leading-none">
              LightLearn
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Academic Scheduling System
            </p>
            <span
              className={`inline-block mt-2 text-[10px] font-semibold uppercase px-2 py-1 rounded ${badge}`}
            >
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-4 space-y-0.5 overflow-y-auto`}>
        <div className="overflow-hidden">
          <p className="text-[10px] font-semibold text-[#4B5563] uppercase tracking-[0.1em] px-3 mb-2">
            Menu
          </p>
        </div>
        {items.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 relative ${
                isActive
                  ? 'bg-[#2B4EFF] text-white'
                  : 'text-[#9CA3AF] hover:bg-[#1A1D26] hover:text-[#F0F2F8]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-300 rounded-full" />
                )}

                {(() => {
                  const Icon = ICONS[item.label] || LayoutDashboard;
                  return (
                    <Icon
                      size={18}
                      className={`shrink-0 ${
                        isActive
                          ? "text-white"
                          : "text-[#6B7280] group-hover:text-[#F0F2F8]"
                      }`}
                    />
                  );
                })()}

                <span className="truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-[#1E2130] p-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#2B4EFF]/20 border border-[#2B4EFF]/30
                          flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-blue-400">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-[#9CA3AF] truncate">
              {user?.email}
            </p>
            <button
              onClick={handleLogout}
              className="text-[11px] text-red-400 hover:text-red-300 transition-colors
                         flex items-center gap-1 mt-0.5 cursor-pointer bg-transparent
                         border-none p-0"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}