import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Institution from './pages/Institution';
import BatchManagement from "./pages/BatchManagement";
import EducatorManagement from './pages/EducatorManagement';
import Course from './pages/Course';
import StudentPage from './pages/StudentPage';

import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './auth/ForgotPasswordPage';
import ResetPasswordPage from './auth/ResetPasswordPage';
import VerifyEmailPage from './auth/VerifyEmailPage';

import { AuthProvider } from './auth/context/AuthProvider';

import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';

import ManagerDashboard from './pages/ManagerDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import EducatorDashboard from './pages/EducatorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard';
import DashboardLayout from './layouts/DashboardLayout';

import { ActivityProvider } from "./context/ActivityContext";
import { ActivityManagement } from './pages/ActivityManagement';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* PUBLIC ROUTES */}
          <Route path="/login" element={
            <PublicRoute><LoginPage /></PublicRoute>
          } />

          <Route path="/forgot-password" element={
            <PublicRoute><ForgotPasswordPage /></PublicRoute>
          } />

          <Route path="/reset-password" element={
            <PublicRoute><ResetPasswordPage /></PublicRoute>
          } />

          <Route path="/verify-email" element={
            <PublicRoute><VerifyEmailPage /></PublicRoute>
          } />

          {/* PROTECTED ROUTES */}
          {/* PROTECTED ROUTES */}
<Route
  element={
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  }
>
  <Route
    path="/dashboard/super-admin"
    element={<SuperAdminDashboard />}
  />

  <Route
    path="/dashboard/manager"
    element={<ManagerDashboard />}
  />

  <Route
    path="/dashboard/educator"
    element={<EducatorDashboard />}
  />

  <Route
    path="/dashboard/student"
    element={<StudentDashboard />}
  />

  <Route
    path="/dashboard/parent"
    element={<ParentDashboard />}
  />

  <Route
    path="/institutions"
    element={<Institution />}
  />

  <Route
    path="/courses"
    element={<Course />}
  />

  <Route
    path="/educators"
    element={<EducatorManagement />}
  />

  <Route
    path="/students"
    element={<StudentPage />}
  />

  <Route
    path="/batches"
    element={<BatchManagement />}
  />

  <Route path="/activities" element={
    <ActivityProvider>
        <ActivityManagement />
    </ActivityProvider>
} />


</Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;