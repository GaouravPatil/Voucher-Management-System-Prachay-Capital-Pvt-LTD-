import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { homeForRole } from '../../auth/AuthContext';

export function Forbidden403() {
  const { user } = useAuth();
  const home = user ? homeForRole(user.role) : '/login';
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <ShieldAlert className="h-12 w-12 text-amber-500" aria-hidden="true" />
      <h1 className="text-2xl font-bold text-gray-900">403 — Forbidden</h1>
      <p className="max-w-md text-sm text-gray-600">
        You don&apos;t have permission to view this page. If you believe this
        is a mistake, contact your administrator.
      </p>
      <Link
        to={home}
        className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Go to dashboard
      </Link>
    </div>
  );
}
