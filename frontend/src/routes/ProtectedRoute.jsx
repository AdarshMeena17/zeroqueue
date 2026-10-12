import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BootScreen } from '../components/shared/BootScreen';

export function ProtectedRoute({ allowedRoles = [] }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <BootScreen />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'staff') return <Navigate to="/staff" replace />;
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
