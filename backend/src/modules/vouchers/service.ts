import { pool, withTransaction } from '../../db/pool.js';
import { nextVoucherNumber } from './voucherNumber.js';
import { assertEditable } from './stateMachine.js';
import { AppError } from '../../utils/AppError.js';
import { saveSignature, deleteStoredFile } from '../../utils/fileStorage.js';
import { isFutureDate } from '../../utils/dates.js';

function validateCommon(body: any) {
  if (!body.departmentName?.trim()) throw new AppError(422, 'VALIDATION_ERROR', 'Department is required');
  if (!body.expenseTitle?.trim() || body.expenseTitle.trim().length < 3)
    throw new AppError(422, 'VALIDATION_ERROR', 'Expense title is required');
  if (!body.expenseDate) throw new AppError(422, 'VALIDATION_ERROR', 'Expense date is required');
  if (isFutureDate(body.expenseDate)) throw new AppError(422, 'VALIDATION_ERROR', 'Expense date cannot be in the future');
  const n = Number(body.amount);
  if (!body.amount || !(n > 0)) throw new AppError(422, 'VALIDATION_ERROR', 'Amount must be greater than zero');
}

export async function createVoucher(user: { id: string; name: string }, body: any) {
  validateCommon(body);
  return withTransaction(async (client) => {
    const { rows: urows } = await client.query('SELECT name, employee_code FROM users WHERE id=$1', [user.id]);
    const year = new Date().getFullYear();
    const number = await nextVoucherNumber(client, year);
    const { rows } = await client.query(
      `INSERT INTO vouchers (voucher_number, expense_date, department_name, expense_title, expense_category, expense_description, amount, employee_id, employee_name, employee_code, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'DRAFT') RETURNING *`,
      [number, body.expenseDate, body.departmentName, body.expenseTitle.trim(), body.expenseCategory ?? 'Miscellaneous', body.expenseDescription ?? null, body.amount, user.id, urows[0].name, body.employeeCode ?? urows[0].employee_code ?? null]
    );
    const v = rows[0];
    await client.query(
      `INSERT INTO voucher_status_history (voucher_id, from_status, to_status, actor_id, actor_name, actor_role) VALUES ($1,NULL,'DRAFT',$2,$3,'EMPLOYEE')`,
      [v.id, user.id, urows[0].name]
    );
    return v;
  });
}

export async function updateVoucher(user: { id: string }, id: string, body: any) {
  validateCommon(body);
  return withTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM vouchers WHERE id=$1 FOR UPDATE', [id]);
    const v = rows[0];
    if (!v || v.employee_id !== user.id) throw new AppError(404, 'VOUCHER_NOT_FOUND', 'Voucher not found');
    assertEditable(v.status);
    const { rows: updated } = await client.query(
      `UPDATE vouchers SET department_name=$1, expense_title=$2, expense_date=$3, expense_category=$4, expense_description=$5, amount=$6, employee_code=$7 WHERE id=$8 RETURNING *`,
      [body.departmentName, body.expenseTitle.trim(), body.expenseDate, body.expenseCategory ?? v.expense_category, body.expenseDescription ?? null, body.amount, body.employeeCode ?? v.employee_code, id]
    );
    return updated[0];
  });
}

export async function deleteVoucher(user: { id: string }, id: string) {
  return withTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM vouchers WHERE id=$1 FOR UPDATE', [id]);
    const v = rows[0];
    if (!v || v.employee_id !== user.id) throw new AppError(404, 'VOUCHER_NOT_FOUND', 'Voucher not found');
    assertEditable(v.status);
    await client.query('DELETE FROM vouchers WHERE id=$1', [id]);
    return v;
  }).then(async (v) => {
    await deleteStoredFile(v.employee_signature_path);
    return v;
  });
}

export async function setEmployeeSignature(user: { id: string }, id: string, buffer: Buffer, mime: string) {
  const stored = await saveSignature(buffer, mime);
  return withTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM vouchers WHERE id=$1 FOR UPDATE', [id]);
    const v = rows[0];
    if (!v || v.employee_id !== user.id) {
      await deleteStoredFile(stored.relativePath);
      throw new AppError(404, 'VOUCHER_NOT_FOUND', 'Voucher not found');
    }
    assertEditable(v.status);
    const old = v.employee_signature_path as string | null;
    const { rows: updated } = await client.query(
      'UPDATE vouchers SET employee_signature_path=$1 WHERE id=$2 RETURNING *',
      [stored.relativePath, id]
    );
    if (old) await deleteStoredFile(old);
    return updated[0];
  });
}

