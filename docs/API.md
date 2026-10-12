# API.md — REST API specification

Base URL: `/api`. JSON unless noted. Auth: `Authorization: Bearer <jwt>` on everything except `login` and `health`.

## Conventions
- Success: `{ "data": <payload>, "meta": { "page","limit","total","totalPages" }? }`
- Error: `{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [{ "field": "amount", "message": "Amount must be greater than 0" }] } }`
- Status codes: 200, 201, 204, 400 (malformed), 401 (missing/invalid/expired token), 403 (role), 404, 409 (state conflict / duplicate), 413 (file too large), 415 (bad file type), 422 (validation), 429 (rate limit), 500.
- Error codes: `UNAUTHENTICATED`, `INVALID_CREDENTIALS`, `FORBIDDEN`, `VOUCHER_NOT_FOUND`, `VALIDATION_ERROR`, `VOUCHER_NOT_EDITABLE`, `INVALID_STATE_TRANSITION`, `SIGNATURE_REQUIRED`, `REJECTION_REASON_REQUIRED`, `FILE_TOO_LARGE`, `UNSUPPORTED_FILE_TYPE`, `RATE_LIMITED`, `INTERNAL_ERROR`.

## Voucher object (response)
```json
{
  "id": "uuid",
  "voucherNumber": "VCH-2026-000001",
  "voucherDate": "2026-10-11",
  "expenseDate": "2026-10-09",
  "departmentName": "Engineering",
  "expenseTitle": "Client visit cab fare",
  "expenseCategory": "Travel",
  "expenseDescription": "…",
  "amount": "1250.50",
  "employee": { "id": "uuid", "name": "Emma Employee", "employeeCode": "E-1001" },
  "employeeSignature": { "present": true, "url": "/api/vouchers/<id>/signatures/employee" },
  "status": "PENDING_APPROVAL",
  "submittedAt": "…",
  "director": { "id": "uuid", "name": "Diana Director" } ,
  "directorSignature": { "present": false, "url": null },
  "approvalDate": null,
  "rejectionReason": null,
  "rejectedAt": null,
  "createdAt": "…",
  "updatedAt": "…",
  "permissions": { "canEdit": false, "canDelete": false, "canSubmit": false, "canApprove": true, "canReject": true }
}
```
`permissions` is computed server-side for the current user so the UI never guesses.

## 1. Health & Meta
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | none | `{status:"ok", db:"up"}` |
| GET | `/meta/options` | any | `{ departments[], categories[], statuses[], sortFields[] }` |

## 2. Auth
| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ data: { token, expiresIn, user:{id,name,email,role,employeeCode,department,hasSignature} } }` — rate-limited; generic "Invalid email or password" on failure |
| GET | `/auth/me` | — | current user (re-validated against DB; inactive → 401) |
| POST | `/auth/logout` | — | `204` (client clears token; endpoint exists for symmetry/audit) |

## 3. Profile signature (Employee & Director)
| Method | Path | Notes |
|---|---|---|
| PUT | `/users/me/signature` | `multipart/form-data`, field `signature` (png/jpg/jpeg/webp ≤ 2 MB). Roles: EMPLOYEE, DIRECTOR. Replaces previous. |
| GET | `/users/me/signature` | `{ present, url }` |
| GET | `/users/me/signature/image` | streams image (owner only) |
| DELETE | `/users/me/signature` | removes saved signature (does not affect existing vouchers) |

## 4. Vouchers
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/vouchers` | EMPLOYEE | Create **DRAFT**. Body: `departmentName, expenseTitle, expenseDate, expenseCategory?, expenseDescription?, amount, employeeCode?`. Server sets number, voucherDate, employee snapshot, status. Optionally multipart with `signature`. → `201` voucher |
| GET | `/vouchers` | ALL (scoped) | Paginated list; see query params below |
| GET | `/vouchers/pending` | DIRECTOR | Shortcut: list with `status=PENDING_APPROVAL` (same query params) |
| GET | `/vouchers/:id` | ALL (scoped) | Full details incl. `permissions` |
| GET | `/vouchers/:id/history` | ALL (scoped) | Status timeline |
| PUT | `/vouchers/:id` | EMPLOYEE (owner, DRAFT) | Update editable fields (same body as create). Non-draft → `409 VOUCHER_NOT_EDITABLE` |
| PUT | `/vouchers/:id/employee-signature` | EMPLOYEE (owner, DRAFT) | multipart field `signature` |
| DELETE | `/vouchers/:id` | EMPLOYEE (owner, DRAFT) | `204`; deletes signature file too |
| POST | `/vouchers/:id/submit` | EMPLOYEE (owner, DRAFT) | Validates all fields + signature (else `422 SIGNATURE_REQUIRED`); `DRAFT→SUBMITTED→PENDING_APPROVAL`; returns voucher |
| POST | `/vouchers/:id/approve` | DIRECTOR | `multipart/form-data`: `signature` (file) **or** `useSavedSignature=true`; optional `remarks`. Missing signature → `422 SIGNATURE_REQUIRED`. Sets director snapshot + approval date. |
| POST | `/vouchers/:id/reject` | DIRECTOR | JSON `{ reason }` (5–1000 chars). Missing → `422 REJECTION_REASON_REQUIRED` |
| GET | `/vouchers/:id/signatures/:type` | ALL (scoped) | `:type` = `employee` \| `director`; streams image with proper `Content-Type`, `Cache-Control: private, no-store` |

