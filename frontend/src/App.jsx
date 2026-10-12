import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { AuthLayout } from './components/layout/AuthLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { BootScreen } from './components/shared/BootScreen';

import Login from './pages/public/Login';
import Register from './pages/public/Register';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import UserQueues from './pages/user/UserQueues';
import LiveQueue from './pages/user/LiveQueue';
import UserHistory from './pages/user/UserHistory';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffQueue from './pages/staff/StaffQueue';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminQueues from './pages/admin/AdminQueues';
import AdminStaff from './pages/admin/AdminStaff';

// The marketing page carries ScrollTrigger-heavy sections; keep it out of the app bundle.
const Landing = lazy(() => import('./pages/public/Landing'));

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/"
                  element={
                    <Suspense fallback={<BootScreen label="Loading" />}>
                      <Landing />
                    </Suspense>
                  }
                />

                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Route>

                {/* User Routes */}
                <Route element={<ProtectedRoute allowedRoles={['user']} />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/app" element={<UserDashboard />} />
                    <Route path="/app/queues" element={<UserQueues />} />
                    <Route path="/app/history" element={<UserHistory />} />
                  </Route>
                  <Route path="/app/queues/:queueId" element={<LiveQueue />} />
                </Route>

                {/* Staff Routes */}
                <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/staff" element={<StaffDashboard />} />
                  </Route>
                  <Route path="/staff/queues/:queueId" element={<StaffQueue />} />
                </Route>

                {/* Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/departments" element={<AdminDepartments />} />
                    <Route path="/admin/queues" element={<AdminQueues />} />
                    <Route path="/admin/staff" element={<AdminStaff />} />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
