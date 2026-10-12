import { Suspense, lazy } from 'react';
import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, homeForRole } from './auth/AuthContext';
import { useAuth } from './auth/useAuth';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { RoleRoute } from './auth/RoleRoute';
import { AppShell } from './components/layout/AppShell';
import { Skeleton } from './components/ui/Skeleton';

const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const EmployeeDashboard = lazy(() => import('./pages/employee/Dashboard').then((m) => ({ default: m.EmployeeDashboard })));
const CreateVoucher = lazy(() => import('./pages/employee/CreateVoucher').then((m) => ({ default: m.CreateVoucher })));
const MyVouchers = lazy(() => import('./pages/employee/MyVouchers').then((m) => ({ default: m.MyVouchers })));
const EmployeeVoucherDetails = lazy(() => import('./pages/employee/VoucherDetails').then((m) => ({ default: m.EmployeeVoucherDetails })));
const EditVoucher = lazy(() => import('./pages/employee/EditVoucher').then((m) => ({ default: m.EditVoucher })));
const EmployeeProfile = lazy(() => import('./pages/employee/Profile').then((m) => ({ default: m.EmployeeProfile })));
const DirectorDashboard = lazy(() => import('./pages/director/Dashboard').then((m) => ({ default: m.DirectorDashboard })));
const PendingApprovals = lazy(() => import('./pages/director/PendingApprovals').then((m) => ({ default: m.PendingApprovals })));
const DirectorAllVouchers = lazy(() => import('./pages/director/AllVouchers').then((m) => ({ default: m.DirectorAllVouchers })));
const DirectorVoucherDetails = lazy(() => import('./pages/director/VoucherDetails').then((m) => ({ default: m.DirectorVoucherDetails })));
const DirectorProfile = lazy(() => import('./pages/director/Profile').then((m) => ({ default: m.DirectorProfile })));
const AccountsDashboard = lazy(() => import('./pages/accounts/Dashboard').then((m) => ({ default: m.AccountsDashboard })));
const AccountsAllVouchers = lazy(() => import('./pages/accounts/AllVouchers').then((m) => ({ default: m.AccountsAllVouchers })));
const AccountsVoucherDetails = lazy(() => import('./pages/accounts/VoucherDetails').then((m) => ({ default: m.AccountsVoucherDetails })));
const Forbidden403 = lazy(() => import('./pages/errors/Forbidden').then((m) => ({ default: m.Forbidden403 })));
const NotFound404 = lazy(() => import('./pages/errors/NotFound').then((m) => ({ default: m.NotFound404 })));

/** Lightweight suspense fallback so lazy chunks don't flash blank. */
function PageFallback() {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Loading page">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-40 w-full" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function lazyEl(el: React.ReactNode) {
  return <Suspense fallback={<PageFallback />}>{el}</Suspense>;
}

/** Root providers: auth (needs routing context) + toaster + outlet. */
function RootProviders() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Outlet />
    </AuthProvider>
  );
}

function RoleHomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={homeForRole(user?.role)} replace />;
}

/**
 * All routes per FRONTEND.md §2.
 * ProtectedRoute requires auth; RoleRoute restricts to the given roles.
 */
export const router = createBrowserRouter([
  {
    element: <RootProviders />,
    children: [
      { path: '/login', element: lazyEl(<Login />) },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: '/', element: <RoleHomeRedirect /> },
              {
                element: <RoleRoute allow={['EMPLOYEE']} />,
                children: [
                  { path: '/employee/dashboard', element: lazyEl(<EmployeeDashboard />) },
                  { path: '/employee/vouchers/new', element: lazyEl(<CreateVoucher />) },
                  { path: '/employee/vouchers', element: lazyEl(<MyVouchers />) },
                  { path: '/employee/vouchers/:id', element: lazyEl(<EmployeeVoucherDetails />) },
                  { path: '/employee/vouchers/:id/edit', element: lazyEl(<EditVoucher />) },
                  { path: '/employee/profile', element: lazyEl(<EmployeeProfile />) },
                ],
              },
              {
                element: <RoleRoute allow={['DIRECTOR']} />,
                children: [
                  { path: '/director/dashboard', element: lazyEl(<DirectorDashboard />) },
                  { path: '/director/pending', element: lazyEl(<PendingApprovals />) },
                  { path: '/director/vouchers', element: lazyEl(<DirectorAllVouchers />) },
                  { path: '/director/vouchers/:id', element: lazyEl(<DirectorVoucherDetails />) },
                  { path: '/director/profile', element: lazyEl(<DirectorProfile />) },
                ],
              },
              {
                element: <RoleRoute allow={['ACCOUNTS']} />,
                children: [
                  { path: '/accounts/dashboard', element: lazyEl(<AccountsDashboard />) },
                  { path: '/accounts/vouchers', element: lazyEl(<AccountsAllVouchers />) },
                  { path: '/accounts/vouchers/:id', element: lazyEl(<AccountsVoucherDetails />) },
                ],
              },
              { path: '/403', element: lazyEl(<Forbidden403 />) },
              { path: '*', element: lazyEl(<NotFound404 />) },
            ],
          },
        ],
      },
    ],
  },
]);
