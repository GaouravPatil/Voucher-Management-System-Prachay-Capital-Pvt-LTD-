import type { VoucherStatus } from '../types';

export const TOKEN_KEY = 'evms_token';

export const DEPARTMENTS = [
  'Engineering',
  'Finance',
  'HR',
  'Sales',
  'Marketing',
  'Operations',
  'IT',
  'Legal',
  'Admin',
] as const;

export const CATEGORIES = [
  'Travel',
  'Accommodation',
  'Food & Meals',
  'Fuel',
  'Office Supplies',
  'Communication',
  'Training',
  'Medical',
  'Miscellaneous',
] as const;

export const STATUSES: VoucherStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
];

export const STATUS_LABELS: Record<VoucherStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

/** Tailwind classes per status (text + icon, never color-only). */
export const STATUS_BADGE_CLASSES: Record<VoucherStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 ring-gray-300',
  SUBMITTED: 'bg-blue-100 text-blue-800 ring-blue-300',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800 ring-amber-300',
  APPROVED: 'bg-green-100 text-green-800 ring-green-300',
  REJECTED: 'bg-red-100 text-red-800 ring-red-300',
};

export const SORT_FIELDS = [
  'voucherNumber',
  'voucherDate',
  'expenseDate',
  'amount',
  'status',
  'employeeName',
  'updatedAt',
  'createdAt',
] as const;

export const SORT_FIELD_LABELS: Record<string, string> = {
  voucherNumber: 'Voucher Number',
  voucherDate: 'Voucher Date',
  expenseDate: 'Expense Date',
  amount: 'Amount',
  status: 'Status',
  employeeName: 'Employee Name',
  updatedAt: 'Last Updated',
  createdAt: 'Created Date',
};

export const PAGE_SIZE_OPTIONS = [10, 25, 50];

export const MAX_SIGNATURE_MB = 2;
export const MAX_SIGNATURE_BYTES = MAX_SIGNATURE_MB * 1024 * 1024;
export const ALLOWED_SIGNATURE_MIMES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;
export const ALLOWED_SIGNATURE_EXTS = ['.png', '.jpg', '.jpeg', '.webp'];

export const ROLE_HOME: Record<string, string> = {
  EMPLOYEE: '/employee/dashboard',
  DIRECTOR: '/director/dashboard',
  ACCOUNTS: '/accounts/dashboard',
};
