# ARCHITECTURE.md

## 1. Repository layout
```
expense-voucher-system/
├─ README.md
├─ docker-compose.yml                # postgres:15
├─ .gitignore
├─ docs/
│  ├─ screenshots/                   # optional screenshots / demo video link
│  └─ (copy of DATABASE.md, API.md)
├─ backend/
│  ├─ package.json  tsconfig.json  .env.example  .eslintrc  vitest.config.ts
│  ├─ db/
│  │  ├─ migrations/
│  │  │  ├─ 001_extensions_and_enums.sql
│  │  │  ├─ 002_users.sql
│  │  │  ├─ 003_vouchers.sql
│  │  │  ├─ 004_voucher_history_and_counters.sql
│  │  │  └─ 005_indexes.sql
│  │  ├─ schema.sql                  # full snapshot for reviewers
│  │  ├─ migrate.ts                  # runner: applies pending files, tracks in schema_migrations
│  │  └─ seed.ts                     # demo users (+ optional sample vouchers)
│  ├─ uploads/                       # gitignored; signatures/<uuid>.<ext>
│  └─ src/
│     ├─ server.ts                   # bootstrap + graceful shutdown
│     ├─ app.ts                      # express app, middleware, routes
│     ├─ config/env.ts               # Zod-validated env
│     ├─ config/constants.ts         # roles, statuses, departments, categories
│     ├─ db/pool.ts                  # pg Pool + withTransaction helper
│     ├─ middleware/                 # authenticate, authorize, validate, upload, errorHandler, notFound, rateLimit
│     ├─ modules/
│     │  ├─ auth/        (routes, controller, service, schema)
│     │  ├─ users/       (profile signature)
│     │  ├─ vouchers/    (routes, controller, service, repository, schema, stateMachine, voucherNumber)
│     │  ├─ dashboard/   (routes, controller, service, repository)
│     │  ├─ files/       (authorized signature streaming)
│     │  └─ meta/        (options)
│     ├─ utils/          (AppError, asyncHandler, logger, money, dates, fileType)
│     └─ tests/          (unit + integration with supertest)
└─ frontend/
   ├─ package.json  vite.config.ts  tailwind.config.js  .env.example
   └─ src/
      ├─ main.tsx  App.tsx  router.tsx
      ├─ api/            (axios client, auth.api, vouchers.api, dashboard.api, meta.api)
      ├─ auth/           (AuthContext, useAuth, ProtectedRoute, RoleRoute)
      ├─ components/     (layout/, ui/, vouchers/, dashboard/, forms/)
      ├─ pages/          (Login, employee/, director/, accounts/, shared/, errors/)
      ├─ hooks/  lib/ (zod schemas, formatters, constants)  types/
      └─ styles/ (tailwind + print.css)
```

## 2. Backend layering
`route → validate(zod) → authenticate → authorize(role) → controller → service → repository → pg`
- **Routes:** declare path, middleware chain only.
- **Controllers:** parse req, call service, shape response. No SQL, no rules.
- **Services:** business rules, state machine, transactions, file handling orchestration.
- **Repositories:** parameterized SQL, map snake_case ↔ camelCase.
- **Middleware:** `authenticate` (verify JWT, load user id/role; re-check user `is_active`), `authorize(...roles)`, `validate({body,query,params})`, `uploadSignature` (multer memory storage 2 MB, single field), `errorHandler` (maps AppError/Zod/Multer/pg errors to the standard envelope; never leaks stack in production).
- **Transactions:** `withTransaction(async (client) => ...)` helper; all multi-step writes use it.

## 3. Conventions
- TypeScript strict mode. camelCase in JSON, snake_case in SQL.
- IDs: UUID v4 (`gen_random_uuid()`); human key is `voucherNumber`.
- Response envelope: success `{ "data": ..., "meta"?: {...} }`; error `{ "error": { "code", "message", "details"? } }`.
- Dates: `YYYY-MM-DD` for date-only fields, ISO-8601 UTC for timestamps.
- Amount: decimal string `"1250.50"`.
- Logging: pino, request id per request (`x-request-id`), no PII/secrets.
- Config via env only; fail fast on invalid env.

## 4. Environment variables
`backend/.env.example`
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://evms:evms_password@localhost:5432/evms
JWT_SECRET=change-me-to-a-long-random-string-min-32-chars
JWT_EXPIRES_IN=8h
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=2
APP_TIMEZONE=Asia/Kolkata
REVIEWERS_SEE_DRAFTS=false
LOGIN_RATE_LIMIT_MAX=10
```
`frontend/.env.example`
```
VITE_API_BASE_URL=http://localhost:5000/api
```
`docker-compose.yml` provides `evms` DB/user matching `DATABASE_URL`.

## 5. NPM scripts
Backend: `dev`, `build`, `start`, `migrate`, `seed`, `lint`, `typecheck`, `test`.
Frontend: `dev`, `build`, `preview`, `lint`, `typecheck`, `test`.

## 6. Session strategy
JWT (HS256) in `Authorization: Bearer`. Payload: `sub` (user id), `role`. Frontend stores token in `localStorage`, restores session via `GET /auth/me` on load, Axios request interceptor attaches token, response interceptor logs out + redirects on `401`. Trade-off (XSS vs CSRF) noted in README. Logout = clear client state (stateless JWT).

## 7. File storage
Local disk `UPLOAD_DIR/signatures/<uuid>.<ext>`; DB stores relative path only. Replacement of a signature deletes the old file after the DB commit. Files are served via `GET /api/vouchers/:id/signatures/:type` and `GET /api/users/me/signature/image` using authorization checks and `Cache-Control: private, no-store`. Storage access wrapped behind a `FileStorage` interface so S3 can replace it.