export async function submitVoucher(user: { id: string; name: string }, id: string) {
  return withTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM vouchers WHERE id=$1 FOR UPDATE', [id]);
    const v = rows[0];
    if (!v || v.employee_id !== user.id) throw new AppError(404, 'VOUCHER_NOT_FOUND', 'Voucher not found');
    assertEditable(v.status);
    let sigPath = v.employee_signature_path as string | null;
    if (!sigPath) {
      const { rows: urows } = await client.query('SELECT signature_path FROM users WHERE id=$1', [user.id]);
      const saved = urows[0]?.signature_path as string | null;
      if (!saved) throw new AppError(422, 'SIGNATURE_REQUIRED', 'Employee signature is required before submission');
      // copy file
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const crypto = await import('node:crypto');
      const { env } = await import('../../config/env.js');
      const buf = await fs.readFile(path.join(env.UPLOAD_DIR, saved));
      const ext = saved.split('.').pop() ?? 'png';
      const name = `${crypto.randomUUID()}.${ext}`;
      await fs.mkdir(path.join(env.UPLOAD_DIR, 'signatures'), { recursive: true });
      await fs.writeFile(path.join(env.UPLOAD_DIR, 'signatures', name), buf);
      sigPath = `signatures/${name}`;
    }
    const { rows: updated } = await client.query(
      `UPDATE vouchers SET employee_signature_path=$1, status='PENDING_APPROVAL', submitted_at=now() WHERE id=$2 RETURNING *`,
      [sigPath, id]
    );
    await client.query(
      `INSERT INTO voucher_status_history (voucher_id, from_status, to_status, actor_id, actor_name, actor_role) VALUES ($1,'DRAFT','SUBMITTED',$2,$3,'EMPLOYEE'), ($1,'SUBMITTED','PENDING_APPROVAL',$2,$3,'EMPLOYEE')`,
      [id, user.id, user.name]
    );
    return updated[0];
  });
}

export async function approveVoucher(
  director: { id: string; name: string },
  id: string,
  opts: { buffer?: Buffer; mime?: string; useSavedSignature?: boolean; remarks?: string }
) {
  let storedPath: string | null = null;
  if (opts.buffer) {
    const stored = await saveSignature(opts.buffer, opts.mime!);
    storedPath = stored.relativePath;
  }
  try {
    return await withTransaction(async (client) => {
      const { rows } = await client.query('SELECT * FROM vouchers WHERE id=$1 FOR UPDATE', [id]);
      const v = rows[0];
      if (!v) throw new AppError(404, 'VOUCHER_NOT_FOUND', 'Voucher not found');
      if (v.status !== 'PENDING_APPROVAL' && v.status !== 'SUBMITTED')
        throw new AppError(409, 'INVALID_STATE_TRANSITION', 'Only pending vouchers can be approved');
      if (!storedPath && opts.useSavedSignature) {
        const { rows: urows } = await client.query('SELECT signature_path, name FROM users WHERE id=$1', [director.id]);
        const saved = urows[0]?.signature_path as string | null;
        if (!saved) throw new AppError(422, 'SIGNATURE_REQUIRED', 'Director signature is required before approval');
        // copy saved signature to voucher snapshot
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const crypto = await import('node:crypto');
        const { env } = await import('../../config/env.js');
        const buf = await fs.readFile(path.join(env.UPLOAD_DIR, saved));
        const ext = saved.split('.').pop() ?? 'png';
        const name = `${crypto.randomUUID()}.${ext}`;
        await fs.writeFile(path.join(env.UPLOAD_DIR, 'signatures', name), buf);
        storedPath = `signatures/${name}`;
      }
      if (!storedPath) throw new AppError(422, 'SIGNATURE_REQUIRED', 'Director signature is required before approval');
      const { rows: updated } = await client.query(
        `UPDATE vouchers SET status='APPROVED', director_id=$1, director_name=$2, director_signature_path=$3, approval_date=now() WHERE id=$4 RETURNING *`,
        [director.id, director.name, storedPath, id]
      );
      await client.query(
        `INSERT INTO voucher_status_history (voucher_id, from_status, to_status, actor_id, actor_name, actor_role, remarks) VALUES ($1,$2,'APPROVED',$3,$4,'DIRECTOR',$5)`,
        [id, v.status, director.id, director.name, opts.remarks ?? null]
      );
      return updated[0];
    });
  } catch (e) {
    if (opts.buffer && storedPath) await deleteStoredFile(storedPath);
    throw e;
  }
}

export async function rejectVoucher(director: { id: string; name: string }, id: string, reason: string) {
  const r = reason?.trim() ?? '';
  if (r.length < 5) throw new AppError(422, 'REJECTION_REASON_REQUIRED', 'Rejection reason is required');
  if (r.length > 1000) throw new AppError(422, 'VALIDATION_ERROR', 'Rejection reason too long');
  return withTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM vouchers WHERE id=$1 FOR UPDATE', [id]);
    const v = rows[0];
    if (!v) throw new AppError(404, 'VOUCHER_NOT_FOUND', 'Voucher not found');
    if (v.status !== 'PENDING_APPROVAL' && v.status !== 'SUBMITTED')
      throw new AppError(409, 'INVALID_STATE_TRANSITION', 'Only pending vouchers can be rejected');
    const { rows: updated } = await client.query(
      `UPDATE vouchers SET status='REJECTED', rejection_reason=$1, rejected_at=now(), director_id=$2, director_name=$3 WHERE id=$4 RETURNING *`,
      [r, director.id, director.name, id]
    );
    await client.query(
      `INSERT INTO voucher_status_history (voucher_id, from_status, to_status, actor_id, actor_name, actor_role, remarks) VALUES ($1,$2,'REJECTED',$3,$4,'DIRECTOR',$5)`,
      [id, v.status, director.id, director.name, r]
    );
    return updated[0];
  });
}

export async function getHistory(id: string) {
  const { rows } = await pool.query(
    'SELECT id, voucher_id AS "voucherId", from_status AS "from", to_status AS "to", actor_id AS "actorId", actor_name AS "actorName", actor_role AS "actorRole", remarks, created_at AS "at" FROM voucher_status_history WHERE voucher_id=$1 ORDER BY created_at ASC',
    [id]
  );
  return rows;
}
