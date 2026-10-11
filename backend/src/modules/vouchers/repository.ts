import { PoolClient } from 'pg';
import { pool } from '../../db/pool.js';
import { SORT_COLUMN_MAP } from '../../config/constants.js';
import { env } from '../../config/env.js';
import type { ListQuery } from './schema.js';

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export interface Scope {
  role: string;
  userId: string;
}

export function toVoucherJson(row: any, currentUser: { id: string; role: string }) {
  const canEdit =
    currentUser.role === 'EMPLOYEE' && row.employee_id === currentUser.id && row.status === 'DRAFT';
  const canDelete = canEdit;
  const canSubmit = canEdit;
  const canApprove =
    currentUser.role === 'DIRECTOR' && (row.status === 'PENDING_APPROVAL' || row.status === 'SUBMITTED');
  const canReject = canApprove;
  return {
    id: row.id,
    voucherNumber: row.voucher_number,
    voucherDate: row.voucher_date instanceof Date ? row.voucher_date.toISOString().slice(0, 10) : row.voucher_date,
    expenseDate: row.expense_date instanceof Date ? row.expense_date.toISOString().slice(0, 10) : row.expense_date,
    departmentName: row.department_name,
    expenseTitle: row.expense_title,
    expenseCategory: row.expense_category,
    expenseDescription: row.expense_description,
    amount: Number(row.amount).toFixed(2),
    employee: { id: row.employee_id, name: row.employee_name, employeeCode: row.employee_code },
    employeeSignature: {
      present: !!row.employee_signature_path,
      url: row.employee_signature_path ? `/api/vouchers/${row.id}/signatures/employee` : null,
    },
    status: row.status,
    submittedAt: row.submitted_at,
    director: row.director_id ? { id: row.director_id, name: row.director_name } : null,
    directorSignature: {
      present: !!row.director_signature_path,
      url: row.director_signature_path ? `/api/vouchers/${row.id}/signatures/director` : null,
    },
    approvalDate: row.approval_date,
    rejectionReason: row.rejection_reason,
    rejectedAt: row.rejected_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    permissions: { canEdit, canDelete, canSubmit, canApprove, canReject },
  };
}

export async function listVouchers(q: ListQuery, scope: Scope) {
  const where: string[] = [];
  const params: any[] = [];
  let i = 1;

  if (scope.role === 'EMPLOYEE') {
    where.push(`v.employee_id = $${i++}`);
    params.push(scope.userId);
  } else if (env.REVIEWERS_SEE_DRAFTS !== true) {
    where.push(`v.status <> 'DRAFT'`);
  }

  if (q.search) {
    where.push(`(v.voucher_number ILIKE $${i} ESCAPE '\\' OR v.expense_title ILIKE $${i} ESCAPE '\\' OR v.employee_name ILIKE $${i} ESCAPE '\\')`);
    params.push(`%${escapeLike(q.search)}%`);
    i++;
  }
  if (q.voucherNumber) {
    where.push(`v.voucher_number ILIKE $${i} ESCAPE '\\'`);
    params.push(`%${escapeLike(q.voucherNumber)}%`);
    i++;
  }
  if (q.employeeName && scope.role !== 'EMPLOYEE') {
    where.push(`v.employee_name ILIKE $${i} ESCAPE '\\'`);
    params.push(`%${escapeLike(q.employeeName)}%`);
    i++;
  }
  if (q.department) {
    where.push(`v.department_name = $${i++}`);
    params.push(q.department);
  }
  if (q.category) {
    where.push(`v.expense_category = $${i++}`);
    params.push(q.category);
  }
  if (q.status) {
    const statuses = q.status.split(',').map((s) => s.trim()).filter(Boolean);
    where.push(`v.status = ANY($${i++})`);
    params.push(statuses);
  }
  const dateCol = q.dateField === 'voucherDate' ? 'v.voucher_date' : 'v.expense_date';
  if (q.dateFrom) {
    where.push(`${dateCol} >= $${i++}`);
    params.push(q.dateFrom);
  }
  if (q.dateTo) {
    where.push(`${dateCol} <= $${i++}`);
    params.push(q.dateTo);
  }
  if (q.amountMin !== undefined) {
    where.push(`v.amount >= $${i++}`);
    params.push(q.amountMin);
  }
  if (q.amountMax !== undefined) {
    where.push(`v.amount <= $${i++}`);
    params.push(q.amountMax);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sortCol = SORT_COLUMN_MAP[q.sortBy] ?? 'v.updated_at';
  const dir = q.sortOrder === 'asc' ? 'ASC' : 'DESC';
  const limit = q.limit;
  const offset = (q.page - 1) * q.limit;

  const countSql = `SELECT COUNT(*)::int AS total FROM vouchers v ${whereSql}`;
  const dataSql = `SELECT v.* FROM vouchers v ${whereSql} ORDER BY ${sortCol} ${dir} LIMIT $${i++} OFFSET $${i++}`;
  const [countRes, dataRes] = await Promise.all([
    pool.query(countSql, params),
    pool.query(dataSql, [...params, limit, offset]),
  ]);
  const total = countRes.rows[0].total as number;
  return { rows: dataRes.rows, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getVoucherByIdScoped(id: string, scope: Scope, client?: PoolClient) {
  const q = client ?? pool;
  const { rows } = await q.query('SELECT * FROM vouchers WHERE id = $1', [id]);
  const v = rows[0];
  if (!v) return null;
  if (scope.role === 'EMPLOYEE' && v.employee_id !== scope.userId) return null;
  return v;
}
