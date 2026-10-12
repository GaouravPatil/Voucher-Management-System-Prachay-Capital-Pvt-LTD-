import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  FilePlus2,
  Home,
  LogOut,
  Menu,
  Printer,
  Receipt,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { homeForRole } from '../../auth/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV: Record<string, NavItem[]> = {
  EMPLOYEE: [
    { to: '/employee/dashboard', label: 'Dashboard', icon: Home, end: true },
    { to: '/employee/vouchers/new', label: 'New Voucher', icon: FilePlus2 },
    { to: '/employee/vouchers', label: 'My Vouchers', icon: Receipt, end: true },
    { to: '/employee/profile', label: 'Profile', icon: User },
  ],
  DIRECTOR: [
    { to: '/director/dashboard', label: 'Dashboard', icon: Home, end: true },
    { to: '/director/pending', label: 'Pending Approvals', icon: Clock },
    { to: '/director/vouchers', label: 'All Vouchers', icon: Receipt, end: true },
    { to: '/director/profile', label: 'Profile', icon: User },
  ],
  ACCOUNTS: [
    { to: '/accounts/dashboard', label: 'Dashboard', icon: Home, end: true },
    { to: '/accounts/vouchers', label: 'All Vouchers', icon: Receipt, end: true },
    { to: '/accounts/vouchers?status=APPROVED', label: 'Approved Queue', icon: Printer },
  ],
};

const ROLE_LABEL: Record<string, string> = {
  EMPLOYEE: 'Employee',
  DIRECTOR: 'Director',
  ACCOUNTS: 'Accounts',
};

const ROLE_BADGE: Record<string, string> = {
  EMPLOYEE: 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200',
  DIRECTOR: 'bg-gray-900 text-white',
  ACCOUNTS: 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200',
};

function navClass(isActive: boolean) {
  return `flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 ${
    isActive
      ? 'bg-gray-900 text-white'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200'
  }`;
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const items: NavItem[] = user ? (NAV[user.role] ?? []) : [];

  const sidebar = (
    <nav aria-label="Primary" className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to + item.label}
            to={item.to}
            end={item.end}
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) => navClass(isActive)}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 no-print backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <button
            type="button"
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            {drawerOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(user ? homeForRole(user.role) : '/login')}
            className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
            aria-label="Go to dashboard"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-900">
              <ClipboardList className="h-4 w-4 text-white" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-gray-900 sm:text-[15px]">
              ABC Company <span className="font-normal text-gray-400">/ EVMS</span>
            </span>
          </button>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {user && (
              <>
                <span className="hidden text-sm text-gray-700 sm:inline">
                  {user.name}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[user.role] ?? 'bg-gray-100 text-gray-800'}`}
                >
                  {ROLE_LABEL[user.role] ?? user.role}
                </span>
                <button
                  type="button"
                  onClick={() => logout('manual')}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-gray-200 bg-white no-print lg:block">
          {sidebar}
        </aside>

        {/* Drawer (mobile) */}
        {drawerOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 p-3">
                <span className="text-sm font-semibold text-gray-900">Menu</span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation"
                  className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              {sidebar}
            </div>
          </div>
        )}

        {/* Content */}
        <main className="page-enter min-w-0 flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
