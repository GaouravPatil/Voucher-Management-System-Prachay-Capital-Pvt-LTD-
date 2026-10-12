# SECURITY.md

## Authentication
- Passwords hashed with bcrypt (`BCRYPT_ROUNDS` ≥ 12). Policy for seeded users: ≥ 8 chars.
- Login: constant generic error ("Invalid email or password"), compare against dummy hash when user not found (timing), rate limit (`LOGIN_RATE_LIMIT_MAX` per 15 min per IP+email), inactive users rejected.
- JWT HS256, secret ≥ 32 chars from env, expiry `JWT_EXPIRES_IN`; claims: `sub`, `role`, `iat`, `exp`. Server re-loads user per request (or short cache) so role changes/deactivation take effect.

## Authorization
- `authenticate` then `authorize(roles)` on every protected route; service layer re-checks ownership/state (defense in depth).
- Ownership failures return 404 (no existence leak). Never take `employeeId`, `role`, `status`, `directorId` from request bodies.
- Sorting/filtering fields are whitelisted → mapped to SQL identifiers.

## Input validation & injection
- Zod schemas for body/query/params on every route; reject unknown keys (`.strict()`).
- Parameterized SQL only; LIKE patterns escape `%`, `_`, `\`.
- Output encoding is handled by React; never use `dangerouslySetInnerHTML`.

## File upload hardening
- multer memory storage, size limit, single file, field-name whitelist.
- Check MIME header **and** magic bytes (PNG `89 50 4E 47`, JPEG `FF D8 FF`, WEBP `RIFF....WEBP`). Reject SVG/GIF/others.
- Random UUID filename + extension derived from detected type; stored outside any static web root; directory not browsable.
- Serve via authorized endpoint with `X-Content-Type-Options: nosniff`, `Content-Disposition: inline`, `Cache-Control: private, no-store`.
- Delete orphaned files on voucher delete/replace (after commit; failures logged, not fatal).

## HTTP hardening
- `helmet`, CORS allowlist from `CORS_ORIGIN`, JSON body limit (100 kb), global rate limit (e.g., 300/15 min), `x-powered-by` disabled, HTTPS expected behind a proxy (`trust proxy` configurable).
- Central error handler: no stack traces or SQL errors to clients in production; map pg unique violation (23505) → 409, check violation (23514) → 422/409.

## Frontend
- Token in localStorage (documented trade-off vs httpOnly cookie; mitigated by no inline HTML rendering, strict CSP-friendly build). Clear on logout/401.
- Route guards are UX only; all real checks are on the API.

## Secrets & ops
- `.env` gitignored; `.env.example` has placeholders only. No secrets in logs. Dependency audit (`npm audit`) noted in README.
