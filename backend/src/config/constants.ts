export const ROLES = ['EMPLOYEE', 'DIRECTOR', 'ACCOUNTS'] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = ['DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'] as const;
export type VoucherStatus = (typeof STATUSES)[number];

export const DEPARTMENTS = [
  'Engineering', 'Finance', 'HR', 'Sales', 'Marketing', 'Operations', 'IT', 'Legal', 'Admin',
] as const;

export const CATEGORIES = [
  'Travel', 'Accommodation', 'Food & Meals', 'Fuel', 'Office Supplies',
  'Communication', 'Training', 'Medical', 'Miscellaneous',
] as const;

export const SORT_FIELDS = [
  'voucherNumber', 'voucherDate', 'expenseDate', 'amount', 'status', 'employeeName', 'updatedAt', 'createdAt',
] as const;

export const SORT_COLUMN_MAP: Record<string, string> = {
  voucherNumber: 'v.voucher_number',
  voucherDate: 'v.voucher_date',
  expenseDate: 'v.expense_date',
  amount: 'v.amount',
  status: 'v.status',
  employeeName: 'v.employee_name',
  updatedAt: 'v.updated_at',
  createdAt: 'v.created_at',
};
