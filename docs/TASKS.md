# TASKS.md — Phased build plan (check off as you go)

## Phase 0 — Scaffold
- [ ] Monorepo, `.gitignore`, `docker-compose.yml` (Postgres 15, volume, healthcheck)
- [ ] Backend TS project, ESLint/Prettier, env validation (`config/env.ts`), `.env.example`
- [ ] Frontend Vite+TS+Tailwind project, `.env.example`
**Checkpoint:** both apps start; `GET /api/health` returns ok with DB up.

## Phase 1 — Database
- [ ] Migrations 001–005 + runner + `schema.sql` snapshot (see `DATABASE.md`)
- [ ] Seed script (4 users) + optional `seed:demo`
**Checkpoint:** `npm run migrate && npm run seed` on a fresh DB succeeds; re-run is idempotent; CHECK constraints verified by SQL (TESTING G).

## Phase 2 — Backend core & auth
- [ ] `AppError`, error middleware, `asyncHandler`, logger, request id, helmet/cors/rate-limit
- [ ] `validate` middleware (Zod), `authenticate`, `authorize`
- [ ] Auth module: login, me, logout
- [ ] Meta options endpoint
**Checkpoint:** TESTING A (1–3) pass.

## Phase 3 — Files & signatures
- [ ] `FileStorage` (local), upload middleware, magic-byte detector
- [ ] Profile signature endpoints; authorized image streaming
**Checkpoint:** TESTING B17, A-level image access checks pass.

## Phase 4 — Vouchers backend
- [ ] Repository (scoped list with filters/sort/pagination, get by id with scope, CRUD)
- [ ] Voucher number generator (transactional counter)
- [ ] State machine + services: create, update, delete, employee-signature, submit, approve, reject, history, `permissions` computation
- [ ] Routes + schemas for all endpoints in `API.md`
**Checkpoint:** TESTING B, C, D, E all pass.

## Phase 5 — Dashboard backend
- [ ] Role-based aggregates per `WORKFLOW_RULES.md §6`
**Checkpoint:** TESTING F passes.

## Phase 6 — Frontend foundation
- [ ] Axios client + interceptors, AuthContext, session restore, ProtectedRoute/RoleRoute, router
- [ ] Layout shell (responsive), UI kit (Button, Input, Select, Textarea, Modal, Badge, Card, Table, Pagination, Toast, Skeleton, EmptyState, ErrorState, ImageUploader, SecureImage)
- [ ] Login page
**Checkpoint:** TESTING A (3–5).

## Phase 7 — Employee UI
- [ ] Dashboard, Create/Edit form (Zod, uploader, draft/submit), My Vouchers (filters/sort/pagination), Details (+timeline), Profile signature
**Checkpoint:** Manual smoke steps up to submit.

## Phase 8 — Director UI
- [ ] Dashboard, Pending Approvals, All Vouchers, Details with Approve/Reject dialogs
**Checkpoint:** approve and reject flows end-to-end.

## Phase 9 — Accounts UI
- [ ] Dashboard, All Vouchers, Details read-only, Print view
**Checkpoint:** full smoke script (TESTING I).

## Phase 10 — Hardening & polish
- [ ] Responsive pass, accessibility pass, empty/error states, copy review
- [ ] Backend + frontend test suites green, lint/typecheck clean
- [ ] Remove dead code, console logs; `npm audit` review

## Phase 11 — Documentation & submission
- [ ] Finalize `README.md` (setup, schema explanation + ER diagram, API docs, assumptions D1–D13, demo credentials, verification notes, extras)
- [ ] Copy `DATABASE.md`/`API.md` into `docs/` (optional OpenAPI/Postman)
- [ ] Screenshots / short demo video in `docs/screenshots/` (optional but recommended)
- [ ] Tick every box in `REQUIREMENTS.md`; verify `.env.example` files and migration files are committed
- [ ] Verify clean-clone setup by following README literally
