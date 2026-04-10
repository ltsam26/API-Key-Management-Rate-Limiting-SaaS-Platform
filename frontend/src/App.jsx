import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './routes/PrivateRoute';
import AdminRoute from './routes/AdminRoute';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import LoginSuccess from './pages/auth/LoginSuccess';
import DashboardLayout from './components/Layout/DashboardLayout';
import AdminLayout from './components/Layout/AdminLayout';

// Dashboard Views
import Overview from './pages/dashboard/Overview';
import Projects from './pages/dashboard/Projects';
import ApiKeys from './pages/dashboard/ApiKeys';
import Analytics from './pages/dashboard/Analytics';
import Billing from './pages/dashboard/Billing';
import Support from './pages/dashboard/Support';

// Admin Views
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProjects from './pages/admin/AdminProjects';
import AdminKeys from './pages/admin/AdminKeys';
import AdminLogs from './pages/admin/AdminLogs';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login/success" element={<LoginSuccess />} />
          
          <Route
            path="/dashboard"
            element={<PrivateRoute><DashboardLayout /></PrivateRoute>}
          >
            <Route index element={<Overview />} />
            <Route path="projects" element={<Projects />} />
            <Route path="keys" element={<ApiKeys />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="billing" element={<Billing />} />
            <Route path="support" element={<Support />} />
          </Route>

          <Route
            path="/admin"
            element={<AdminRoute><AdminLayout /></AdminRoute>}
          >
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="keys" element={<AdminKeys />} />
            <Route path="logs" element={<AdminLogs />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}