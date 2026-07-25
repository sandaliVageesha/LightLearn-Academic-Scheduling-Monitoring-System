import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Institution from './pages/Institution';
import BatchManagement from "./pages/BatchManagement";
import EducatorManagement from './pages/EducatorManagement';
import Course from './pages/Course';
import StudentPage from './pages/StudentPage';

import LoginPage from './pages/LoginPage';
import StudentSignupPage from './pages/StudentSignupPage';
import RegisterInstitutionPage from './pages/RegisterInstitutionPage';
import ForgotPasswordPage from './auth/ForgotPasswordPage';
import ResetPasswordPage from './auth/ResetPasswordPage';
import VerifyEmailPage from './auth/VerifyEmailPage';

import ManagerDashboard from './pages/ManagerDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import EducatorDashboard from './pages/EducatorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StudentProgress from './pages/StudentProgress';
import StudentCourses from './pages/StudentCourses';
import EducatorActivities from './pages/EducatorActivities';
import ParentDashboard from './pages/ParentDashboard';
import DashboardLayout from './layouts/DashboardLayout';
import OwnerDashboard from "./pages/OwnerDashboard";
import Institutions from "./pages/superadmin/Institutions";
import Profile from "./pages/superadmin/Profile";
import Settings from "./pages/superadmin/Settings";
import ManagerManagement from './pages/ManagerManagement';
import Home from './pages/Home';
import RolesPermissions from './pages/RolesPermissions';
import UserProfile from './pages/UserProfile';
import HelpPage from './pages/HelpPage';
import Messages from './pages/superadmin/Messages';
import Maintenance from './pages/superadmin/Maintenance';
import OwnerMaintenance from './pages/owner/Maintenance';
import OwnerUsers from './pages/owner/Users';
import Analytics from './pages/superadmin/Analytics';
import SuperAdminRoles from './pages/superadmin/Roles';
import Notifications from './pages/Notifications';



function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
         <Route path="/login" element={<LoginPage />} />
        <Route path="/signup/student" element={<StudentSignupPage />} />
        <Route path="/register-institution" element={<RegisterInstitutionPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />


        {/* DASHBOARD LAYOUT ROUTES */}
        <Route element={<DashboardLayout />}>

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

          <Route path="/dashboard/owner" element={<OwnerDashboard />} />

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

          <Route 
            path="/managers" 
            element={<ManagerManagement />} 
          />

          <Route 
            path="/superadmin/institutions" 
            element={<Institutions />} 
          />

          <Route 
            path="/superadmin/profile" 
            element={<Profile />} 
          />

          <Route 
            path="/superadmin/settings" 
            element={<Settings />} 
          />
          <Route 
            path="/profile" 
            element={<UserProfile />} />

          <Route path="/roles" element={<RolesPermissions />} />

          <Route path="/progress" element={<StudentProgress />} />

          <Route path="/my-courses" element={<StudentCourses />} />

          <Route path="/educator/activities" element={<EducatorActivities />} />

          <Route path="/help" element={<HelpPage />} />

          <Route path="/superadmin/messages" element={<Messages />} />

          <Route path="/superadmin/maintenance" element={<Maintenance />} />

          <Route path="/owner/maintenance" element={<OwnerMaintenance />} />

          <Route path="/owner/users" element={<OwnerUsers />} />

          <Route path="/superadmin/analytics" element={<Analytics />} />

          <Route path="/superadmin/roles" element={<SuperAdminRoles />} />

          <Route path="/notifications" element={<Notifications />} />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;