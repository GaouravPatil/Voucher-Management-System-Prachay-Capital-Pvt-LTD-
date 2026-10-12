# How to Run — Expense Voucher Management System (EVMS)

## Prerequisites
- Node.js ≥ 20 (`node -v`)
- npm ≥ 10 (`npm -v`)
- Docker (for PostgreSQL) **or** a local PostgreSQL 15+

## 1. Start the database
```bash
cd expense-voucher-system
docker compose up -d
docker ps  # evms-postgres should be running on 5432
```

Or with local Postgres, ensure this URL works:
```
postgresql://evms:evms_password@localhost:5432/evms
```

## 2. Backend (http://localhost:5000)
```bash
cd backend
npm install
cp .env.example .env   # edit JWT_SECRET in production
npm run migrate        # applies db/migrations/*.sql
npm run seed           # creates 4 demo users
npm run dev            # http://localhost:5000, health: GET /api/health
```

Useful:
```bash
npm test        # vitest unit tests
npm run typecheck
npm run build && npm start
```

## 3. Frontend (http://localhost:5173)
```bash
cd ../frontend
npm install
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:5000/api
npm run dev            # http://localhost:5173
```

Useful:
```bash
npm run typecheck
npm run build
npm run preview
```

## 4. Login (local demo only)
| Role | Email | Password |
|---|---|---|
| Director | director@abc.com | Director@123 |
| Accounts | accounts@abc.com | Accounts@123 |
| Employee | emma@abc.com | Employee@123 |
| Employee | ethan@abc.com | Employee@123 |

## 5. Smoke test
1. Login as Emma → Create voucher → upload signature → Save draft → Submit
2. Login as Director → Pending Approvals → Approve with signature (or Reject with reason)
3. Login as Accounts → Dashboard shows Approved → open details → view both signatures → Print
4. Login as Emma → see Approved/Rejected + reason; Ethan cannot see Emma's vouchers

## Troubleshooting
- `GET /api/health` returns `{status:"ok",db:"up"}` — if `db:"down"`, check Docker / `DATABASE_URL`.
- `migrate` fails → `docker compose logs postgres`, ensure port 5432 free.
- Frontend 401 / session expired → login again; token is in localStorage.
- CORS error → `CORS_ORIGIN` in `backend/.env` must match frontend URL (default `http://localhost:5173`).
- Upload errors → PNG/JPEG/WEBP only, ≤ 2 MB.
- Ports in use → change `PORT` (backend) / Vite `--port` (frontend).
