# FRONTEND.md — React app specification

## 1. Stack & setup
React 18 + Vite + TypeScript, React Router v6, TanStack Query (server state), React Hook Form + Zod (forms), Axios, Tailwind CSS, lucide-react icons, react-hot-toast (or similar). Mobile-first responsive.

## 2. Routes
| Path | Screen | Allowed roles |
|---|---|---|
| `/login` | Login | public (redirect to dashboard if already logged in) |
| `/` | Redirect to role dashboard | auth |
| `/employee/dashboard` | Employee Dashboard | EMPLOYEE |
| `/employee/vouchers/new` | Create Voucher | EMPLOYEE |
| `/employee/vouchers` | My Vouchers | EMPLOYEE |
| `/employee/vouchers/:id` | Voucher Details | EMPLOYEE (own) |
| `/employee/vouchers/:id/edit` | Edit Draft Voucher | EMPLOYEE (own, DRAFT; else redirect to details with toast) |
| `/employee/profile` | Profile / My Signature (upload, preview, replace, remove) | EMPLOYEE |
| `/director/dashboard` | Director Dashboard | DIRECTOR |
| `/director/pending` | Pending Approvals | DIRECTOR |
| `/director/vouchers` | All Vouchers | DIRECTOR |
| `/director/vouchers/:id` | Voucher Details + Approve/Reject | DIRECTOR |
| `/director/profile` | Saved signature | DIRECTOR |
| `/accounts/dashboard` | Accounts Dashboard | ACCOUNTS |
| `/accounts/vouchers` | All Vouchers | ACCOUNTS |
| `/accounts/vouchers/:id` | Voucher Details (read-only) + Print | ACCOUNTS |
| `/403`, `*` | Forbidden / Not Found | — |

`ProtectedRoute` (requires auth, shows full-page loader while session restores) and `RoleRoute` (redirects to own dashboard / 403). Visiting another role's URL must never render its content.

## 3. Layout
Responsive shell: top bar (app name, user name + role badge, logout) + collapsible sidebar (drawer on mobile) with role-specific nav. Content max-width container. Breadcrumbs optional.

## 4. Screens in detail
**Login:** email + password, show/hide password, inline validation, error banner for invalid credentials, loading state, demo-credentials hint (dev only).

**Employee Dashboard:** 6 stat cards (Total, Draft, Pending Approval, Approved, Rejected, Total Amount Claimed with info tooltip describing definition), quick actions (Create Voucher), recent 5 vouchers table.

**Create / Edit Voucher form:** fields — Voucher Number (shows "Auto-generated" on create; actual on edit, read-only), Voucher Date (read-only, today), Expense Date (date picker, max today), Department (select, required), Expense Title (required), Expense Category (select), Expense Description (textarea w/ counter), Amount (numeric, > 0, 2 decimals, currency prefix), Employee Name (read-only from profile), Employee ID (optional), Employee Signature (image uploader with drag/drop, preview, replace, "use my saved signature" if exists). Buttons: **Save as Draft**, **Submit for Approval** (confirm dialog; blocked with inline error if signature missing), Cancel. Unsaved-changes warning. Server errors mapped onto fields.

**My Vouchers / All Vouchers (shared `VoucherListPage`):** filter bar (search box; voucher number; employee name [reviewers only]; department; category; status multi-select; date range with field switch; amount min/max; Reset), sortable column headers + sort dropdown for mobile, pagination (page size 10/25/50), status badges, amount right-aligned formatted (`en-IN`/INR configurable), row click → details. Filters synced to URL query string so refresh/share works. Debounce search 400 ms. Table → stacked cards on < 768px. Empty state & loading skeleton & error retry.
- **Pending Approvals** = same list pre-filtered to `PENDING_APPROVAL`, oldest first.
- Employee list rows show Edit/Delete icons only for Draft (confirm delete).

**Voucher Details (shared `VoucherDetailPage`):** sections — Basic Information, Employee Information (name, ID, signature image), Approval Information (status badge, director signature image, approval date, rejection reason in a highlighted alert for REJECTED), Audit Information (created, last updated), Status timeline (from history). Action bar driven by `permissions`: Employee Draft → Edit / Delete / Submit; Director pending → Approve / Reject; Accounts → Print. Signatures fetched through authenticated Axios as blob → object URL (since `<img src>` can't send the Bearer header); revoke URLs on unmount.

**Approve dialog (Director):** signature upload (required; preview) or "Use my saved signature"; optional remarks; Confirm. Blocked until signature supplied.
**Reject dialog (Director):** reason textarea (required, 5–1000 chars, counter), Confirm. Both show spinner and prevent double-submit; on success invalidate queries + toast.

**Director Dashboard:** cards (Pending Approval Count, Approved Today, Rejected Today, Total Pending Amount), Recent Voucher Activity feed, "Review pending" CTA.

**Accounts Dashboard:** cards (Total Vouchers, Pending Approval, Approved, Rejected, Total Approved Expense Amount), Recent Approved Vouchers table (reimbursement queue), link to All Vouchers prefiltered to Approved.

**Print view:** `window.print()` with `print.css` — hides nav/buttons, A4 layout, company header "ABC Company – Expense Voucher", all fields, both signatures, approval stamp.

## 5. UX & quality requirements
- Every async view has loading, empty, and error states. Buttons disable while pending.
- Accessible: labels bound to inputs, `aria-invalid`/`aria-describedby` on errors, focus trap in dialogs, keyboard operable, sufficient contrast, status not conveyed by color alone (text + icon).
- Status colors: Draft gray, Submitted blue, Pending amber, Approved green, Rejected red.
- Client-side image check before upload (type/size) with friendly messages; same limits as server.
- Token expiry → redirect to `/login` with "Session expired" message and `from` return path.
- Format money with `Intl.NumberFormat`, dates with `Intl.DateTimeFormat`; never do float math on amounts (display strings from API).
- Role-specific nav only; no dead links.
- React Query keys: `['vouchers', filters]`, `['voucher', id]`, `['dashboard']`; invalidate on mutations.

## 6. Form validation (Zod mirror of server)
Same constraints as `WORKFLOW_RULES.md §4`. Messages: "Department is required", "Expense title is required", "Expense date is required", "Amount is required", "Amount must be greater than zero", "Employee signature is required before submission", "Director signature is required before approval", "Rejection reason is required".
