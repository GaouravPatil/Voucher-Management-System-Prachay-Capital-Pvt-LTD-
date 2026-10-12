import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  FileText,
  IndianRupee,
  Plus,
  Receipt,
  XCircle,
} from 'lucide-react';
import { dashboardApi } from '../../api/dashboard.api';
import { vouchersApi } from '../../api/vouchers.api';
import { apiErrorMessage } from '../../api/client';
import { formatDate, formatINR } from '../../lib/formatters';
import type { EmployeeDashboard } from '../../types';
import { StatCard } from '../../components/dashboard/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { CardsSkeleton, Skeleton } from '../../components/ui/Skeleton';

export function EmployeeDashboard() {
  const navigate = useNavigate();
  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  });
  const recent = useQuery({
    queryKey: ['vouchers', 'employee', 'recent'],
    queryFn: () =>
      vouchersApi.list({ page: 1, limit: 5, sortBy: 'updatedAt', sortOrder: 'desc' }),
  });

  if (dashboard.isLoading) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label="Loading dashboard">
        <Skeleton className="h-8 w-56" />
        <CardsSkeleton count={6} />
        <span className="sr-only">Loading dashboard…</span>
      </div>
    );
  }

  if (dashboard.isError) {
    return (
      <Card>
        <ErrorState
          message={apiErrorMessage(dashboard.error, 'Failed to load dashboard.')}
          onRetry={() => dashboard.refetch()}
        />
      </Card>
    );
  }

  const d = dashboard.data as EmployeeDashboard | undefined;

  if (!d) {
    return (
      <Card>
        <ErrorState message="Failed to load dashboard." onRetry={() => dashboard.refetch()} />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            My Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Track your expense vouchers and reimbursements.
          </p>
        </div>
        <Button onClick={() => navigate('/employee/vouchers/new')}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create Voucher
        </Button>
      </div>

      {d.role !== 'EMPLOYEE' ? (
        <Card>
          <ErrorState message="Unexpected dashboard data for this role." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard title="Total Vouchers" value={String(d.totalVouchers)} icon={Receipt} index={0} />
          <StatCard title="Draft" value={String(d.draft)} icon={FileText} accent="from-slate-500 to-gray-700" index={1} />
          <StatCard title="Pending Approval" value={String(d.pendingApproval)} icon={Clock} accent="from-amber-500 to-orange-600" index={2} />
          <StatCard title="Approved" value={String(d.approved)} icon={CheckCircle2} accent="from-emerald-500 to-green-600" index={3} />
          <StatCard title="Rejected" value={String(d.rejected)} icon={XCircle} accent="from-rose-500 to-red-600" index={4} />
          <StatCard
            title="Total Amount Claimed"
            value={formatINR(d.totalAmountClaimed)}
            icon={IndianRupee}
            index={5}
            tooltip="Sum of your vouchers that are submitted, pending, approved or rejected (excludes drafts). Approved total is shown below."
            action={
              <span className="mt-1 block text-xs text-gray-500">
                Approved: {formatINR(d.approvedAmount)}
              </span>
            }
          />
        </div>
      )}

      <Card>
        <CardHeader
          title="Recent Vouchers"
          action={
            <Link
              to="/employee/vouchers"
              className="text-sm text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              View all
            </Link>
          }
        />
        <CardBody>
          {recent.isLoading ? (
            <div className="space-y-2" role="status" aria-label="Loading recent vouchers">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <span className="sr-only">Loading…</span>
            </div>
          ) : recent.isError ? (
            <ErrorState
              message={apiErrorMessage(recent.error, 'Failed to load recent vouchers.')}
              onRetry={() => recent.refetch()}
            />
          ) : (recent.data?.data ?? []).length === 0 ? (
            <EmptyState
              title="No vouchers yet"
              message="Create your first expense voucher to get started."
              action={
                <Button onClick={() => navigate('/employee/vouchers/new')}>
                  Create voucher
                </Button>
              }
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Voucher No.', 'Title', 'Date', 'Amount', 'Status'].map((h) => (
                        <th key={h} scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(recent.data?.data ?? []).map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-blue-700">
                          <Link to={`/employee/vouchers/${v.id}`} className="hover:underline">
                            {v.voucherNumber}
                          </Link>
                        </td>
                        <td className="max-w-xs truncate px-4 py-2 text-sm">{v.expenseTitle}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">{formatDate(v.expenseDate)}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-right text-sm font-medium">{formatINR(v.amount)}</td>
                        <td className="px-4 py-2"><Badge status={v.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-gray-200 md:hidden">
                {(recent.data?.data ?? []).map((v) => (
                  <li key={v.id}>
                    <Link to={`/employee/vouchers/${v.id}`} className="block px-1 py-2.5">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-blue-700">{v.voucherNumber}</span>
                        <Badge status={v.status} />
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-gray-900">{v.expenseTitle}</span>
                      <span className="mt-0.5 flex justify-between text-xs text-gray-500">
                        <span>{formatDate(v.expenseDate)}</span>
                        <span className="font-semibold text-gray-900">{formatINR(v.amount)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
