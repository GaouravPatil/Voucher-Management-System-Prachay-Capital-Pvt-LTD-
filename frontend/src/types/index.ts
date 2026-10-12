export type Role = 'EMPLOYEE' | 'DIRECTOR' | 'ACCOUNTS';

export type VoucherStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  employeeCode?: string | null;
  department?: string | null;
  hasSignature: boolean;
}

export interface Permissions {
  canEdit: boolean;
  canDelete: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
}

export interface SignatureInfo {
  present: boolean;
  url: string | null;
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  voucherDate: string;
  expenseDate: string;
  departmentName: string;
  expenseTitle: string;
  expenseCategory: string;
  expenseDescription?: string | null;
  /** Decimal string, e.g. "1250.50". Never do float math on this. */
  amount: string;
  employee: {
    id: string;
    name: string;
    employeeCode?: string | null;
  };
  employeeSignature: SignatureInfo;
  status: VoucherStatus;
  submittedAt?: string | null;
  director?: { id: string; name: string } | null;
  directorSignature: SignatureInfo;
  approvalDate?: string | null;
  rejectionReason?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  permissions: Permissions;
}

export interface VoucherHistoryItem {
  id: number;
  voucherId?: string;
  voucherNumber?: string;
  fromStatus: VoucherStatus | null;
  toStatus: VoucherStatus;
  actorId?: string;
  actorName: string;
  actorRole: Role;
  remarks?: string | null;
  createdAt: string;
  /** Alias some backends use */
  at?: string;
  action?: string;
  amount?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export type DateField = 'expenseDate' | 'voucherDate';

export interface VoucherFilters {
  page: number;
  limit: number;
  search?: string;
  voucherNumber?: string;
  employeeName?: string;
  department?: string;
  category?: string;
  status?: string;
  dateField?: DateField;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: string;
  amountMax?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Dashboard payloads (role-dependent, see API.md §5) */
export interface EmployeeDashboard {
  role: 'EMPLOYEE';
  totalVouchers: number;
  draft: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  totalAmountClaimed: string;
  approvedAmount: string;
}

export interface DirectorActivityItem {
  voucherId: string;
  voucherNumber: string;
  action: string;
  actorName: string;
  amount: string;
  at: string;
}

export interface DirectorDashboard {
  role: 'DIRECTOR';
  pendingCount: number;
  approvedToday: number;
  rejectedToday: number;
  totalPendingAmount: string;
  recentActivity: DirectorActivityItem[];
}

export interface ApprovedVoucherItem {
  voucherId: string;
  voucherNumber: string;
  employeeName: string;
  amount: string;
  approvalDate: string;
}

export interface AccountsDashboard {
  role: 'ACCOUNTS';
  totalVouchers: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  totalApprovedAmount: string;
  recentApproved: ApprovedVoucherItem[];
}

export type DashboardData =
  | EmployeeDashboard
  | DirectorDashboard
  | AccountsDashboard;

export interface MetaOptions {
  departments: string[];
  categories: string[];
  statuses: VoucherStatus[];
  sortFields: string[];
}

export interface ApiErrorDetails {
  field?: string;
  message: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: ApiErrorDetails[];
}
