import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { VoucherFilters } from '../types';

const DEFAULTS: VoucherFilters = {
  page: 1,
  limit: 10,
  sortBy: 'updatedAt',
  sortOrder: 'desc',
};

const STRING_KEYS = [
  'search',
  'voucherNumber',
  'employeeName',
  'department',
  'category',
  'status',
  'dateField',
  'dateFrom',
  'dateTo',
  'amountMin',
  'amountMax',
  'sortBy',
  'sortOrder',
] as const;

function parseParams(sp: URLSearchParams): VoucherFilters {
  const page = Number.parseInt(sp.get('page') ?? '1', 10);
  const limit = Number.parseInt(sp.get('limit') ?? '10', 10);
  const filters: VoucherFilters = {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit:
      Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 10,
    sortBy: sp.get('sortBy') || DEFAULTS.sortBy,
    sortOrder: sp.get('sortOrder') === 'asc' ? 'asc' : 'desc',
  };
  for (const k of STRING_KEYS) {
    const v = sp.get(k);
    if (v !== null && v !== '') {
      (filters as unknown as Record<string, unknown>)[k] = v;
    }
  }
  if (
    filters.dateField !== 'expenseDate' &&
    filters.dateField !== 'voucherDate'
  ) {
    delete filters.dateField;
  }
  return filters;
}

/**
 * Voucher filters synced to the URL query string so refresh/share works.
 * Returns [filters, setFilters(patch), resetFilters].
 */
export function useVoucherFilters(preset?: Partial<VoucherFilters>) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<VoucherFilters>(() => {
    const fromUrl = parseParams(searchParams);
    return { ...DEFAULTS, ...preset, ...fromUrl };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<VoucherFilters>, opts?: { resetPage?: boolean }) => {
      const next = new URLSearchParams(searchParams.toString());
      const entries = Object.entries(patch) as [keyof VoucherFilters, unknown][];
      for (const [k, v] of entries) {
        if (v === undefined || v === null || v === '') next.delete(k);
        else next.set(k, String(v));
      }
      if (opts?.resetPage !== false && !('page' in patch)) {
        next.set('page', '1');
      }
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams],
  );

  const resetFilters = useCallback(() => {
    const next = new URLSearchParams();
    if (preset?.status) next.set('status', preset.status);
    if (preset?.sortBy) next.set('sortBy', preset.sortBy);
    if (preset?.sortOrder) next.set('sortOrder', preset.sortOrder);
    setSearchParams(next, { replace: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setSearchParams]);

  return [filters, setFilters, resetFilters] as const;
}
