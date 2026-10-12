# WORKFLOW_RULES.md — State Machine, Permissions, Validation, Business Rules

## 1. Status enum
`DRAFT`, `SUBMITTED`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`
UI labels: Draft, Submitted, Pending Approval, Approved, Rejected.

## 2. State machine (single source: `voucher.stateMachine.ts`)
```
DRAFT --submit(employee, owner)--> SUBMITTED --(auto, same tx)--> PENDING_APPROVAL
PENDING_APPROVAL --approve(director)--> APPROVED     (terminal, read-only)
PENDING_APPROVAL --reject(director)---> REJECTED     (terminal, read-only, reason visible to employee)
```
Allowed transitions table (anything else → `409 INVALID_STATE_TRANSITION`):
| From | To | Actor | Preconditions |
|------|----|-------|---------------|
| DRAFT | SUBMITTED | Employee (owner) | all mandatory fields valid; employee signature present on voucher (or copied from profile) |
| SUBMITTED | PENDING_APPROVAL | system (same transaction) | — |
| PENDING_APPROVAL (or SUBMITTED) | APPROVED | Director | director signature provided; sets `director_id`, `director_name`, `director_signature_path`, `approval_date = now()` |
| PENDING_APPROVAL (or SUBMITTED) | REJECTED | Director | non-empty trimmed `reason` (min 5, max 1000 chars); sets `rejection_reason`, `rejected_at`, `director_id` |

Every transition: inside one DB transaction, `SELECT ... FOR UPDATE` the voucher row, re-check status, update, insert `voucher_status_history`. This prevents double approval / race conditions.

## 3. Permission matrix (server-enforced)
| Action | Employee | Director | Accounts |
|---|---|---|---|
| Login | ✅ | ✅ | ✅ |
| Create voucher | ✅ | ❌ | ❌ |
| Edit voucher | ✅ own + DRAFT only | ❌ | ❌ |
| Delete voucher | ✅ own + DRAFT only | ❌ | ❌ |
| Submit voucher | ✅ own + DRAFT only | ❌ | ❌ |
| Upload employee signature | ✅ own + DRAFT only (and profile) | ❌ | ❌ |
| List vouchers | own only | all (see D2) | all (see D2) |
| View details | own only | any | any |
| Approve / Reject | ❌ | ✅ (PENDING only) | ❌ |
| Upload director signature | ❌ | ✅ (during approve / profile) | ❌ |
| View both signatures | own voucher | ✅ | ✅ |
| Search/filter/sort | ✅ own scope | ✅ | ✅ |
| Dashboard | own stats | global stats | global stats |
| Print view | ✅ own | ✅ | ✅ |

Error mapping: wrong role → `403 FORBIDDEN`; not owner / not found → `404 VOUCHER_NOT_FOUND`; wrong state → `409 INVALID_STATE` (e.g. `VOUCHER_NOT_EDITABLE`); validation → `422 VALIDATION_ERROR`; unauthenticated → `401`.

## 4. Field validation (client Zod + server Zod, identical rules)
| Field | Rule |
|---|---|
| departmentName | required, must be in configured list |
| expenseTitle | required, trimmed, 3–150 chars |
| expenseDate | required, valid ISO date, not in future |
| expenseCategory | must be in configured list (default "Miscellaneous") |
| expenseDescription | optional, ≤ 2000 chars |
| amount | required, number/decimal string, **> 0**, ≤ 99,999,999.99, max 2 decimals |
| employeeCode | optional, ≤ 50 chars, alphanumeric/-/_ |
| employee signature | required **at submit**; png/jpg/jpeg/webp, ≤ 2 MB |
| director signature | required **at approve**; same image rules |
| rejection reason | required **at reject**; 5–1000 chars after trim |

## 5. Business rules → enforcement points
| Rule | Enforcement |
|---|---|
| BR-1 unique number | `UNIQUE(voucher_number)` + counter table |
| BR-2 auto number | `voucherNumber.service` inside create transaction |
| BR-3 initial Draft | `status` default `DRAFT`; create ignores any client status |
| BR-4/5 edit/delete only Draft | service guard `assertEditable(voucher)`; UI hides actions; test with each non-draft status |
| BR-6 only Director decides | `requireRole('DIRECTOR')` + service check |
| BR-7 approved read-only | same guard |
| BR-8 rejection reason | Zod + DB CHECK |
| BR-9 own-only | repository query always includes `employee_id = $user` for EMPLOYEE |
| BR-10/11 reviewers see all | scope = all (minus other drafts unless flag) |
| BR-12 employee signature on submitted | service + DB CHECK |
| BR-13 director signature on approved | service + DB CHECK |

## 6. Dashboard metric definitions
- **Employee:** total = all own vouchers; draft/pending/approved/rejected counts; `totalAmountClaimed` = SUM(amount) of own vouchers with status ≠ DRAFT (submitted, pending, approved, rejected). Also return `approvedAmount`.
- **Director:** `pendingCount` (PENDING_APPROVAL), `approvedToday` / `rejectedToday` (decision timestamp within today in `APP_TIMEZONE`), `totalPendingAmount` = SUM(amount) of PENDING_APPROVAL, `recentActivity` = latest 10 history rows.
- **Accounts:** `totalVouchers` (reviewer scope), `pendingCount`, `approvedCount`, `rejectedCount`, `totalApprovedAmount`, `recentApproved` = latest 10 approved by `approval_date`.
