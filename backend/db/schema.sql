CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TYPE user_role AS ENUM ('EMPLOYEE','DIRECTOR','ACCOUNTS');
CREATE TYPE voucher_status AS ENUM ('DRAFT','SUBMITTED','PENDING_APPROVAL','APPROVED','REJECTED');
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(120) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(100) NOT NULL,
  role            user_role    NOT NULL,
  employee_code   VARCHAR(50),
  department      VARCHAR(100),
  signature_path  VARCHAR(255),
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uq ON users (lower(email));
CREATE TABLE IF NOT EXISTS vouchers (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_number          VARCHAR(30)  NOT NULL UNIQUE,
  voucher_date            DATE         NOT NULL DEFAULT CURRENT_DATE,
  expense_date            DATE         NOT NULL,
  department_name         VARCHAR(100) NOT NULL,
  expense_title           VARCHAR(150) NOT NULL,
  expense_category        VARCHAR(60)  NOT NULL DEFAULT 'Miscellaneous',
  expense_description     TEXT,
  amount                  NUMERIC(12,2) NOT NULL CHECK (amount > 0),

  employee_id             UUID NOT NULL REFERENCES users(id),
  employee_name           VARCHAR(120) NOT NULL,
  employee_code           VARCHAR(50),
  employee_signature_path VARCHAR(255),

  status                  voucher_status NOT NULL DEFAULT 'DRAFT',
  submitted_at            TIMESTAMPTZ,

  director_id             UUID REFERENCES users(id),
  director_name           VARCHAR(120),
  director_signature_path VARCHAR(255),
  approval_date           TIMESTAMPTZ,
  rejection_reason        TEXT,
  rejected_at             TIMESTAMPTZ,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_title_not_blank   CHECK (length(btrim(expense_title)) > 0),
  CONSTRAINT chk_dept_not_blank    CHECK (length(btrim(department_name)) > 0),
  CONSTRAINT chk_emp_sig_when_submitted
    CHECK (status = 'DRAFT' OR employee_signature_path IS NOT NULL),
  CONSTRAINT chk_dir_sig_when_approved
    CHECK (status <> 'APPROVED' OR (director_signature_path IS NOT NULL AND approval_date IS NOT NULL AND director_id IS NOT NULL)),
  CONSTRAINT chk_reason_when_rejected
    CHECK (status <> 'REJECTED' OR (rejection_reason IS NOT NULL AND length(btrim(rejection_reason)) > 0 AND rejected_at IS NOT NULL))
);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vouchers_updated ON vouchers;
CREATE TRIGGER trg_vouchers_updated BEFORE UPDATE ON vouchers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TABLE IF NOT EXISTS voucher_status_history (
  id           BIGSERIAL PRIMARY KEY,
  voucher_id   UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  from_status  voucher_status,
  to_status    voucher_status NOT NULL,
  actor_id     UUID NOT NULL REFERENCES users(id),
  actor_name   VARCHAR(120) NOT NULL,
  actor_role   user_role NOT NULL,
  remarks      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS voucher_counters (year INT PRIMARY KEY, last_value INT NOT NULL);

CREATE TABLE IF NOT EXISTS schema_migrations (
  filename VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vouchers_employee_status ON vouchers (employee_id, status);
CREATE INDEX IF NOT EXISTS idx_vouchers_status          ON vouchers (status);
CREATE INDEX IF NOT EXISTS idx_vouchers_expense_date    ON vouchers (expense_date);
CREATE INDEX IF NOT EXISTS idx_vouchers_voucher_date    ON vouchers (voucher_date);
CREATE INDEX IF NOT EXISTS idx_vouchers_department      ON vouchers (department_name);
CREATE INDEX IF NOT EXISTS idx_vouchers_category        ON vouchers (expense_category);
CREATE INDEX IF NOT EXISTS idx_vouchers_amount          ON vouchers (amount);
CREATE INDEX IF NOT EXISTS idx_vouchers_updated_at      ON vouchers (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_created          ON voucher_status_history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_voucher          ON voucher_status_history (voucher_id);
