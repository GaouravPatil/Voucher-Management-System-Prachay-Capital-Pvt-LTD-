# REQUIREMENTS.md — Full Traceability Checklist

Every instruction from the assignment, ID-tagged. Tick `[x]` only when implemented AND verified.
Section numbers refer to the original assignment.

## §1–2 Introduction & Objectives
- [ ] OBJ-1 Replace the manual voucher approval process (Employee → Director → Accounts) with a web app.
- [ ] OBJ-2 Employees submit expense reimbursement requests.
- [ ] OBJ-3 Director approves or rejects vouchers.
- [ ] OBJ-4 Accounts Team views all vouchers for reimbursement processing.
- [ ] OBJ-5 Employees track the status of their submitted vouchers.
- [ ] OBJ-6 Centralized repository of all vouchers.
- [ ] OBJ-7 Only authorized users access information relevant to their role.
- [ ] OBJ-8 Demonstrates: frontend, backend, authentication, authorization, DB design, REST APIs, file uploads, validation, clean architecture.

## §3.1 Employee
Can:
- [ ] EMP-1 Login
- [ ] EMP-2 Create a new voucher
- [ ] EMP-3 Save voucher as Draft
- [ ] EMP-4 Submit voucher for approval
- [ ] EMP-5 Edit voucher while Draft
- [ ] EMP-6 Delete voucher while Draft
- [ ] EMP-7 Upload their signature (image upload)
- [ ] EMP-8 View only vouchers created by themselves
- [ ] EMP-9 View complete voucher details
- [ ] EMP-10 Track current status of vouchers

Cannot:
- [ ] EMP-N1 View vouchers of other employees (API returns 404, list excludes them)
- [ ] EMP-N2 Approve or reject vouchers (403)
- [ ] EMP-N3 Modify submitted, approved, or rejected vouchers (409/403, UI read-only)

## §3.2 Director (Admin)
Can:
- [ ] DIR-1 Login
- [ ] DIR-2 View all vouchers
- [ ] DIR-3 View pending approval requests
- [ ] DIR-4 Search, filter, and sort vouchers
- [ ] DIR-5 View voucher details
- [ ] DIR-6 Approve vouchers
- [ ] DIR-7 Reject vouchers
- [ ] DIR-8 Upload signature while approving
- [ ] DIR-9 Provide rejection reason while rejecting

Cannot:
- [ ] DIR-N1 Modify details entered by the employee (no edit endpoint/UI for Director)

## §3.3 Accounts Team
Can:
- [ ] ACC-1 Login
- [ ] ACC-2 View all vouchers across the organization
- [ ] ACC-3 Search, filter, sort vouchers (Bonus Point — implement)
- [ ] ACC-4 View voucher details
- [ ] ACC-5 View employee and director signatures
- [ ] ACC-6 View approval status
- [ ] ACC-7 Download or print vouchers (optional — implement print view)

Cannot:
- [ ] ACC-N1 Create vouchers
- [ ] ACC-N2 Edit vouchers
- [ ] ACC-N3 Delete vouchers
- [ ] ACC-N4 Approve or reject vouchers

## §4 Workflow
- [ ] WF-1 Draft → Submitted → Pending Approval
- [ ] WF-2 Pending Approval → Rejected; employee can view rejection reason
- [ ] WF-3 Pending Approval → Approved
- [ ] WF-4 Approved vouchers visible to Accounts for reimbursement processing (dashboard "Recent Approved Vouchers" + list filter)

## §5 Voucher Details (all fields stored, shown, returned by API)
Basic: 
- [ ] VD-1 Voucher Number
- [ ] VD-2 Voucher Date
- [ ] VD-3 Expense Date
- [ ] VD-4 Department Name
- [ ] VD-5 Expense Title
- [ ] VD-6 Expense Category
- [ ] VD-7 Expense Description
- [ ] VD-8 Amount

Employee info:
- [ ] VD-9 Employee Name
- [ ] VD-10 Employee ID (optional)
- [ ] VD-11 Employee Signature (image upload)

Approval info:
- [ ] VD-12 Current Status
- [ ] VD-13 Director Signature (image upload)
- [ ] VD-14 Approval Date
- [ ] VD-15 Rejection Reason (if rejected)

Audit:
- [ ] VD-16 Created Date
- [ ] VD-17 Last Updated Date

## §6 Functional Requirements
Authentication:
- [ ] AUTH-1 Log in securely (bcrypt, JWT, rate-limited)
- [ ] AUTH-2 Restrict access based on roles (server middleware)
- [ ] AUTH-3 Prevent unauthorized access to protected pages (React protected routes + role guards)
- [ ] AUTH-4 Maintain authenticated sessions (JWT persisted, restored on reload via `/auth/me`, auto-logout on 401/expiry)

Employee module: create, save Draft, submit, edit Draft, delete Draft, upload signature, view own vouchers, view details, track approval status
- [ ] FM-E1 … FM-E9 map to EMP-2, 3, 4, 5, 6, 7, 8, 9, 10

Director module: view all, view pending, search, filter, sort, view details, approve, reject, upload approval signature, enter rejection remarks
- [ ] FM-D1 … FM-D10 map to DIR-2…DIR-9 (+ remarks field on reject)

