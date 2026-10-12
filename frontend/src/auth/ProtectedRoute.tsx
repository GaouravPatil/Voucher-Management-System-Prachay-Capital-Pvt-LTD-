import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './useAuth';

/** Requires authentication. Shows a full-page loader while the session restores. */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-gray-50"
        role="status"
        aria-label="Loading session"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden="true" />
          <p className="text-sm text-gray-600">Restoring your session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const from = location.pathname + location.search;
    return (
      <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />
    );
  }

  return <Outlet />;
}
