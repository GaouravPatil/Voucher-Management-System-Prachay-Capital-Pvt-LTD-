import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowUpDown, Pencil, RotateCcw, Search, Trash2 } from 'lucide-react';
import { vouchersApi } from '../../api/vouchers.api';
import { metaApi } from '../../api/meta.api';
import { apiErrorMessage } from '../../api/client';
import { useVoucherFilters } from '../../hooks/useVoucherFilters';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../auth/useAuth';
import {
  CATEGORIES,
  DEPARTMENTS,
  SORT_FIELD_LABELS,
  STATUS_LABELS,
} from '../../lib/constants';
import { formatDate, formatINR } from '../../lib/formatters';
import type { Voucher, VoucherFilters, VoucherStatus } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Pagination } from '../ui/Pagination';
import { Select } from '../ui/Select';
import { TableSkeleton } from '../ui/Skeleton';

export type ListScope = 'employee' | 'director' | 'accounts';

interface Props {
  scope: ListScope;
  title: string;
  subtitle?: string;
  preset?: Partial<VoucherFilters>;
  detailBase: string;
  showEmployeeFilter?: boolean;
  allowCreate?: boolean;
}

const STATUS_OPTIONS: { value: string; label: string }[] = (
  Object.keys(STATUS_LABELS) as VoucherStatus[]
).map((s) => ({ value: s, label: STATUS_LABELS[s] }));

