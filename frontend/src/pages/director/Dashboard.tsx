import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  IndianRupee,
  XCircle,
} from 'lucide-react';
import { dashboardApi } from '../../api/dashboard.api';
import { apiErrorMessage } from '../../api/client';
import { formatDateTime, formatINR } from '../../lib/formatters';
import type { DirectorDashboard } from '../../types';
import { StatCard } from '../../components/dashboard/StatCard';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { CardsSkeleton, Skeleton } from '../../components/ui/Skeleton';

export function DirectorDashboard() {
  const navigate = useNavigate();
  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  });

  if (dashboard.isLoading) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label="Loading dashboard">
        <Skeleton className="h-8 w-56" />
        <CardsSkeleton count={4} />
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

  if (!dashboard.data || dashboard.data.role !== 'DIRECTOR') {
    return (
      <Card>
        <ErrorState message="Unexpected dashboard data for this role." />
      </Card>
    );
  }

  const d = dashboard.data as DirectorDashboard;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Director Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Review pending vouchers and track recent decisions.
          </p>
        </div>
        <Button onClick={() => navigate('/director/pending')}>
          <Clock className="h-4 w-4" aria-hidden="true" />
          Review pending ({d.pendingCount})
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Pending Approval" value={String(d.pendingCount)} icon={Clock} accent="from-amber-500 to-orange-600" index={0} />
        <StatCard title="Approved Today" value={String(d.approvedToday)} icon={CheckCircle2} accent="from-emerald-500 to-green-600" index={1} />
        <StatCard title="Rejected Today" value={String(d.rejectedToday)} icon={XCircle} accent="from-rose-500 to-red-600" index={2} />
        <StatCard title="Total Pending Amount" value={formatINR(d.totalPendingAmount)} icon={IndianRupee} index={3} />
      </div>

      <Card>
        <CardHeader
          title="Recent Voucher Activity"
          subtitle="Latest 10 status events across the organization."
        />
        <CardBody>
          {(d.recentActivity ?? []).length === 0 ? (
            <EmptyState title="No recent activity" message="Status changes will appear here." />
          ) : (
            <ol className="divide-y divide-gray-100">
              {(d.recentActivity ?? []).map((a, i) => (
                <li key={`${a.voucherId}-${i}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <Link
                      to={`/director/vouchers/${a.voucherId}`}
                      className="text-sm font-semibold text-blue-700 hover:underline"
                    >
                      {a.voucherNumber}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {a.action} by {a.actorName} · {formatDateTime(a.at)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatINR(a.amount)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
