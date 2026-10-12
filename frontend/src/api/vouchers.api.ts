import { api, unwrap, type Envelope } from './client';
import type {
  Paginated,
  Voucher,
  VoucherFilters,
  VoucherHistoryItem,
} from '../types';

export interface CreateVoucherPayload {
  departmentName: string;
  expenseTitle: string;
  expenseDate: string;
  expenseCategory?: string;
  expenseDescription?: string;
  amount: string;
  employeeCode?: string;
}

function toQuery(filters: VoucherFilters): Record<string, string> {
  const q: Record<string, string> = {
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? 10),
  };
  const passthrough: (keyof VoucherFilters)[] = [
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
  ];
  for (const k of passthrough) {
    const v = filters[k];
    if (v !== undefined && v !== null && v !== '') q[k] = String(v);
  }
  return q;
}

export const vouchersApi = {
  /** Create DRAFT as JSON. Caller uploads signature afterwards via uploadEmployeeSignature. */
  create(payload: CreateVoucherPayload, _signature?: File | null) {
    return unwrap<Voucher>(api.post('/vouchers', payload));
  },

  list(filters: VoucherFilters) {
    return api
      .get<Envelope<Voucher[]>>('/vouchers', { params: toQuery(filters) })
      .then((res) => {
        const { data, meta } = res.data;
        const page = meta ?? {
          page: filters.page ?? 1,
          limit: filters.limit ?? 10,
          total: data.length,
          totalPages: 1,
        };
        return { data, meta: page } as Paginated<Voucher>;
      });
  },

  pending(filters: VoucherFilters) {
    return api
      .get<Envelope<Voucher[]>>('/vouchers/pending', {
        params: toQuery(filters),
      })
      .then((res) => {
        const { data, meta } = res.data;
        const page = meta ?? {
          page: filters.page ?? 1,
          limit: filters.limit ?? 10,
          total: data.length,
          totalPages: 1,
        };
        return { data, meta: page } as Paginated<Voucher>;
      });
  },

  get(id: string) {
    return unwrap<Voucher>(api.get(`/vouchers/${id}`));
  },

  history(id: string) {
    return unwrap<VoucherHistoryItem[]>(
      api.get(`/vouchers/${id}/history`),
    ).then((payload) => {
      // Server may return the array directly or { history: [...] } — normalize.
      if (Array.isArray(payload)) return payload;
      const obj = payload as unknown as {
        history?: VoucherHistoryItem[];
        data?: VoucherHistoryItem[];
      };
      if (Array.isArray(obj.history)) return obj.history;
      if (Array.isArray(obj.data)) return obj.data;
      return [];
    });
  },

  update(id: string, payload: CreateVoucherPayload) {
    return unwrap<Voucher>(api.put(`/vouchers/${id}`, payload));
  },

  uploadEmployeeSignature(id: string, file: File) {
    const form = new FormData();
    form.append('signature', file);
    return unwrap<Voucher>(
      api.put(`/vouchers/${id}/employee-signature`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },

  remove(id: string) {
    return api.delete(`/vouchers/${id}`);
  },

  submit(id: string) {
    return unwrap<Voucher>(api.post(`/vouchers/${id}/submit`));
  },

  approve(id: string, opts: { file?: File | null; useSavedSignature?: boolean; remarks?: string }) {
    const form = new FormData();
    if (opts.file) form.append('signature', opts.file);
    if (opts.useSavedSignature) form.append('useSavedSignature', 'true');
    if (opts.remarks) form.append('remarks', opts.remarks);
    return unwrap<Voucher>(
      api.post(`/vouchers/${id}/approve`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },

  reject(id: string, reason: string) {
    return unwrap<Voucher>(api.post(`/vouchers/${id}/reject`, { reason }));
  },

  employeeSignatureUrl(id: string) {
    return `/vouchers/${id}/signatures/employee`;
  },
  directorSignatureUrl(id: string) {
    return `/vouchers/${id}/signatures/director`;
  },
};