/** Shared filterable/sortable/paginated voucher list (URL-synced, debounced search). */
export function VoucherListPage({
  scope,
  title,
  subtitle,
  preset,
  detailBase,
  showEmployeeFilter = false,
  allowCreate = false,
}: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [filters, setFilters, resetFilters] = useVoucherFilters(preset);
  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  const [deleteTarget, setDeleteTarget] = useState<Voucher | null>(null);

  const debouncedSearch = useDebounce(searchInput, 400);

  // Sync the debounced search term into the URL (resetting the page), so
  // refresh/share preserves it. Guarded to avoid update loops.
  useEffect(() => {
    const current = filters.search ?? '';
    if (debouncedSearch !== current) {
      setFilters(
        { search: debouncedSearch || undefined, page: 1 },
        { resetPage: false },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Keep the textbox in sync when the URL changes externally (back/forward).
  useEffect(() => {
    const fromUrl = filters.search ?? '';
    if (fromUrl !== searchInput) setSearchInput(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  // Push the debounced search into the URL (reset page).
  const effectiveFilters: VoucherFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch || undefined }),
    [filters, debouncedSearch],
  );

  const queryKey = useMemo(
    () => ['vouchers', scope, effectiveFilters],
    [scope, effectiveFilters],
  );

  const listQuery = useQuery({
    queryKey,
    queryFn: () =>
      preset?.status === 'PENDING_APPROVAL' && scope === 'director'
        ? vouchersApi.pending({ ...effectiveFilters, status: 'PENDING_APPROVAL' })
        : vouchersApi.list(effectiveFilters),
    placeholderData: (prev) => prev,
  });

  const { data: options } = useQuery({
    queryKey: ['meta-options'],
    queryFn: metaApi.options,
    staleTime: 10 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vouchersApi.remove(id),
    onSuccess: () => {
      toast.success('Voucher deleted.');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Failed to delete voucher.')),
  });

  const departments = options?.departments?.length ? options.departments : [...DEPARTMENTS];
  const categories = options?.categories?.length ? options.categories : [...CATEGORIES];

  const rows: Voucher[] = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;

  const toggleSort = (sortBy: string) => {
    if (filters.sortBy === sortBy) {
      setFilters(
        { sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' },
        { resetPage: false },
      );
    } else {
      setFilters({ sortBy, sortOrder: 'desc' }, { resetPage: false });
    }
  };

  const goDetail = (v: Voucher) => navigate(`${detailBase}/${v.id}`);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {allowCreate && user?.role === 'EMPLOYEE' && (
          <Button onClick={() => navigate('/employee/vouchers/new')}>
            New Voucher
          </Button>
        )}
      </div>

      {/* Filter bar */}
      <Card>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <label htmlFor="voucher-search" className="sr-only">
              Search vouchers
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                id="voucher-search"
                type="search"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                }}
                placeholder="Search number, title, employee…"
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <Input
            aria-label="Voucher number"
            placeholder="Voucher no."
            value={filters.voucherNumber ?? ''}
            onChange={(e) => setFilters({ voucherNumber: e.target.value || undefined })}
          />
          {showEmployeeFilter && (
            <Input
              aria-label="Employee name"
              placeholder="Employee name"
              value={filters.employeeName ?? ''}
              onChange={(e) => setFilters({ employeeName: e.target.value || undefined })}
            />
          )}
          <Select
            aria-label="Department"
            placeholder="All departments"
            value={filters.department ?? ''}
            onChange={(e) => setFilters({ department: e.target.value || undefined })}
            options={departments.map((d) => ({ value: d, label: d }))}
          />
          <Select
            aria-label="Category"
            placeholder="All categories"
            value={filters.category ?? ''}
            onChange={(e) => setFilters({ category: e.target.value || undefined })}
            options={categories.map((c) => ({ value: c, label: c }))}
          />
          <Select
            aria-label="Status"
            placeholder="All statuses"
            value={(filters.status ?? '').split(',')[0] || ''}
            onChange={(e) => setFilters({ status: e.target.value || undefined })}
            options={STATUS_OPTIONS}
          />
          <Select
            aria-label="Sort by"
            value={filters.sortBy ?? 'updatedAt'}
            onChange={(e) => setFilters({ sortBy: e.target.value }, { resetPage: false })}
            options={Object.entries(SORT_FIELD_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <Input
            aria-label="Date from"
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(e) => setFilters({ dateFrom: e.target.value || undefined })}
          />
          <Input
            aria-label="Date to"
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(e) => setFilters({ dateTo: e.target.value || undefined })}
          />
          <Select
            aria-label="Date field"
            value={filters.dateField ?? 'expenseDate'}
            onChange={(e) =>
              setFilters({ dateField: e.target.value as 'expenseDate' | 'voucherDate' })
            }
            options={[
              { value: 'expenseDate', label: 'By expense date' },
              { value: 'voucherDate', label: 'By voucher date' },
            ]}
          />
          <Input
            aria-label="Minimum amount"
            inputMode="decimal"
            placeholder="Min amount"
            value={filters.amountMin ?? ''}
            onChange={(e) => setFilters({ amountMin: e.target.value || undefined })}
          />
          <Input
            aria-label="Maximum amount"
            inputMode="decimal"
            placeholder="Max amount"
            value={filters.amountMax ?? ''}
            onChange={(e) => setFilters({ amountMax: e.target.value || undefined })}
          />
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchInput('');
                resetFilters();
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset filters
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setFilters(
                  { sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' },
                  { resetPage: false },
                )
              }
              aria-label={`Toggle sort direction (now ${filters.sortOrder ?? 'desc'})`}
            >
              <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
              {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Results */}
      <Card>
        {listQuery.isLoading ? (
          <TableSkeleton rows={6} />
        ) : listQuery.isError ? (
          <ErrorState
            message={apiErrorMessage(listQuery.error, 'Failed to load vouchers.')}
            onRetry={() => listQuery.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No vouchers found"
            message="Try adjusting your filters, or create a new voucher."
            action={
              allowCreate && user?.role === 'EMPLOYEE' ? (
                <Button onClick={() => navigate('/employee/vouchers/new')}>
                  Create voucher
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {(
                      [
                        { k: 'voucherNumber', label: 'Voucher No.' },
                        { k: 'expenseTitle', label: 'Title' },
                        ...(showEmployeeFilter
                          ? [{ k: 'employeeName', label: 'Employee' }]
                          : []),
                        { k: 'expenseDate', label: 'Expense Date' },
                        { k: 'amount', label: 'Amount' },
                        { k: 'status', label: 'Status' },
                        ...(scope === 'employee'
                          ? [{ k: '_actions', label: 'Actions' }]
                          : []),
                      ] as { k: string; label: string }[]
                    ).map((c) => (
                      <th
                        key={c.k}
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        {c.k.startsWith('_') ? (
                          c.label
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleSort(c.k)}
                            className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            aria-label={`Sort by ${c.label}`}
                          >
                            {c.label}
                            <span aria-hidden="true" className="text-gray-400">
                              {filters.sortBy === c.k
                                ? filters.sortOrder === 'asc'
                                  ? '▲'
                                  : '▼'
                                : '⇅'}
                            </span>
                          </button>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {rows.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-blue-700">
                        <button
                          type="button"
                          onClick={() => goDetail(v)}
                          className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          {v.voucherNumber}
                        </button>
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-900" title={v.expenseTitle}>
                        {v.expenseTitle}
                      </td>
                      {showEmployeeFilter && (
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {v.employee.name}
                        </td>
                      )}
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {formatDate(v.expenseDate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {formatINR(v.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={v.status} />
                      </td>
                      {scope === 'employee' && (
                        <td className="whitespace-nowrap px-4 py-3">
                          {v.permissions.canEdit || v.permissions.canDelete ? (
                            <span className="inline-flex gap-1">
                              {v.permissions.canEdit && (
                                <button
                                  type="button"
                                  aria-label={`Edit ${v.voucherNumber}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`${detailBase}/${v.id}/edit`);
                                  }}
                                  className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                  <Pencil className="h-4 w-4" aria-hidden="true" />
                                </button>
                              )}
                              {v.permissions.canDelete && (
                                <button
                                  type="button"
                                  aria-label={`Delete ${v.voucherNumber}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget(v);
                                  }}
                                  className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                                </button>
                              )}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards (<768px) */}
            <ul className="divide-y divide-gray-200 md:hidden">
              {rows.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => goDetail(v)}
                    className="block w-full px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-blue-700">
                        {v.voucherNumber}
                      </span>
                      <Badge status={v.status} />
                    </span>
                    <span className="mt-1 block truncate text-sm text-gray-900">
                      {v.expenseTitle}
                    </span>
                    <span className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {showEmployeeFilter ? `${v.employee.name} · ` : ''}
                        {formatDate(v.expenseDate)}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {formatINR(v.amount)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {meta && (
              <Pagination
                page={meta.page}
                limit={meta.limit}
                total={meta.total}
                totalPages={meta.totalPages}
                onPage={(page) => setFilters({ page }, { resetPage: false })}
                onLimit={(limit) => setFilters({ limit, page: 1 }, { resetPage: false })}
              />
            )}
          </>
        )}
      </Card>

      <Modal
        open={!!deleteTarget}
        title="Delete draft?"
        onClose={() => setDeleteTarget(null)}
      >
        <p className="text-sm text-gray-600">
          This will permanently delete voucher{' '}
          <span className="font-semibold">{deleteTarget?.voucherNumber}</span>.
          This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            disabled={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
