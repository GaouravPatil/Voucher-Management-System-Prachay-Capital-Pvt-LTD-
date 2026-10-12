import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  IndianRupee,
  Receipt,
  XCircle,
} from 'lucide-react';
import { dashboardApi } from '../../api/dashboard.api';
import { apiErrorMessage } from '../../api/client';
import { formatDate, formatINR } from '../../lib/formatters';
import type { AccountsDashboard } from '../../types';
import { StatCard } from '../../components/dashboard/StatCard';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { CardsSkeleton, Skeleton } from '../../components/ui/Skeleton';

export function AccountsDashboard() {
  const navigate = useNavigate();
  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  });

  if (dashboard.isLoading) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label="Loading dashboard">
        <Skeleton className="h-8 w-56" />
        <CardsSkeleton count={5} />
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

  if (!dashboard.data || dashboard.data.role !== 'ACCOUNTS') {
    return (
      <Card>
        <ErrorState message="Unexpected dashboard data for this role." />
      </Card>
    );
  }

  const d = dashboard.data as AccountsDashboard;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Accounts Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Reimbursement queue and organization-wide voucher totals.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate('/accounts/vouchers?status=APPROVED')}
        >
          View approved queue
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Total Vouchers" value={String(d.totalVouchers)} icon={Receipt} index={0} />
        <StatCard title="Pending Approval" value={String(d.pendingApproval)} icon={Clock} accent="from-amber-500 to-orange-600" index={1} />
        <StatCard title="Approved" value={String(d.approved)} icon={CheckCircle2} accent="from-emerald-500 to-green-600" index={2} />
        <StatCard title="Rejected" value={String(d.rejected)} icon={XCircle} accent="from-rose-500 to-red-600" index={3} />
        <StatCard
          title="Total Approved Amount"
          value={formatINR(d.totalApprovedAmount)}
          icon={IndianRupee}
          index={4}
        />
      </div>

      <Card>
        <CardHeader
          title="Recent Approved Vouchers"
          subtitle="Ready for reimbursement processing."
          action={
            <Link
              to="/accounts/vouchers?status=APPROVED"
              className="text-sm text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              View all approved
            </Link>
          }
        />
        <CardBody>
          {(d.recentApproved ?? []).length === 0 ? (
            <EmptyState
              title="No approved vouchers yet"
              message="Approved vouchers will appear here for reimbursement."
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Voucher No.', 'Employee', 'Approval Date', 'Amount'].map((h) => (
                        <th key={h} scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(d.recentApproved ?? []).map((a) => (
                      <tr key={a.voucherId} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-blue-700">
                          <Link to={`/accounts/vouchers/${a.voucherId}`} className="hover:underline">
                            {a.voucherNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">{a.employeeName}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">{formatDate(a.approvalDate)}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-right text-sm font-medium">{formatINR(a.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-gray-200 md:hidden">
                {(d.recentApproved ?? []).map((a) => (
                  <li key={a.voucherId}>
                    <Link to={`/accounts/vouchers/${a.voucherId}`} className="block px-1 py-2.5">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-blue-700">{a.voucherNumber}</span>
                        <span className="text-sm font-semibold">{formatINR(a.amount)}</span>
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        {a.employeeName} · {formatDate(a.approvalDate)}
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
