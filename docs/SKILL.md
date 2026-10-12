# SKILL.md — Expense Voucher Management System (EVMS)

> **Entry point for the coding agent.** Read this file first, then the docs in the order below.
> Source spec: "Full Stack Developer Internship Assignment" (Expense Voucher Management System).
> Every instruction from that spec is tracked in `REQUIREMENTS.md`. Nothing may be skipped.

## 1. Mission
Build a complete, production-quality, web-based **Expense Voucher Management System** that digitizes voucher creation, approval and tracking for "ABC Company". Three roles: **Employee**, **Director (Admin)**, **Accounts Team**. The result is judged on: frontend, backend, authentication, authorization, database design, REST APIs, file uploads, validation, and clean architecture.

## 2. Reading order
| # | File | Purpose |
|---|------|---------|
| 1 | `SKILL.md` | Rules, decisions, definition of done (this file) |
| 2 | `REQUIREMENTS.md` | Every requirement from the PDF as a checklist with IDs |
| 3 | `WORKFLOW_RULES.md` | State machine, business rules, validations, permission matrix |
| 4 | `ARCHITECTURE.md` | Stack, folder structure, layering, conventions |
| 5 | `DATABASE.md` | Schema, constraints, indexes, migrations, seeds |
| 6 | `API.md` | Every REST endpoint, payloads, errors |
| 7 | `FRONTEND.md` | Screens, routes, components, UX states |
| 8 | `SECURITY.md` | Auth, authorization, upload hardening |
| 9 | `TESTING.md` | Acceptance matrix + automated tests |
| 10 | `TASKS.md` | Phase-by-phase build plan with checkpoints |
| 11 | `README.md` | Template of the final repo README (agent must finalize it) |

## 3. Non-negotiable rules
1. **Authorization is enforced on the server**, never only in the UI. Hiding a button is not security.
2. An Employee must never be able to read, edit, delete or submit another employee's voucher (return `404` for others' vouchers to avoid leaking existence; `403` for role violations).
3. Voucher number is **auto-generated, unique, race-safe** (DB transaction + counter row). The client never supplies it.
4. State transitions go through **one service** (state machine). No route may set `status` directly.
5. Approved / Rejected / Submitted / Pending vouchers are **read-only for everybody** (enforced in service + tested).
6. Validation exists on **both** client (React Hook Form + Zod) and server (Zod). Server is the source of truth.
7. Signature images are validated by **MIME + magic bytes + size**, stored with random filenames, and served only through an **authenticated, authorized endpoint** (not public static).
8. Never commit secrets. Provide `.env.example` in backend and frontend. Never log passwords/tokens.
9. All money values use `NUMERIC(12,2)` in DB and are returned as decimal **strings** from the API; sums are computed in SQL.
10. Use parameterized queries only. No string-built SQL.
11. Do not add features that contradict the spec (e.g., Director editing employee data, Accounts approving). Optional extras are allowed only if they do not break a rule and are listed in README "Extras".
12. The spec marks its content confidential: **do not copy the original PDF into the repo**; paraphrase requirements in docs.

## 4. Technology decisions (fixed unless blocked)
- **Frontend:** React 18 + Vite + TypeScript, React Router v6, TanStack Query, React Hook Form + Zod, Axios, Tailwind CSS. Responsive (mobile → desktop).
- **Backend:** Node.js 20 + Express + TypeScript, `pg` (node-postgres), Zod, `jsonwebtoken`, `bcrypt`, `multer`, `helmet`, `cors`, `express-rate-limit`, `pino` logger.
- **Database:** PostgreSQL 15+ with plain SQL migration files + a small migration runner and seed script. `docker-compose.yml` for local Postgres.
- **Tests:** Vitest/Jest + Supertest (backend), Vitest + Testing Library (frontend, key forms/guards).
- **Layout:** monorepo — `backend/`, `frontend/`, `docs/`, root `README.md`, `docker-compose.yml`.

