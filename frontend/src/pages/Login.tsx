import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Receipt } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { homeForRole } from '../auth/AuthContext';
import { apiErrorMessage } from '../api/client';
import { loginSchema, type LoginFormValues } from '../lib/schemas';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login, isAuthenticated, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(
    params.get('expired') ? 'Session expired. Please log in again.' : null,
  );

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Already logged in -> role dashboard.
  if (isAuthenticated && user) {
    navigate(homeForRole(user.role), { replace: true });
    return null;
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const u = await login(values.email.trim(), values.password);
      const from = params.get('from');
      const safeFrom =
        from && from.startsWith('/') && !from.startsWith('//') ? from : null;
      navigate(safeFrom ?? homeForRole(u.role), { replace: true });
    } catch (e) {
      setServerError(apiErrorMessage(e, 'Invalid email or password'));
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900">
            <Receipt className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-gray-900">
              ABC Company
            </h1>
            <p className="mt-0.5 text-[13px] text-gray-500">
              Expense Voucher Management System
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-7">

        {serverError && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {serverError}
          </p>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@abc.com"
            required
            error={form.formState.errors.email?.message}
            {...form.register('email')}
          />
          <div className="flex flex-col gap-1">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              required
              error={form.formState.errors.password?.message}
              {...form.register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-pressed={showPassword}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="inline-flex w-fit items-center gap-1 text-xs text-gray-500 hover:text-gray-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
            >
              {showPassword ? (
                <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {showPassword ? 'Hide' : 'Show'} password
            </button>
          </div>
          <Button
            type="submit"
            loading={form.formState.isSubmitting}
            disabled={form.formState.isSubmitting}
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Log in
          </Button>
        </form>

        {import.meta.env.DEV && (
          <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-500">
            <p className="font-semibold text-gray-700">Demo accounts — local dev only</p>
            <ul className="mt-1 space-y-0.5 tabular-nums">
              <li>Employee · emma@abc.com / Employee@123</li>
              <li>Director · director@abc.com / Director@123</li>
              <li>Accounts · accounts@abc.com / Accounts@123</li>
            </ul>
            <p className="mt-2">
              <Link to="/403" className="text-gray-700 underline decoration-gray-300 underline-offset-2 hover:text-gray-900">
                Preview 403 page
              </Link>
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
