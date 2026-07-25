import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useTheme } from '../hooks/useTheme';
import { ToastProvider } from '../components/ui/Toast';

// Picked in JS rather than via a `dark:` variant override on the gradient's
// last stop — that relies on CSS cascade/specificity behavior between two
// classes targeting the same custom property, which is easy to get subtly
// wrong. Branching the whole class string here is unambiguous.
//
// Uses `paper`/`paper-soft` (the background tokens — dark in dark mode), not
// `ink` (the foreground/text token, which is deliberately near-white in dark
// mode so text stays readable — using it here previously rendered the
// "dark" gradient as off-white).
const GRADIENT = {
  light: 'bg-gradient-to-br from-paper via-paper-soft to-brand-50',
  dark:  'bg-gradient-to-br from-paper via-paper-soft to-brand-900',
};

export default function DashboardLayout() {
  const { theme } = useTheme();

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <ToastProvider>
        <div className={`flex h-screen ${GRADIENT[theme]}`}>
          <Sidebar />
          <main className="flex-1 overflow-y-auto scroll-thin md:ml-64 pt-14 md:pt-0 flex flex-col">
            <Topbar />
            <div className="flex-1">
              <Outlet />
            </div>
          </main>
        </div>
      </ToastProvider>
    </div>
  );
}
