import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { pool } from '../../db/pool.js';
import { env } from '../../config/env.js';

const r = Router();
r.use(authenticate);

r.get('/', asyncHandler(async (req: Request, res: Response) => {
  const role = req.user!.role;
  const me = req.user!.id;

  if (role === 'EMPLOYEE') {
    const { rows } = await pool.query(
      `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status='DRAFT')::int AS draft,
        COUNT(*) FILTER (WHERE status IN ('SUBMITTED','PENDING_APPROVAL'))::int AS pending,
        COUNT(*) FILTER (WHERE status='APPROVED')::int AS approved,
        COUNT(*) FILTER (WHERE status='REJECTED')::int AS rejected,
        COALESCE(SUM(amount) FILTER (WHERE status <> 'DRAFT'),0)::text AS claimed,
        COALESCE(SUM(amount) FILTER (WHERE status='APPROVED'),0)::text AS approved_amount
       FROM vouchers WHERE employee_id=$1`,
      [me]
    );
    const d = rows[0];
    return res.json({
      data: {
        role, totalVouchers: d.total, draft: d.draft, pendingApproval: d.pending,
        approved: d.approved, rejected: d.rejected,
        totalAmountClaimed: Number(d.claimed).toFixed(2), approvedAmount: Number(d.approved_amount).toFixed(2),
      },
    });
  }

  const reviewerDraftFilter = env.REVIEWERS_SEE_DRAFTS ? '' : `WHERE status <> 'DRAFT'`;

  if (role === 'DIRECTOR') {
    const { rows } = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE status='PENDING_APPROVAL')::int AS pending,
              COALESCE(SUM(amount) FILTER (WHERE status='PENDING_APPROVAL'),0)::text AS pending_amount,
              COUNT(*) FILTER (WHERE status='APPROVED' AND approval_date::date = (now() AT TIME ZONE $1)::date)::int AS approved_today,
              COUNT(*) FILTER (WHERE status='REJECTED' AND rejected_at::date = (now() AT TIME ZONE $1)::date)::int AS rejected_today
       FROM vouchers`,
      [env.APP_TIMEZONE]
    );
    const { rows: activity } = await pool.query(
      `SELECT voucher_id AS "voucherId", v.voucher_number AS "voucherNumber", to_status AS action, actor_name AS "actorName", v.amount::text AS amount, h.created_at AS at
       FROM voucher_status_history h JOIN vouchers v ON v.id=h.voucher_id
       ORDER BY h.created_at DESC LIMIT 10`
    );
    const d = rows[0];
    return res.json({
      data: {
        role, pendingCount: d.pending, approvedToday: d.approved_today, rejectedToday: d.rejected_today,
        totalPendingAmount: Number(d.pending_amount).toFixed(2),
        recentActivity: activity.map((a: any) => ({ ...a, amount: Number(a.amount).toFixed(2) })),
      },
    });
  }

  // ACCOUNTS
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status IN ('SUBMITTED','PENDING_APPROVAL'))::int AS pending,
            COUNT(*) FILTER (WHERE status='APPROVED')::int AS approved,
            COUNT(*) FILTER (WHERE status='REJECTED')::int AS rejected,
            COALESCE(SUM(amount) FILTER (WHERE status='APPROVED'),0)::text AS approved_amount
     FROM vouchers ${reviewerDraftFilter}`
  );
  const { rows: recent } = await pool.query(
    `SELECT id AS "voucherId", voucher_number AS "voucherNumber", employee_name AS "employeeName", amount::text AS amount, approval_date AS "approvalDate"
     FROM vouchers WHERE status='APPROVED' ORDER BY approval_date DESC LIMIT 10`
  );
  const d = rows[0];
  return res.json({
    data: {
      role, totalVouchers: d.total, pendingApproval: d.pending, approved: d.approved, rejected: d.rejected,
      totalApprovedAmount: Number(d.approved_amount).toFixed(2),
      recentApproved: recent.map((a: any) => ({ ...a, amount: Number(a.amount).toFixed(2) })),
    },
  });
}));

export default r;
