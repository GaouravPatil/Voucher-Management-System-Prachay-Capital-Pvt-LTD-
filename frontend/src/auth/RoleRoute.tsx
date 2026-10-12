import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';
import type { Role } from '../types';

interface Props {
  allow: Role[];
}

/**
 * Role guard (UX only — real enforcement is server-side).
 * Wrong role -> own dashboard if logged in with another role, else 403.
 */
export function RoleRoute({ allow }: Props) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) {
    // Authenticated but wrong role: never render the other role's content.
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
}