## 5. Resolved ambiguities (document these in README → "Assumptions")
| ID | Ambiguity in spec | Decision |
|----|-------------------|----------|
| D1 | "Submitted" and "Pending Approval" are separate states in the diagram | Keep **both** enum values. On submit, one transaction moves `DRAFT → SUBMITTED → PENDING_APPROVAL` and writes two history rows. Director actions are allowed on `PENDING_APPROVAL` (and defensively on `SUBMITTED`). Dashboards/filters "Pending Approval" = `PENDING_APPROVAL`. |
| D2 | "View all vouchers" for Director/Accounts vs. other people's unfinished drafts | By default reviewers see **all vouchers except other users' DRAFTs** (drafts aren't submitted yet). Env flag `REVIEWERS_SEE_DRAFTS=true` includes them. Documented in README. |
| D3 | What happens after rejection | `REJECTED` is **terminal & read-only** (rule: rejected vouchers can't be modified). Employee sees rejection reason and may create a new voucher. (Optional extra: "Duplicate as new draft" button — copies fields, no signature.) |
| D4 | Signatures | Employee can upload a signature on the voucher form and/or store one on their profile (`PUT /users/me/signature`). Submit requires the voucher to have an employee signature; if absent but profile signature exists, copy it to the voucher (snapshot). Director must upload a signature in the approve dialog (or tick "use my saved signature" if saved). Signatures are **snapshotted per voucher** so later profile changes never alter old vouchers. |
| D5 | Voucher number format | `VCH-<YYYY>-<6-digit-sequence>` e.g. `VCH-2026-000001`, sequence per calendar year from `voucher_counters` with row lock. Generated at draft creation. |
| D6 | Can drafts be saved partially? | Drafts require the mandatory fields (department, title, expense date, amount > 0) because the spec lists them as always mandatory. **Signature** is only required at submission. |
| D7 | Voucher Date | Set automatically to creation date (server), read-only. Expense Date chosen by employee, **cannot be in the future** (assumption). |
| D8 | Employee ID optional | `employee_code` copied from profile, editable per voucher, may be empty. |
| D9 | Category & Department lists | Fixed configurable lists served by `GET /api/meta/options`; server validates membership. Categories: Travel, Accommodation, Food & Meals, Fuel, Office Supplies, Communication, Training, Medical, Miscellaneous. Departments: Engineering, Finance, HR, Sales, Marketing, Operations, IT, Legal, Admin. |
| D10 | User management | Not in spec → **no public registration**. Users come from the seed script (1 Director, 1 Accounts, ≥2 Employees). |
| D11 | Pagination | All list endpoints paginated (`page`, `limit` default 10, max 100) with total count. |
| D12 | Download/print (optional) | Implement print-friendly voucher page (`@media print`) with "Print / Save as PDF" button for Accounts (and others who can view). |
| D13 | Dates/timezone | Store timestamps as `timestamptz` (UTC); "Today" for Director dashboard uses `APP_TIMEZONE` env (default `Asia/Kolkata`). |

## 6. Working method
1. Follow `TASKS.md` phase by phase. After each phase run lint, type-check, tests, and manually verify the phase checkpoint.
2. Keep the layering strict: `routes → controllers → services → repositories → db`. Controllers contain no business logic; repositories contain no business rules.
3. Write migrations before code that depends on them. Never edit an applied migration; add a new one.
4. Use consistent error format (see `API.md`) via a central error middleware and custom `AppError` classes.
5. Commit in small, meaningful commits (conventional commits).
6. Tick items in `REQUIREMENTS.md` only when implemented **and** covered by a test or a manual check recorded in `TESTING.md`.

## 7. Definition of Done
- [ ] Every checkbox in `REQUIREMENTS.md` is ticked.
- [ ] Every scenario in `TESTING.md` passes (automated or recorded manual).
- [ ] `docker compose up -d && npm run migrate && npm run seed` works from a clean clone for backend; frontend starts with `npm run dev`.
- [ ] `.env.example` files present for backend & frontend.
- [ ] Migration/schema files committed (`backend/db/migrations/*.sql`, plus `backend/db/schema.sql` snapshot).
- [ ] README finalized: setup, DB schema explanation, API documentation, assumptions, demo credentials, screenshots/video placeholder.
- [ ] No TypeScript errors, no ESLint errors, no console errors in browser on main flows.
- [ ] Responsive check at 360px, 768px, 1280px.

## 8. Things to never do
- Don't let Director edit voucher content. Don't let Accounts create/edit/delete/approve/reject.
- Don't trust `role`, `employeeId`, or `status` from request bodies.
- Don't serve uploads from a public folder. Don't keep original filenames.
- Don't return password hashes in any response.
- Don't skip empty/loading/error UI states.
