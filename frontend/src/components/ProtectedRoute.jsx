// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route that requires authentication.
 * Optional `roles` array restricts access to specific roleType values.
 * Unauthenticated users are sent to /login (with return path).
 * Wrong-role users are sent to their own role home (or /).
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, roleType } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-silas-cream">
        <p className="text-sm text-silas-ink/50">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && roles.length > 0 && !roles.includes(roleType)) {
    // Wrong role — send them to their own home rather than a blank 403
    const home =
      {
        client: '/client',
        administrator: '/admin',
        staff: '/staff',
        finance_officer: '/finance',
      }[roleType] || '/';
    return <Navigate to={home} replace />;
  }

  return children;
}