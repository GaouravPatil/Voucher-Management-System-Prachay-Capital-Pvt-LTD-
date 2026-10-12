import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { homeForRole } from '../../auth/AuthContext';

export function NotFound404() {
  const { user } = useAuth();
  const home = user ? homeForRole(user.role) : '/login';
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <FileQuestion className="h-12 w-12 text-gray-300" aria-hidden="true" />
      <h1 className="text-2xl font-bold text-gray-900">404 — Page not found</h1>
      <p className="max-w-md text-sm text-gray-600">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
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