Accounts module: view all, search, filter, sort, view details, view approval status, view employee & director signatures
- [ ] FM-A1 … FM-A7 map to ACC-2…ACC-6

## §7 Search & Filter (Bonus — implement for Director, Accounts, and Employee's "My Vouchers")
- [ ] SF-1 Voucher Number (partial, case-insensitive)
- [ ] SF-2 Employee Name (partial, case-insensitive; reviewers only)
- [ ] SF-3 Department
- [ ] SF-4 Expense Category
- [ ] SF-5 Status
- [ ] SF-6 Date Range (on expense date; also offer voucher-date basis via `dateField` param)
- [ ] SF-7 Amount Range (min/max)
- [ ] SF-8 Sorting (voucher number, voucher date, expense date, amount, status, employee name, updated at; asc/desc)
- [ ] SF-9 Free-text `search` box matches voucher number, title, employee name

## §8 Dashboards
Employee (own data only):
- [ ] DB-E1 Total Vouchers
- [ ] DB-E2 Draft Vouchers
- [ ] DB-E3 Pending Approval
- [ ] DB-E4 Approved Vouchers
- [ ] DB-E5 Rejected Vouchers
- [ ] DB-E6 Total Amount Claimed (define: sum of amounts of non-draft vouchers — **state definition in UI tooltip & README**; also show approved total as secondary)

Director:
- [ ] DB-D1 Pending Approval Count
- [ ] DB-D2 Approved Today
- [ ] DB-D3 Rejected Today
- [ ] DB-D4 Total Pending Amount
- [ ] DB-D5 Recent Voucher Activity (last 10 status events w/ voucher no., actor, action, time)
- [ ] DB-D6 Director can view every voucher in the system

Accounts:
- [ ] DB-A1 Total Vouchers
- [ ] DB-A2 Pending Approval
- [ ] DB-A3 Approved Vouchers
- [ ] DB-A4 Rejected Vouchers
- [ ] DB-A5 Total Approved Expense Amount
- [ ] DB-A6 Recent Approved Vouchers
- [ ] DB-A7 Accounts can view every voucher in the system

## §9 Validation Rules (client + server)
- [ ] VAL-1 Department mandatory
- [ ] VAL-2 Expense Title mandatory
- [ ] VAL-3 Expense Date mandatory
- [ ] VAL-4 Amount mandatory
- [ ] VAL-5 Amount > 0
- [ ] VAL-6 Employee Signature mandatory before submission
- [ ] VAL-7 Director Signature mandatory before approval
- [ ] VAL-8 Rejection Reason mandatory when rejecting

## §10 Business Rules
- [ ] BR-1 Unique Voucher Number (DB unique constraint)
- [ ] BR-2 Auto-generated Voucher Number
- [ ] BR-3 New voucher is initially Draft
- [ ] BR-4 Employees edit/delete only in Draft
- [ ] BR-5 After submit, read-only for employees
- [ ] BR-6 Only Director approves/rejects submitted vouchers
- [ ] BR-7 Approved vouchers read-only
- [ ] BR-8 Rejected vouchers must include a rejection reason (DB CHECK + service)
- [ ] BR-9 Employees only view their own vouchers
- [ ] BR-10 Director views every voucher in organization
- [ ] BR-11 Accounts views every voucher in organization
- [ ] BR-12 Every submitted voucher includes employee signature (DB CHECK + service)
- [ ] BR-13 Every approved voucher includes Director signature (DB CHECK + service)

## §11 Screens
- [ ] SCR-1 Login
- [ ] SCR-2 Employee: Dashboard, Create Voucher, My Vouchers, Voucher Details, Edit Draft Voucher
- [ ] SCR-3 Director: Dashboard, Pending Approvals, All Vouchers, Voucher Details
- [ ] SCR-4 Accounts: Dashboard, All Vouchers, Voucher Details

## §12 Technical Requirements
Frontend:
- [ ] TECH-F1 React
- [ ] TECH-F2 Responsive design
- [ ] TECH-F3 Form validation
- [ ] TECH-F4 Protected routes
Backend:
- [ ] TECH-B1 Node.js
- [ ] TECH-B2 Express.js (or NestJS)
- [ ] TECH-B3 RESTful APIs
- [ ] TECH-B4 JWT authentication
- [ ] TECH-B5 Proper error handling
Database:
- [ ] TECH-D1 PostgreSQL
File upload:
- [ ] TECH-U1 Image upload for Employee Signature
- [ ] TECH-U2 Image upload for Director Signature

## §13 Submission Requirements
- [ ] SUB-1 Git repository with complete source code
- [ ] SUB-2 README: project setup instructions
- [ ] SUB-3 README: database schema explanation
- [ ] SUB-4 README: API documentation
- [ ] SUB-5 README: assumptions made during development
- [ ] SUB-6 Database schema or migration files
- [ ] SUB-7 `.env.example` file(s)
- [ ] SUB-8 Screenshots or short demo video (optional — add `docs/screenshots/`)
- [ ] SUB-9 Confidentiality note respected (original PDF not committed)