### List query parameters (`GET /vouchers`)
| Param | Type | Notes |
|---|---|---|
| `page`, `limit` | int | default 1 / 10, max limit 100 |
| `search` | string | matches voucher number, expense title, employee name (ILIKE) |
| `voucherNumber` | string | partial match |
| `employeeName` | string | partial match (ignored/forbidden-scope for EMPLOYEE — always own) |
| `department` | string | exact |
| `category` | string | exact |
| `status` | enum or comma list | e.g. `PENDING_APPROVAL,APPROVED` |
| `dateField` | `expenseDate` \| `voucherDate` | default `expenseDate` |
| `dateFrom`, `dateTo` | YYYY-MM-DD | inclusive; from ≤ to else 422 |
| `amountMin`, `amountMax` | decimal | min ≤ max else 422 |
| `sortBy` | `voucherNumber`,`voucherDate`,`expenseDate`,`amount`,`status`,`employeeName`,`updatedAt`,`createdAt` | whitelist → column map (never interpolate user input) |
| `sortOrder` | `asc`\|`desc` | default `desc` on `updatedAt` |

Scope rules applied in the repository: EMPLOYEE ⇒ `employee_id = :me`; DIRECTOR/ACCOUNTS ⇒ all, excluding `DRAFT` unless `REVIEWERS_SEE_DRAFTS=true`.

## 5. Dashboard
`GET /dashboard` — response depends on role.
```jsonc
// EMPLOYEE
{ "role":"EMPLOYEE", "totalVouchers":0, "draft":0, "pendingApproval":0, "approved":0, "rejected":0,
  "totalAmountClaimed":"0.00", "approvedAmount":"0.00" }
// DIRECTOR
{ "role":"DIRECTOR", "pendingCount":0, "approvedToday":0, "rejectedToday":0, "totalPendingAmount":"0.00",
  "recentActivity":[{ "voucherId","voucherNumber","action":"APPROVED","actorName","amount","at" }] }
// ACCOUNTS
{ "role":"ACCOUNTS", "totalVouchers":0, "pendingApproval":0, "approved":0, "rejected":0,
  "totalApprovedAmount":"0.00",
  "recentApproved":[{ "voucherId","voucherNumber","employeeName","amount","approvalDate" }] }
```

## 6. Upload rules (all signature endpoints)
Allowed MIME: `image/png`, `image/jpeg`, `image/webp`; verify magic bytes; max `MAX_UPLOAD_MB`; single file; random UUID filename; no SVG (XSS risk).

## 7. README API section
The final README must contain a condensed table of all endpoints above + example `curl` for login, create, submit, approve, reject, and list-with-filters. Optionally export an OpenAPI 3 file (`docs/openapi.yaml`) or Postman collection.
