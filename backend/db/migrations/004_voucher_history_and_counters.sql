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
