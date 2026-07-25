import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { PermissionsProvider } from './auth/PermissionsContext.jsx'
import { ThemeProvider } from './hooks/useTheme.jsx'

// Note: ToastProvider is NOT global — it's mounted inside DashboardLayout
// (every useToast() call in the app is from a dashboard page), which keeps
// its fixed toast container inside the dark-mode-scoped subtree so toasts
// pick up dark styling instead of always rendering light.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <PermissionsProvider>
        <App />
      </PermissionsProvider>
    </ThemeProvider>
  </StrictMode>,
)
